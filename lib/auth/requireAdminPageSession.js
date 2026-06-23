import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ADMIN_LOGIN_PATH } from '../admin/adminRoutes.js';
import { isAuthDisabled } from './publicPaths.js';
import { resolveSessionFromCookies } from './session.js';

/**
 * Server layout guard — same session resolution as GET /api/auth/session-check.
 * Redirects to login with ?next= when there is no valid session.
 */
export async function requireAdminPageSession() {
  if (isAuthDisabled()) {
    return {
      id: 0,
      email: 'auth-disabled@local',
      displayName: 'Auth Disabled',
      role: 'super_admin',
      projectIds: [],
    };
  }

  const session = await resolveSessionFromCookies();
  if (session) return session;

  const headerStore = await headers();
  const nextPath =
    headerStore.get('x-admin-pathname') ||
    headerStore.get('x-invoke-path') ||
    headerStore.get('next-url') ||
    '';
  const loginUrl = nextPath.startsWith('/admin') && nextPath !== ADMIN_LOGIN_PATH
    ? `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`
    : ADMIN_LOGIN_PATH;

  redirect(loginUrl);
}
