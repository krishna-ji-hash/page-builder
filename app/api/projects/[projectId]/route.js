import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteProjectSafely, updateProjectMeta } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('Invalid projectId', 400);
  }
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }
  try {
    const project = await updateProjectMeta(projectId, {
      name: body.name,
      slug: body.slug,
    });
    if (!project) return fail('Project not found', 404);
    return ok({ project });
  } catch (error) {
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to update project', 500, error.message);
  }
}

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

