import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import {
  canManageUsers,
  revokeAdminUserSessions,
} from '@/services/admin/adminUsersService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const userId = Number(resolved.userId);
  if (!Number.isInteger(userId) || userId <= 0) return fail('Invalid userId', 400);

  const auth = await guardAdminApi(request, { action: 'manage', minRole: 'admin' });
  if (auth.error) return auth.error;
  if (!canManageUsers(auth.user)) return fail('Forbidden', 403);

  try {
    const user = await revokeAdminUserSessions(auth.user, userId);
    void recordAdminActivity({
      userId: auth.user.id,
      action: ACTIVITY_ACTIONS.USER_SESSIONS_REVOKED,
      metadata: { targetUserId: user.id, email: user.email },
    });
    return ok({ user });
  } catch (error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error);
    if (code === 'FORBIDDEN') return fail(message, 403);
    if (code === 'NOT_FOUND') return fail(message, 404);
    return fail('Failed to revoke sessions', 500, message);
  }
}
