import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { duplicateNode } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseNodeId(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return NaN;
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : NaN;
}

export async function POST(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const nodeId = parseNodeId(resolved.id);
  if (!Number.isInteger(nodeId) || nodeId <= 0) {
    return fail('Invalid node id', 400);
  }

  try {
    const result = await duplicateNode(nodeId);
    if (!result) return fail('Node not found', 404);
    return ok(result, 201);
  } catch (error) {
    return fail('Failed to duplicate node', 500, error.message);
  }
}
