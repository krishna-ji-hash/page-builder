import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getGlobalComponent, updateGlobalComponentSnapshot } from '@/services/builder/globalComponentsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const componentId = Number(resolved.componentId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(componentId) || componentId <= 0) return fail('Invalid componentId', 400);
  try {
    const item = await getGlobalComponent(projectId, componentId);
    if (!item) return fail('Not found', 404);
    return ok({ item });
  } catch (error) {
    return fail('Failed to load global component', 500, error?.message);
  }
}

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const componentId = Number(resolved.componentId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(componentId) || componentId <= 0) return fail('Invalid componentId', 400);
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body', 400);
  try {
    const updated = await updateGlobalComponentSnapshot({
      projectId,
      componentId,
      snapshotNodes: Array.isArray(body.nodes) ? body.nodes : [],
    });
    return ok({ item: updated });
  } catch (error) {
    return fail('Failed to update global component', 500, error?.message);
  }
}

