import { fail, ok } from '@/lib/api';
import { isAuthDisabled } from '@/lib/auth/publicPaths';
import { resolveSessionFromRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lightweight session validation for middleware (no permission logic). */
export async function GET(request) {
  if (isAuthDisabled()) {
    return ok({ valid: true, role: 'super_admin' });
  }

  const user = await resolveSessionFromRequest(request);
  if (!user) return fail('Unauthorized', 401);
  return ok({ valid: true, role: user.role, userId: user.id });
}
