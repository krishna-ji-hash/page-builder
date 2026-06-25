/**
 * Legacy builder/admin routes under `/d/*` (not public site pages when project slug is `d`).
 * Public live pages use flat URLs: `/home`, `/cross-border-shipping`.
 */

const D_ADMIN_ROOT_SEGMENTS = new Set(['projects', 'builder', 'preview']);

/** `/d`, `/d/projects`, `/d/builder/…`, `/d/preview/…` — requires admin session. */
export function isDAdminPath(pathname) {
  const path = String(pathname || '');
  if (path === '/d') return true;
  if (!path.startsWith('/d/')) return false;
  const rest = path.slice(3);
  const first = rest.split('/').filter(Boolean)[0];
  if (!first) return true;
  return D_ADMIN_ROOT_SEGMENTS.has(first.toLowerCase());
}
