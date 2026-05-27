import { fail, ok } from '@/lib/api';
import { revalidatePath, revalidateTag } from 'next/cache';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { getPageRoutingInfo, publishDraftToSnapshot } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  try {
    const result = await publishDraftToSnapshot(pageId);
    if (!result) return fail('Page not found', 404);

    const routeInfo = await getPageRoutingInfo(pageId);
    if (routeInfo) {
      revalidateTag(`route:${routeInfo.projectSlug}:${routeInfo.pageSlug}`);
      revalidatePath(`/${routeInfo.projectSlug}/${routeInfo.pageSlug}`);
      const preview = previewPagePath(routeInfo.projectSlug, routeInfo.pageSlug);
      if (preview) revalidatePath(preview);
    }

    return ok(result, 201);
  } catch (error) {
    return fail('Failed to publish page', 500, error.message);
  }
}
