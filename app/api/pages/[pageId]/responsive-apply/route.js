import { fail, ok, parseJsonBody } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { applyPageResponsiveDefaults } from '@/services/builder/builderService';

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

  const body = await parseJsonBody(request);
  const mobile = body?.mobile !== false;
  const tablet = body?.tablet !== false;

  try {
    const result = await applyPageResponsiveDefaults(pageId, { mobile, tablet });
    return ok(result);
  } catch (error) {
    return fail('Failed to apply responsive defaults', 500, error.message);
  }
}
