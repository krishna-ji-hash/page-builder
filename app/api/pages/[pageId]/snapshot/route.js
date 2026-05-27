import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { saveDraftPage } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const body = await parseJsonBody(request);
  if (!Array.isArray(body?.nodes)) {
    return fail('Invalid nodes payload', 400);
  }

  try {
    const result = await saveDraftPage(pageId, body.nodes);
    return ok(result);
  } catch (error) {
    return fail('Failed to save draft snapshot', 500, error.message);
  }
}
