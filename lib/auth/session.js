import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_TTL_MS } from './constants.js';
import { readAdminSessionTokenFromCookieHeader } from './sessionCookie.js';
import { getDbPool } from '../db.js';
import { isActiveFlag, toClientId } from './clientIds.js';

export { isActiveFlag, toClientId } from './clientIds.js';

function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export async function createAdminSession(userId, meta = {}) {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = sessionExpiryDate();
  const pool = getDbPool();
  await pool.execute(
    `INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (:userId, :tokenHash, :expiresAt, :ip, :ua)`,
    {
      userId,
      tokenHash,
      expiresAt,
      ip: meta.ipAddress || null,
      ua: meta.userAgent ? String(meta.userAgent).slice(0, 512) : null,
    }
  );
  return { token, expiresAt };
}

export async function destroyAdminSession(token) {
  if (!token) return;
  const pool = getDbPool();
  await pool.execute(`DELETE FROM admin_sessions WHERE token_hash = :tokenHash`, {
    tokenHash: hashToken(token),
  });
}

export async function destroyAllUserSessions(userId) {
  const pool = getDbPool();
  await pool.execute(`DELETE FROM admin_sessions WHERE user_id = :userId`, { userId });
}

async function loadUserProjectIds(userId, role) {
  if (role === 'super_admin') return [];
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT project_id FROM admin_user_projects WHERE user_id = :userId`,
    { userId }
  );
  return rows.map((row) => toClientId(row.project_id)).filter((id) => id != null);
}

export async function resolveSessionFromToken(token) {
  if (!token) return null;
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT
       s.id AS session_id,
       s.expires_at,
       u.id,
       u.email,
       u.display_name,
       u.role,
       u.is_active
     FROM admin_sessions s
     INNER JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = :tokenHash
     LIMIT 1`,
    { tokenHash: hashToken(token) }
  );
  const row = rows[0];
  if (!row || !isActiveFlag(row.is_active)) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await pool.execute(`DELETE FROM admin_sessions WHERE id = :id`, { id: row.session_id });
    return null;
  }
  const projectIds = await loadUserProjectIds(row.id, row.role);
  return {
    id: toClientId(row.id),
    email: row.email,
    displayName: row.display_name || row.email,
    role: row.role,
    projectIds,
    sessionId: toClientId(row.session_id),
  };
}

export function readSessionTokenFromCookieHeader(cookieHeader) {
  return readAdminSessionTokenFromCookieHeader(cookieHeader);
}

export async function resolveSessionFromRequest(request) {
  const header = request?.headers?.get?.('cookie') || '';
  const token = readSessionTokenFromCookieHeader(header);
  return resolveSessionFromToken(token);
}

export async function resolveSessionFromCookies() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value || null;
  return resolveSessionFromToken(token);
}

export function sessionCookieOptions(expiresAt) {
  const secure =
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    process.env.AUTH_COOKIE_SECURE === '1' ||
    process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };
}

export async function purgeExpiredSessions() {
  const pool = getDbPool();
  // NOW() is valid in PostgreSQL and preserves previous expiry semantics.
  await pool.execute(`DELETE FROM admin_sessions WHERE expires_at <= NOW()`);
}
