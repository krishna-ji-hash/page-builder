import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  duplicatePageVersion,
  getPageVersionPreview,
  restorePageVersionToDraft,
} from '@/services/platform/pageVersionService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const versionId = Number(resolved.versionId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  try {
    const preview = await getPageVersionPreview(pageId, versionId);
    if (!preview) return fail('Version not found', 404);
    return ok({ preview });
  } catch (error) {
    return fail('Failed to load version preview', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const versionId = Number(resolved.versionId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  const action = request.nextUrl.searchParams.get('action');
  try {
    if (action === 'restore') {
      const result = await restorePageVersionToDraft(pageId, versionId);
      void recordAdminActivity({
        userId: auth.user.id,
        projectId,
        pageId,
        action: ACTIVITY_ACTIONS.VERSION_RESTORED,
        metadata: { versionId, versionNumber: result?.versionNumber || null },
      });
      return ok(result);
    }
    if (action === 'duplicate') {
      const result = await duplicatePageVersion(pageId, versionId);
      return ok(result);
    }
    return fail('Unknown action. Use ?action=restore|duplicate', 400);
  } catch (error) {
    return fail('Version action failed', 500, error.message);
  }
}
