import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { listFormSubmissions } from '@/services/forms/formSubmissionsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const url = new URL(request.url);
  const formNodeId = url.searchParams.get('formNodeId') || '';
  const projectId = Number(url.searchParams.get('projectId'));
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('projectId query is required', 400);
  }

  const limit = Number(url.searchParams.get('limit') || 30);

  try {
    const rows = await listFormSubmissions({
      projectId,
      pageId,
      formNodeId: formNodeId || null,
      limit,
    });
    return ok({ submissions: rows });
  } catch (err) {
    return fail('Failed to load submissions', 500, err instanceof Error ? err.message : String(err));
  }
}
