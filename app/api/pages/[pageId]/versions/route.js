import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { listPageVersionHistory } from '@/services/platform/pageVersionService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  try {
    const versions = await listPageVersionHistory(pageId);
    return ok({ versions });
  } catch (error) {
    return fail('Failed to list versions', 500, error.message);
  }
}
