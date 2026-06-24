import { redirect } from 'next/navigation';
import { isAuthDisabled } from './publicPaths.js';
import { canAccessProject } from './permissions.js';
import { resolveSessionFromCookies } from './session.js';

/**
 * Server Component guard for admin UI routes (e.g. /d/preview).
 * Redirects to login when unauthenticated; redirects home when project access denied.
 */
export async function requireAdminPageAccess(options = {}) {
  const { projectId, action = 'read', nextPath } = options;

  if (isAuthDisabled()) {
    return {
      user: {
        id: 0,
        email: 'auth-disabled@local',
        displayName: 'Auth Disabled',
        role: 'super_admin',
        projectIds: [],
      },
    };
  }

  const user = await resolveSessionFromCookies();
  if (!user) {
    const loginUrl = nextPath
      ? `/admin/login?next=${encodeURIComponent(nextPath)}`
      : '/admin/login';
    redirect(loginUrl);
  }

  if (projectId != null) {
    const pid = Number(projectId);
    if (Number.isInteger(pid) && pid > 0 && !canAccessProject(user, pid, action)) {
      redirect('/d/projects');
    }
  }

  return { user };
}
