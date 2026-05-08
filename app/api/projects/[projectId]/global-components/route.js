import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createGlobalComponent, listGlobalComponents } from '@/services/builder/globalComponentsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const items = await listGlobalComponents(projectId);
    return ok({ items });
  } catch (error) {
    return fail('Failed to list global components', 500, error?.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body', 400);
  try {
    const created = await createGlobalComponent({
      projectId,
      type: body.type || 'generic',
      name: body.name || '',
      snapshotNodes: Array.isArray(body.nodes) ? body.nodes : [],
    });
    return ok({ item: created }, 201);
  } catch (error) {
    return fail('Failed to create global component', 500, error?.message);
  }
}

