import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getProjectSitemapPreview } from '@/services/seo/seoSuiteService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const origin = request.nextUrl?.origin || '';
    const sitemap = await getProjectSitemapPreview(projectId, origin);
    return ok({ sitemap });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Project not found') return fail(message, 404);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to build sitemap preview', 500, message);
  }
}
