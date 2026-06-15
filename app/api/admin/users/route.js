import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import {
  canManageUsers,
  createAdminUser,
  listAdminUsersDetailed,
} from '@/services/admin/adminUsersService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read', minRole: 'admin' });
  if (auth.error) return auth.error;
  try {
    const data = await listAdminUsersDetailed();
    return ok(data);
  } catch (error) {
    return fail('Failed to load users', 500, error.message);
  }
}

export async function POST(request) {
  const auth = await guardAdminApi(request, { action: 'manage', minRole: 'admin' });
  if (auth.error) return auth.error;
  if (!canManageUsers(auth.user)) return fail('Forbidden', 403);
  try {
    const body = await request.json();
    const user = await createAdminUser(auth.user, body);
    void recordAdminActivity({
      userId: auth.user.id,
      action: ACTIVITY_ACTIONS.USER_CREATED,
      metadata: { targetUserId: user.id, email: user.email, role: user.role },
    });
    return ok({ user }, 201);
  } catch (error) {
    const code = error?.code;
    const message = error instanceof Error ? error.message : String(error);
    if (code === 'FORBIDDEN') return fail(message, 403);
    if (code === 'VALIDATION') return fail(message, 400);
    if (code === 'CONFLICT') return fail(message, 409);
    return fail('Failed to create user', 500, message);
  }
}
