import { SESSION_COOKIE } from './constants.js';

/** Edge-safe: read admin session token from a Request (middleware) or cookie header string. */
export function readAdminSessionTokenFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=') || null;
  }
  return null;
}

export function readAdminSessionTokenFromRequest(request) {
  const fromJar = request?.cookies?.get?.(SESSION_COOKIE)?.value;
  if (fromJar) return fromJar;
  const header = request?.headers?.get?.('cookie') || '';
  return readAdminSessionTokenFromCookieHeader(header);
}

export function requestHasAdminSessionCookie(request) {
  return Boolean(readAdminSessionTokenFromRequest(request));
}
