import { fail, ok, parseJsonBody } from '@/lib/api';
import { reorderNode } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapReorderError(error) {
  if (error.message === 'Parent node not found') return fail(error.message, 404);
  if (error.message.startsWith('Invalid')) return fail(error.message, 400);
  return fail('Failed to reorder node', 500, error.message);
}

export async function PUT(request) {
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }

  const nodeId = Number(body.nodeId);
  const newIndex = Number(body.newIndex);
  const hasParent = body.newParentId !== null && body.newParentId !== undefined;
  const newParentId = hasParent ? Number(body.newParentId) : null;

  if (!Number.isInteger(nodeId) || nodeId <= 0) {
    return fail('Invalid nodeId', 400);
  }
  if (hasParent && (!Number.isInteger(newParentId) || newParentId <= 0)) {
    return fail('Invalid newParentId', 400);
  }
  if (!Number.isInteger(newIndex) || newIndex < 0) {
    return fail('Invalid newIndex', 400);
  }

  try {
    const result = await reorderNode({ nodeId, newParentId, newIndex });
    if (!result) return fail('Node not found', 404);
    return ok(result);
  } catch (error) {
    return mapReorderError(error);
  }
}
