import { applyAuthNoStoreHeaders } from '@/lib/auth/authHttp';
import { ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return applyAuthNoStoreHeaders(auth.error);
  return applyAuthNoStoreHeaders(
    ok({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        displayName: auth.user.displayName,
        role: auth.user.role,
        projectIds: auth.user.projectIds,
      },
    })
  );
}
