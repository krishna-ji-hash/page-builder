import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { saveThemeTokens } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json();
    const themeTokens = body?.themeTokens;
    const ifRevision = body?.ifRevision;
    if (themeTokens == null || typeof themeTokens !== 'object' || Array.isArray(themeTokens)) {
      return fail('Invalid themeTokens', 400);
    }
    const ifRev =
      ifRevision === undefined || ifRevision === null ? undefined : Number(ifRevision);
    if (ifRevision !== undefined && ifRevision !== null && !Number.isInteger(ifRev)) {
      return fail('Invalid ifRevision', 400);
    }
    const normalized = await saveThemeTokens({ projectId, themeTokens, ifRevision: ifRev });
    return ok({ themeTokens: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error?.code;
    if (code === 'REVISION_CONFLICT' || message === 'REVISION_CONFLICT') {
      return fail('Theme tokens were modified elsewhere', 409);
    }
    if (message === 'Project not found') return fail(message, 404);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to save theme tokens', 500, message);
  }
}

