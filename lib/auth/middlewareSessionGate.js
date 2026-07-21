import { requestHasAdminSessionCookie } from './sessionCookie.js';

/**
 * Edge-safe gate for protected admin APIs.
 * Cookie presence only — full DB session validation stays in route handlers
 * (`guardAdminApi` / `resolveSessionFromRequest`). Avoids middleware → HTTP
 * `/api/auth/session-check` fan-out.
 *
 * @returns {{ ok: true } | { ok: false, status: 401 }}
 */
export function gateProtectedApiSession(request) {
  if (requestHasAdminSessionCookie(request)) {
    return { ok: true };
  }
  return { ok: false, status: 401 };
}
