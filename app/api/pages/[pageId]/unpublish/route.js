import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { revalidatePath, revalidateTag } from 'next/cache';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { getPageRoutingInfo, unpublishPage } from '@/services/builder/builderService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  try {
    const result = await unpublishPage(pageId);
    if (!result) return fail('Page not found', 404);

    void recordAdminActivity({
      userId: auth.user.id,
      projectId,
      pageId,
      action: ACTIVITY_ACTIONS.PAGE_UNPUBLISHED,
      metadata: { versionId: result.unpublishedVersionId || null },
    });

    const routeInfo = await getPageRoutingInfo(pageId);
    if (routeInfo) {
      revalidateTag(`route:${routeInfo.projectSlug}:${routeInfo.pageSlug}`);
      revalidatePath(publicPagePath(routeInfo.projectSlug, routeInfo.pageSlug));
      revalidatePath(`/${routeInfo.projectSlug}/${routeInfo.pageSlug}`);
      const preview = previewPagePath(routeInfo.projectSlug, routeInfo.pageSlug);
      if (preview) revalidatePath(preview);
    }

    return ok(result);
  } catch (error) {
    return fail('Failed to unpublish page', 500, error.message);
  }
}
