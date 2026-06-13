import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getPublishChecklistForPage } from '@/services/builder/publishChecklistService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  try {
    const result = await getPublishChecklistForPage(pageId);
    if (!result) return fail('Page not found', 404);
    return ok(result);
  } catch (error) {
    return fail('Failed to build publish checklist', 500, error.message);
  }
}
