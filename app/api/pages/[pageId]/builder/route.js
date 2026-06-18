import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getBuilderState } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  try {
    const data = await getBuilderState(pageId);
    if (!data) return fail('Page not found', 404);
    return ok(data);
  } catch (error) {
    return fail('Failed to load builder state', 500, error.message);
  }
}
