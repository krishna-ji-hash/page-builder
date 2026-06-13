import { cookies } from 'next/headers';
import { fail, ok } from '@/lib/api';
import { getClientIp } from '@/lib/auth/clientIp';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { loginAdmin } from '@/services/admin/authService';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import { sessionCookieOptions } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`login:${ip}`, { max: 8, windowMs: 15 * 60_000 });
  if (!limit.allowed) {
    return fail(`Too many login attempts. Retry in ${limit.retryAfterSec}s`, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const email = String(body?.email || '').trim();
  const password = String(body?.password || '');
  if (!email || !password) return fail('Email and password are required', 400);

  try {
    const result = await loginAdmin(email, password, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    });
    if (!result) return fail('Invalid email or password', 401);

    const store = await cookies();
    store.set(SESSION_COOKIE, result.session.token, sessionCookieOptions(result.session.expiresAt));

    void recordAdminActivity({
      userId: result.user.id,
      action: ACTIVITY_ACTIONS.LOGIN,
      metadata: { ip },
    });

    return ok({
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.display_name || result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    return fail('Login failed', 500, error.message);
  }
}
