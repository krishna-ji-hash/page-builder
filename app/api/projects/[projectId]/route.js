import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteProjectSafely } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('Invalid projectId', 400);
  }
  try {
    const result = await deleteProjectSafely(projectId);
    if (!result) return fail('Project not found', 404);
    return ok(result);
  } catch (error) {
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    return fail('Failed to delete project', 500, error.message);
  }
}

