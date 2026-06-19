import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getSearchConsoleChecklist } from '@/services/seo/seoDashboardService';

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
    const checklist = await getSearchConsoleChecklist(projectId, origin);
    return ok({ checklist });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('Failed to load Search Console checklist', 500, message);
  }
}
