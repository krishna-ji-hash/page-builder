import { fail, ok, parseJsonBody } from '@/lib/api';
import { syncDraftSnapshot } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request) {
  const body = await parseJsonBody(request);
  const pageId = Number(body?.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const clientTree = Array.isArray(body?.nodes) && body.nodes.length ? body.nodes : null;

  try {
    const result = await syncDraftSnapshot(pageId, clientTree);
    return ok(result);
  } catch (error) {
    return fail('Failed to sync draft snapshot', 500, error.message);
  }
}
