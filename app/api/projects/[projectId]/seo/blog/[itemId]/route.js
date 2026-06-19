import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { patchBlogItemSeo } from '@/services/seo/seoDashboardService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const itemId = Number(resolved.itemId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(itemId) || itemId <= 0) return fail('Invalid itemId', 400);
  try {
    const body = await request.json().catch(() => ({}));
    const seo = await patchBlogItemSeo(projectId, itemId, body?.seo);
    return ok({ seo });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Blog post not found') return fail(message, 404);
    return fail('Failed to save blog SEO', 500, message);
  }
}
