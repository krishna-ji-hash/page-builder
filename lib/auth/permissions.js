import { ROLE_RANK, ROLES } from './constants.js';

const WRITE_ROLES = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]);
const MANAGE_ROLES = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN;
}

export function canRead(user) {
  return Boolean(user?.role);
}

export function canWrite(user) {
  return WRITE_ROLES.has(user?.role);
}

export function canManageProject(user) {
  return MANAGE_ROLES.has(user?.role);
}

export function hasMinRole(user, minRole) {
  const userRank = ROLE_RANK[user?.role] || 0;
  const minRank = ROLE_RANK[minRole] || 0;
  return userRank >= minRank;
}

/**
 * @param {object} user - session user with optional projectIds[]
 * @param {number|null} projectId
 * @param {'read'|'write'|'manage'} action
 */
export function canAccessProject(user, projectId, action = 'read') {
  if (!user?.role) return false;
  if (isSuperAdmin(user)) return true;

  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) {
    return action === 'read' ? canRead(user) : canManageProject(user);
  }

  const assigned = Array.isArray(user.projectIds) ? user.projectIds : [];
  if (!assigned.includes(pid)) return false;

  if (action === 'read') return canRead(user);
  if (action === 'write') return canWrite(user);
  if (action === 'manage') return canManageProject(user);
  return false;
}

export function permissionDeniedMessage(action) {
  if (action === 'manage') return 'Insufficient permissions to manage this project';
  if (action === 'write') return 'Insufficient permissions to edit this project';
  return 'Insufficient permissions to view this project';
}
