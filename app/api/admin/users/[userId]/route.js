import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import {
  canManageUsers,
  deleteAdminUser,
  updateAdminUser,
} from '@/services/admin/adminUsersService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const userId = Number(resolved.userId);
  if (!Number.isInteger(userId) || userId <= 0) return fail('Invalid userId', 400);

  const auth = await guardAdminApi(request, { action: 'manage', minRole: 'admin' });
  if (auth.error) return auth.error;
  if (!canManageUsers(auth.user)) return fail('Forbidden', 403);

  try {
    const body = await request.json();
    const user = await updateAdminUser(auth.user, userId, body);
    void recordAdminActivity({
      userId: auth.user.id,
      action: ACTIVITY_ACTIONS.USER_UPDATED,
      metadata: { targetUserId: user.id, email: user.email, role: user.role, isActive: user.isActive },
    });
    return ok({ user });
  } catch (error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error);
    if (code === 'FORBIDDEN') return fail(message, 403);
    if (code === 'VALIDATION') return fail(message, 400);
    if (code === 'NOT_FOUND') return fail(message, 404);
    return fail('Failed to update user', 500, message);
  }
}

export async function DELETE(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const userId = Number(resolved.userId);
  if (!Number.isInteger(userId) || userId <= 0) return fail('Invalid userId', 400);

  const auth = await guardAdminApi(request, { action: 'manage', minRole: 'admin' });
  if (auth.error) return auth.error;
  if (!canManageUsers(auth.user)) return fail('Forbidden', 403);

  try {
    const removed = await deleteAdminUser(auth.user, userId);
    void recordAdminActivity({
      userId: auth.user.id,
      action: ACTIVITY_ACTIONS.USER_DELETED,
      metadata: { targetUserId: removed.id, email: removed.email },
    });
    return ok({ removed });
  } catch (error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error);
    if (code === 'FORBIDDEN') return fail(message, 403);
    if (code === 'VALIDATION') return fail(message, 400);
    if (code === 'NOT_FOUND') return fail(message, 404);
    return fail('Failed to delete user', 500, message);
  }
}
