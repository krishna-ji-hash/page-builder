import { ROLE_RANK, ROLES } from '@/lib/auth/constants.js';
import { hashPassword } from '@/lib/auth/password.js';
import { validateNewPassword } from '@/lib/auth/passwordPolicy.js';
import {
  canAssignRole,
  canManageTargetUser,
  canManageUsers,
} from '@/lib/admin/adminUserPolicy.js';
import { destroyAllUserSessions } from '@/lib/auth/session.js';
import { getDbPool } from '@/lib/db.js';
import { findAdminUserByEmail } from '@/services/admin/authService.js';

const VALID_ROLES = new Set(Object.values(ROLES));

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeRole(role) {
  const r = String(role || '').trim().toLowerCase();
  return VALID_ROLES.has(r) ? r : null;
}

export { canAssignRole, canManageTargetUser, canManageUsers };

function mapUserRow(row) {
  return {
    id: Number(row.id),
    email: row.email,
    displayName: row.display_name || row.email,
    role: row.role,
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    activeSessions: Number(row.active_sessions || 0),
  };
}

async function loadProjectAssignments() {
  const pool = getDbPool();
  const [rows] = await pool.execute(`SELECT user_id, project_id FROM admin_user_projects`);
  const byUser = new Map();
  for (const row of rows) {
    const uid = Number(row.user_id);
    const pid = Number(row.project_id);
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid).push(pid);
  }
  return byUser;
}

async function loadProjectsList() {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, name, title, slug FROM projects ORDER BY name ASC, id ASC`
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name || row.title || `Project #${row.id}`,
    slug: row.slug,
  }));
}

export async function listAdminUsersDetailed() {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.last_login_at, u.created_at,
            (SELECT COUNT(*) FROM admin_sessions s
             WHERE s.user_id = u.id AND s.expires_at > NOW()) AS active_sessions
     FROM admin_users u
     ORDER BY u.created_at ASC, u.id ASC`
  );
  const assignments = await loadProjectAssignments();
  const users = rows.map((row) => {
    const user = mapUserRow(row);
    return { ...user, projectIds: assignments.get(user.id) || [] };
  });
  const projects = await loadProjectsList();
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === ROLES.SUPER_ADMIN || u.role === ROLES.ADMIN).length,
    editors: users.filter((u) => u.role === ROLES.EDITOR).length,
    viewers: users.filter((u) => u.role === ROLES.VIEWER).length,
    sessions: users.reduce((sum, u) => sum + u.activeSessions, 0),
  };
  return { users, projects, stats };
}

async function getUserRecord(userId) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT id, email, display_name, role, is_active, last_login_at, created_at
     FROM admin_users WHERE id = :id LIMIT 1`,
    { id: Number(userId) }
  );
  const row = rows[0];
  if (!row) return null;
  const assignments = await loadProjectAssignments();
  return {
    ...mapUserRow({ ...row, active_sessions: 0 }),
    projectIds: assignments.get(Number(row.id)) || [],
  };
}

async function replaceUserProjects(userId, projectIds) {
  const pool = getDbPool();
  const uid = Number(userId);
  const ids = [...new Set((projectIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  await pool.execute(`DELETE FROM admin_user_projects WHERE user_id = :userId`, { userId: uid });
  for (const projectId of ids) {
    await pool.execute(
      `INSERT INTO admin_user_projects (user_id, project_id) VALUES (:userId, :projectId)`,
      { userId: uid, projectId }
    );
  }
}

async function countActiveSuperAdmins(excludeUserId = null) {
  const pool = getDbPool();
  const params = [];
  let sql = `SELECT COUNT(*) AS c FROM admin_users WHERE role = 'super_admin' AND is_active = 1`;
  if (excludeUserId != null) {
    sql += ` AND id <> ?`;
    params.push(Number(excludeUserId));
  }
  const [rows] = await pool.query(sql, params);
  return Number(rows[0]?.c || 0);
}

export async function createAdminUser(actor, payload) {
  if (!canManageUsers(actor)) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

  const email = normalizeEmail(payload?.email);
  const displayName = String(payload?.displayName || '').trim().slice(0, 128);
  const role = normalizeRole(payload?.role) || ROLES.EDITOR;
  const password = String(payload?.password || '');

  if (!email || !email.includes('@')) throw Object.assign(new Error('Valid email is required'), { code: 'VALIDATION' });
  if (!displayName) throw Object.assign(new Error('Display name is required'), { code: 'VALIDATION' });
  if (!canAssignRole(actor, role)) throw Object.assign(new Error('Cannot assign this role'), { code: 'FORBIDDEN' });

  const passwordCheck = validateNewPassword(password);
  if (!passwordCheck.ok) throw Object.assign(new Error(passwordCheck.error), { code: 'VALIDATION' });

  const existing = await findAdminUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already in use'), { code: 'CONFLICT' });

  const passwordHash = await hashPassword(password);
  const pool = getDbPool();
  const [result] = await pool.execute(
    `INSERT INTO admin_users (email, password_hash, display_name, role, is_active)
     VALUES (:email, :passwordHash, :displayName, :role, 1)`,
    { email, passwordHash, displayName, role }
  );
  const userId = Number(result.insertId);
  if (role !== ROLES.SUPER_ADMIN) {
    await replaceUserProjects(userId, payload?.projectIds);
  }
  return getUserRecord(userId);
}

export async function updateAdminUser(actor, userId, payload) {
  if (!canManageUsers(actor)) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

  const target = await getUserRecord(userId);
  if (!target) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  if (!canManageTargetUser(actor, target)) {
    throw Object.assign(new Error('Cannot modify this user'), { code: 'FORBIDDEN' });
  }

  const isSelf = Number(actor.id) === Number(userId);
  const nextRole = payload?.role != null ? normalizeRole(payload.role) : target.role;
  if (!nextRole) throw Object.assign(new Error('Invalid role'), { code: 'VALIDATION' });
  if (payload?.role != null && !canAssignRole(actor, nextRole)) {
    throw Object.assign(new Error('Cannot assign this role'), { code: 'FORBIDDEN' });
  }

  const nextActive = payload?.isActive != null ? Boolean(payload.isActive) : target.isActive;
  if (isSelf && !nextActive) {
    throw Object.assign(new Error('You cannot deactivate your own account'), { code: 'VALIDATION' });
  }
  if (isSelf && nextRole !== target.role && target.role === ROLES.SUPER_ADMIN) {
    throw Object.assign(new Error('You cannot change your own super admin role'), { code: 'VALIDATION' });
  }
  if (target.role === ROLES.SUPER_ADMIN && !nextActive) {
    const others = await countActiveSuperAdmins(userId);
    if (others < 1) {
      throw Object.assign(new Error('At least one active super admin is required'), { code: 'VALIDATION' });
    }
  }

  const displayName =
    payload?.displayName != null ? String(payload.displayName).trim().slice(0, 128) : target.displayName;
  if (!displayName) throw Object.assign(new Error('Display name is required'), { code: 'VALIDATION' });

  const pool = getDbPool();
  await pool.execute(
    `UPDATE admin_users SET display_name = :displayName, role = :role, is_active = :isActive WHERE id = :id`,
    {
      id: Number(userId),
      displayName,
      role: nextRole,
      isActive: nextActive ? 1 : 0,
    }
  );

  if (payload?.password) {
    const passwordCheck = validateNewPassword(payload.password);
    if (!passwordCheck.ok) throw Object.assign(new Error(passwordCheck.error), { code: 'VALIDATION' });
    const passwordHash = await hashPassword(payload.password);
    await pool.execute(`UPDATE admin_users SET password_hash = :passwordHash WHERE id = :id`, {
      id: Number(userId),
      passwordHash,
    });
  }

  if (nextRole !== ROLES.SUPER_ADMIN && payload?.projectIds != null) {
    await replaceUserProjects(userId, payload.projectIds);
  }
  if (nextRole === ROLES.SUPER_ADMIN) {
    await replaceUserProjects(userId, []);
  }

  if (!nextActive) {
    await destroyAllUserSessions(userId);
  }

  return getUserRecord(userId);
}

export async function revokeAdminUserSessions(actor, userId) {
  if (!canManageUsers(actor)) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
  const target = await getUserRecord(userId);
  if (!target) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  if (!canManageTargetUser(actor, target)) {
    throw Object.assign(new Error('Cannot modify this user'), { code: 'FORBIDDEN' });
  }
  await destroyAllUserSessions(userId);
  return getUserRecord(userId);
}

async function countSuperAdmins(excludeUserId = null) {
  const pool = getDbPool();
  const params = [];
  let sql = `SELECT COUNT(*) AS c FROM admin_users WHERE role = 'super_admin'`;
  if (excludeUserId != null) {
    sql += ` AND id <> ?`;
    params.push(Number(excludeUserId));
  }
  const [rows] = await pool.query(sql, params);
  return Number(rows[0]?.c || 0);
}

/** Permanently delete user from database (sessions + project links cascade). */
export async function deleteAdminUser(actor, userId) {
  if (!canManageUsers(actor)) throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });

  const uid = Number(userId);
  if (Number(actor.id) === uid) {
    throw Object.assign(new Error('You cannot delete your own account'), { code: 'VALIDATION' });
  }

  const target = await getUserRecord(uid);
  if (!target) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  if (!canManageTargetUser(actor, target)) {
    throw Object.assign(new Error('Cannot delete this user'), { code: 'FORBIDDEN' });
  }

  if (target.role === ROLES.SUPER_ADMIN) {
    const remaining = await countSuperAdmins(uid);
    if (remaining < 1) {
      throw Object.assign(new Error('Cannot delete the last super admin'), { code: 'VALIDATION' });
    }
  }

  await destroyAllUserSessions(uid);
  const pool = getDbPool();
  await pool.execute(`DELETE FROM admin_users WHERE id = :id`, { id: uid });

  return {
    id: target.id,
    email: target.email,
    displayName: target.displayName,
  };
}
