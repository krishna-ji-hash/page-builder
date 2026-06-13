import { fail, ok, parseJsonBody } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteReusableBlock, renameReusableBlock } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  const blockId = Number(resolved.blockId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(blockId) || blockId <= 0) return fail('Invalid blockId', 400);
  const body = await parseJsonBody(request);
  try {
    const block = await renameReusableBlock({ projectId, blockId, name: body?.name });
    return ok({ block });
  } catch (error) {
    if (error.message.includes('not found') || error.message.startsWith('Invalid')) {
      return fail(error.message, 400);
    }
    return fail('Failed to rename reusable block', 500, error.message);
  }
}

export async function DELETE(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  const blockId = Number(resolved.blockId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(blockId) || blockId <= 0) return fail('Invalid blockId', 400);
  try {
    const result = await deleteReusableBlock({ projectId, blockId });
    return ok(result);
  } catch (error) {
    return fail('Failed to delete reusable block', 500, error.message);
  }
}

