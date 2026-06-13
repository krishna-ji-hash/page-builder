import { fail, ok, parseJsonBody } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteNode, updateNode } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseNodeId(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return NaN;
  // Accept plain numbers and strings like "node-123".
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : NaN;
}

function mapUpdateError(error) {
  if (error.message === 'Parent node not found') return fail(error.message, 404);
  if (error.message.startsWith('Invalid')) return fail(error.message, 400);
  return fail('Failed to update node', 500, error.message);
}

export async function PUT(request, { params }) {
  const auth = await guardAdminApi(request, { action: 'write' });
  if (auth.error) return auth.error;
  const resolved = await resolveMaybeAsyncParams(params);
  const nodeId = parseNodeId(resolved.id);
  if (!Number.isInteger(nodeId) || nodeId <= 0) {
    return fail('Invalid node id', 400);
  }

  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }

  try {
    const result = await updateNode(nodeId, body);
    if (!result) return fail('Node not found', 404);
    return ok(result);
  } catch (error) {
    return mapUpdateError(error);
  }
}

export async function DELETE(request, { params }) {
  const auth = await guardAdminApi(request, { action: 'write' });
  if (auth.error) return auth.error;
  const resolved = await resolveMaybeAsyncParams(params);
  const nodeId = parseNodeId(resolved.id);
  if (!Number.isInteger(nodeId) || nodeId <= 0) {
    return fail('Invalid node id', 400);
  }

  try {
    const result = await deleteNode(nodeId);
    if (!result) return fail('Node not found', 404);
    return ok(result);
  } catch (error) {
    return fail('Failed to delete node', 500, error.message);
  }
}
