import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { saveAnimationPresets } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json();
    const animationPresets = body?.animationPresets;
    const ifRevision = body?.ifRevision;
    if (animationPresets == null || typeof animationPresets !== 'object' || Array.isArray(animationPresets)) {
      return fail('Invalid animationPresets', 400);
    }
    const ifRev = ifRevision === undefined || ifRevision === null ? undefined : Number(ifRevision);
    if (ifRevision !== undefined && ifRevision !== null && !Number.isInteger(ifRev)) {
      return fail('Invalid ifRevision', 400);
    }
    const normalized = await saveAnimationPresets({ projectId, animationPresets, ifRevision: ifRev });
    return ok({ animationPresets: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error?.code;
    if (code === 'REVISION_CONFLICT' || message === 'REVISION_CONFLICT') {
      return fail('Animation presets were modified elsewhere', 409);
    }
    if (message === 'Project not found') return fail(message, 404);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to save animation presets', 500, message);
  }
}
