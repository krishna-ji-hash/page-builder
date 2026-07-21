import { authFail, authOk } from '@/lib/auth/authHttp';
import { isAuthDisabled } from '@/lib/auth/publicPaths';
import { resolveSessionFromRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lightweight session validation (no permission logic). Private, no-store. */
export async function GET(request) {
  if (isAuthDisabled()) {
    return authOk({ valid: true, role: 'super_admin' });
  }

  const user = await resolveSessionFromRequest(request);
  if (!user) return authFail('Unauthorized', 401);
  return authOk({ valid: true, role: user.role, userId: user.id });
}
