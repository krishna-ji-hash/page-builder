/** API routes that must stay public (live site, forms, middleware host resolution). */
const PUBLIC_API_PREFIXES = [
  '/api/forms/submit',
  '/api/runtime/',
  '/api/platform/resolve-host',
  '/api/auth/login',
  '/api/auth/session-check',
];

export function isPublicApiPath(pathname, method = 'GET') {
  const path = String(pathname || '');
  const verb = String(method || 'GET').toUpperCase();

  if (path === '/api/forms/analytics' && verb === 'POST') return true;
  if (path.startsWith('/api/forms/analytics')) return false;

  return PUBLIC_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function isAdminPagePath(pathname) {
  const path = String(pathname || '');
  return path === '/admin' || path.startsWith('/admin/');
}

export function isAdminLoginPath(pathname) {
  const path = String(pathname || '');
  return path === '/admin/login';
}

export function isProtectedAdminPath(pathname) {
  return isAdminPagePath(pathname) && !isAdminLoginPath(pathname);
}

export function isProtectedApiPath(pathname, method = 'GET') {
  const path = String(pathname || '');
  if (!path.startsWith('/api/')) return false;
  if (isPublicApiPath(path, method)) return false;
  if (path.startsWith('/api/auth/')) {
    return (
      path === '/api/auth/logout' ||
      path === '/api/auth/me' ||
      path === '/api/auth/change-password'
    );
  }
  return true;
}

export function isAuthDisabled() {
  return process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1';
}
