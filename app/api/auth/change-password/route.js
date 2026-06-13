import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { getClientIp } from '@/lib/auth/clientIp';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { changeAdminPassword } from '@/services/admin/authService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const limit = checkRateLimit(`change-password:${auth.user.id}:${ip}`, {
    max: 5,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    return fail(`Too many attempts. Retry in ${limit.retryAfterSec}s`, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const currentPassword = String(body?.currentPassword || '');
  const newPassword = String(body?.newPassword || '');
  const confirmPassword = String(body?.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return fail('All password fields are required', 400);
  }
  if (newPassword !== confirmPassword) {
    return fail('New password and confirmation do not match', 400);
  }

  try {
    const result = await changeAdminPassword(auth.user.id, currentPassword, newPassword);
    if (!result.ok) return fail(result.error || 'Password change failed', 400);

    void recordAdminActivity({
      userId: auth.user.id,
      action: ACTIVITY_ACTIONS.PASSWORD_CHANGED,
      metadata: { ip },
    });

    return ok({ changed: true });
  } catch (error) {
    return fail('Password change failed', 500, error.message);
  }
}
