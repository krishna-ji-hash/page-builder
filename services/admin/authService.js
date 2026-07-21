import { hashPassword, verifyPassword } from '../../lib/auth/password.js';
import { validateNewPassword } from '../../lib/auth/passwordPolicy.js';
import { isActiveFlag, toClientId } from '../../lib/auth/clientIds.js';
import { createAdminSession, destroyAdminSession } from '../../lib/auth/session.js';
import { getDbPool } from '../../lib/db.js';

/** PostgreSQL unique_violation, or wrapper mysqlCode alias. */
export function isUniqueViolation(error) {
  return error?.code === '23505' || error?.mysqlCode === 'ER_DUP_ENTRY';
}

export async function findAdminUserByEmail(email) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT id, email, password_hash, display_name, role, is_active
     FROM admin_users WHERE email = :email LIMIT 1`,
    { email: String(email).trim().toLowerCase() }
  );
  return rows[0] || null;
}

export async function getAdminUserById(userId) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT id, email, display_name, role, is_active, last_login_at, created_at
     FROM admin_users WHERE id = :id LIMIT 1`,
    { id: userId }
  );
  return rows[0] || null;
}

export async function authenticateAdmin(email, password) {
  const user = await findAdminUserByEmail(email);
  if (!user || !isActiveFlag(user.is_active)) return null;
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;
  return user;
}

export async function loginAdmin(email, password, meta = {}) {
  const user = await authenticateAdmin(email, password);
  if (!user) return null;

  const pool = getDbPool();
  // NOW() is valid PostgreSQL; keeps prior last_login semantics.
  await pool.execute(`UPDATE admin_users SET last_login_at = NOW() WHERE id = :id`, { id: user.id });

  const session = await createAdminSession(user.id, meta);
  return { user, session };
}

export async function logoutAdmin(token) {
  await destroyAdminSession(token);
}

export async function changeAdminPassword(userId, currentPassword, newPassword) {
  const validation = validateNewPassword(newPassword, currentPassword);
  if (!validation.ok) return { ok: false, error: validation.error };

  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT id, password_hash, is_active FROM admin_users WHERE id = :id LIMIT 1`,
    { id: toClientId(userId) }
  );
  const user = rows[0];
  if (!user || !isActiveFlag(user.is_active)) return { ok: false, error: 'User not found' };

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) return { ok: false, error: 'Current password is incorrect' };

  const passwordHash = await hashPassword(newPassword);
  await pool.execute(`UPDATE admin_users SET password_hash = :passwordHash WHERE id = :id`, {
    id: user.id,
    passwordHash,
  });

  return { ok: true };
}

export async function ensureBootstrapAdmin() {
  const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@localhost').trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!password) return null;

  const existing = await findAdminUserByEmail(email);
  if (existing) return existing;

  const passwordHash = await hashPassword(password);
  const displayName = process.env.ADMIN_BOOTSTRAP_NAME || 'Super Admin';
  const pool = getDbPool();
  try {
    const [result] = await pool.execute(
      `INSERT INTO admin_users (email, password_hash, display_name, role)
       VALUES (:email, :passwordHash, :displayName, 'super_admin')
       RETURNING id`,
      { email, passwordHash, displayName }
    );
    return {
      id: toClientId(result.insertId),
      email,
      display_name: displayName,
      role: 'super_admin',
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return findAdminUserByEmail(email);
    }
    throw error;
  }
}

export async function listAdminUsers() {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT id, email, display_name, role, is_active, last_login_at, created_at
     FROM admin_users ORDER BY created_at ASC`
  );
  return rows;
}
