import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getRolesOverview } from '@/services/admin/adminRolesService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read', minRole: 'admin' });
  if (auth.error) return auth.error;
  try {
    const data = await getRolesOverview();
    return ok(data);
  } catch (error) {
    return fail('Failed to load roles', 500, error.message);
  }
}
