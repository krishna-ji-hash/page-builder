import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createNode } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }
  if (!body.nodeType || typeof body.nodeType !== 'string') {
    return fail('nodeType is required', 400);
  }

  try {
    const result = await createNode(pageId, body);
    return ok(result, 201);
  } catch (error) {
    if (error.message === 'Parent node not found') return fail(error.message, 404);
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (/locked/i.test(error.message)) return fail(error.message, 400);
    return fail('Failed to create node', 500, error.message);
  }
}
