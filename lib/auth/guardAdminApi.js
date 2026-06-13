import { fail } from '../api.js';
import { verifyAdminMutationOrigin } from './csrf.js';
import { isAuthDisabled } from './publicPaths.js';
import { canAccessProject, permissionDeniedMessage } from './permissions.js';
import { resolveSessionFromRequest } from './session.js';

/**
 * Guard admin API routes. Returns { user } or { error: NextResponse }.
 */
export async function guardAdminApi(request, options = {}) {
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

  const csrf = verifyAdminMutationOrigin(request);
  if (!csrf.ok) {
    return { error: fail('Forbidden', 403, csrf.reason) };
  }

  const user = await resolveSessionFromRequest(request);
  if (!user) {
    return { error: fail('Unauthorized', 401) };
  }

  const { projectId, action = 'read', minRole } = options;
  if (minRole && user.role !== 'super_admin') {
    const ranks = { viewer: 1, editor: 2, admin: 3, super_admin: 4 };
    if ((ranks[user.role] || 0) < (ranks[minRole] || 0)) {
      return { error: fail('Forbidden', 403) };
    }
  }

  if (projectId != null) {
    const pid = Number(projectId);
    if (!canAccessProject(user, pid, action)) {
      return { error: fail(permissionDeniedMessage(action), 403) };
    }
  }

  return { user };
}

/**
 * Guard admin API routes that mutate pages (need page's project resolved by caller).
 */
export async function guardPageApi(request, projectId, action = 'write') {
  return guardAdminApi(request, { projectId, action });
}
