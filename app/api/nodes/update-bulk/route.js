import { fail, ok, parseJsonBody } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { syncDraftSnapshot } from '@/services/builder/builderService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function PUT(request) {
  const body = await parseJsonBody(request);
  const pageId = Number(body?.pageId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const clientTree = Array.isArray(body?.nodes) && body.nodes.length ? body.nodes : null;

  try {
    const result = await syncDraftSnapshot(pageId, clientTree);
    void recordAdminActivity({
      userId: auth.user.id,
      projectId,
      pageId,
      action: ACTIVITY_ACTIONS.DRAFT_SAVED,
      metadata: { nodeCount: Array.isArray(clientTree) ? clientTree.length : null },
    });
    return ok(result);
  } catch (error) {
    return fail('Failed to sync draft snapshot', 500, error.message);
  }
}
