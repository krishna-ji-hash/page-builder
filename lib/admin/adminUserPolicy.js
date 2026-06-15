import { ROLE_RANK, ROLES } from '../auth/constants.js';
import { isSuperAdmin } from '../auth/permissions.js';

function actorRank(actor) {
  return ROLE_RANK[actor?.role] || 0;
}

export function canManageUsers(actor) {
  return isSuperAdmin(actor) || actor?.role === ROLES.ADMIN;
}

export function canManageTargetUser(actor, target) {
  if (!canManageUsers(actor)) return false;
  if (isSuperAdmin(actor)) return true;
  if (!target) return true;
  if (target.role === ROLES.SUPER_ADMIN) return false;
  return actorRank(target) < actorRank(actor);
}

export function canAssignRole(actor, role) {
  const next = String(role || '').trim().toLowerCase();
  if (!Object.values(ROLES).includes(next)) return false;
  if (isSuperAdmin(actor)) return true;
  return actorRank({ role: next }) < actorRank(actor);
}
