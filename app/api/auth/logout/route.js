import { cookies } from 'next/headers';
import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { logoutAdmin } from '@/services/admin/authService';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import { sessionCookieOptions } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return auth.error;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  try {
    if (token) await logoutAdmin(token);
    void recordAdminActivity({
      userId: auth.user.id,
      action: ACTIVITY_ACTIONS.LOGOUT,
    });
    store.set(SESSION_COOKIE, '', { ...sessionCookieOptions(new Date(0)), maxAge: 0 });
    return ok({ loggedOut: true });
  } catch (error) {
    return fail('Logout failed', 500, error.message);
  }
}
