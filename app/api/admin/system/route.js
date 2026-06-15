import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getSystemOverview } from '@/services/admin/systemOverviewService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read', minRole: 'admin' });
  if (auth.error) return auth.error;
  try {
    const overview = await getSystemOverview();
    return ok(overview);
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return ok({
        stats: {
          totalEvents: 0,
          todayEvents: 0,
          weekEvents: 0,
          uniqueActors: 0,
          activeUsers: 0,
          projects: 0,
        },
        topActions: [],
        retention: 'database',
        auditStatus: 'pending',
        warning: 'Activity log table not migrated yet.',
      });
    }
    return fail('Failed to load system overview', 500, error.message);
  }
}
