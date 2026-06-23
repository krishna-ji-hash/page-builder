import { cookies } from 'next/headers';
import { ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { resolveSessionFromToken, sessionCookieOptions } from '@/lib/auth/session';
import { logoutAdmin } from '@/services/admin/authService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clearSessionCookie(store) {
  store.set(SESSION_COOKIE, '', { ...sessionCookieOptions(new Date(0)), maxAge: 0 });
}

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value || null;

  try {
    if (token) {
      const user = await resolveSessionFromToken(token);
      await logoutAdmin(token);
      if (user?.id) {
        void recordAdminActivity({
          userId: user.id,
          action: ACTIVITY_ACTIONS.LOGOUT,
        });
      }
    }
  } catch {
    /* still clear cookie below */
  }

  clearSessionCookie(store);
  return ok({ loggedOut: true });
}
