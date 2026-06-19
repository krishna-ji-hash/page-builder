import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { patchProjectPageSeo } from '@/services/seo/seoDashboardService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const pageId = Number(resolved.pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId', 400);
  try {
    const body = await request.json().catch(() => ({}));
    const seo = await patchProjectPageSeo(projectId, pageId, body?.seo);
    return ok({ seo });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Page not found in project') return fail(message, 404);
    return fail('Failed to save page SEO', 500, message);
  }
}
