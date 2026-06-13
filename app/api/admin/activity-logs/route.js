import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { listAdminActivityLogs } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  const action = url.searchParams.get('action');

  const auth = await guardAdminApi(request, {
    projectId: projectId ? Number(projectId) : undefined,
    action: 'read',
    minRole: projectId ? undefined : 'admin',
  });
  if (auth.error) return auth.error;

  try {
    const logs = await listAdminActivityLogs({
      projectId: projectId ? Number(projectId) : null,
      limit,
      offset,
      action,
    });
    return ok({ logs });
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return ok({ logs: [], warning: 'Activity log table not migrated yet.' });
    }
    return fail('Failed to load activity logs', 500, error.message);
  }
}
