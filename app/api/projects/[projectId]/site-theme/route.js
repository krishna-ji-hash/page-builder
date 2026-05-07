import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { saveSiteTheme } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json();
    const siteTheme = body?.siteTheme;
    const ifRevision = body?.ifRevision;
    if (siteTheme == null || typeof siteTheme !== 'object' || Array.isArray(siteTheme)) {
      return fail('Invalid siteTheme', 400);
    }
    const ifRev =
      ifRevision === undefined || ifRevision === null
        ? undefined
        : Number(ifRevision);
    if (ifRevision !== undefined && ifRevision !== null && !Number.isInteger(ifRev)) {
      return fail('Invalid ifRevision', 400);
    }
    const normalized = await saveSiteTheme({ projectId, siteTheme, ifRevision: ifRev });
    return ok({ siteTheme: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error?.code;
    if (code === 'REVISION_CONFLICT' || message === 'REVISION_CONFLICT') {
      return fail('Site theme was modified elsewhere', 409);
    }
    if (message === 'Project not found') return fail(message, 404);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to save site theme', 500, message);
  }
}
