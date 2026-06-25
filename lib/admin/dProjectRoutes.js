import {
  ADMIN_PROJECT_NEW_PATH,
  ADMIN_PROJECTS_PATH,
  adminActivePathOpts,
  adminProjectSectionPath,
} from '@/lib/admin/adminRoutes';

export { ADMIN_PROJECT_NEW_PATH, ADMIN_PROJECTS_PATH };

/** @deprecated Use ADMIN_PROJECTS_PATH — kept for legacy /d redirects. */
export const D_PROJECTS_PATH = ADMIN_PROJECTS_PATH;
export const D_PROJECT_NEW_PATH = ADMIN_PROJECT_NEW_PATH;

function resolveProjectRef(ref) {
  if (ref != null && typeof ref === 'object') return ref;
  const id = Number(ref);
  return Number.isInteger(id) && id > 0 ? { id } : null;
}

export function dProjectPagesPath(projectRef, active) {
  const ref = resolveProjectRef(projectRef);
  if (!ref) return ADMIN_PROJECTS_PATH;
  return adminProjectSectionPath(ref, 'pages', adminActivePathOpts(active));
}

export function dProjectMenusPath(projectRef, active) {
  const ref = resolveProjectRef(projectRef);
  if (!ref) return ADMIN_PROJECTS_PATH;
  return adminProjectSectionPath(ref, 'menus', adminActivePathOpts(active));
}

export function dProjectMediaPath(projectRef, active) {
  const ref = resolveProjectRef(projectRef);
  if (!ref) return ADMIN_PROJECTS_PATH;
  return adminProjectSectionPath(ref, 'media', adminActivePathOpts(active));
}

export function dProjectDomainsPath(projectRef, active) {
  const ref = resolveProjectRef(projectRef);
  if (!ref) return ADMIN_PROJECTS_PATH;
  return adminProjectSectionPath(ref, 'domains', adminActivePathOpts(active));
}
