import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getSeoDashboardOverview } from '@/services/seo/seoDashboardService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const origin = request.nextUrl?.origin || '';
    const dashboard = await getSeoDashboardOverview(projectId, origin);
    return ok({ dashboard });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Project not found') return fail(message, 404);
    return fail('Failed to load SEO dashboard', 500, message);
  }
}
