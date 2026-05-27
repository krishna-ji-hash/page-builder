import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { applyPageResponsiveDefaults } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const body = await parseJsonBody(request);
  const mobile = body?.mobile !== false;
  const tablet = body?.tablet !== false;

  try {
    const result = await applyPageResponsiveDefaults(pageId, { mobile, tablet });
    return ok(result);
  } catch (error) {
    return fail('Failed to apply responsive defaults', 500, error.message);
  }
}
