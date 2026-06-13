export const SESSION_COOKIE = 'bld_admin_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
});

export const ROLE_RANK = Object.freeze({
  viewer: 1,
  editor: 2,
  admin: 3,
  super_admin: 4,
});
