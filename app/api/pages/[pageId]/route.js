import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  deletePageSafely,
  updatePageMeta,
} from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }
  try {
    const page = await updatePageMeta(pageId, {
      title: body.title,
      slug: body.slug,
    });
    if (!page) return fail('Page not found', 404);
    return ok({ page });
  } catch (error) {
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to update page', 500, error.message);
  }
}

export async function DELETE(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }
  try {
    const result = await deletePageSafely(pageId);
    if (!result) return fail('Page not found', 404);
    return ok(result);
  } catch (error) {
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('last page')) return fail(error.message, 409);
    return fail('Failed to delete page', 500, error.message);
  }
}

