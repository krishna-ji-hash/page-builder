import { fail, ok, parseJsonBody } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import { revalidatePath, revalidateTag } from 'next/cache';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import {
  deletePageSafely,
  updatePageMeta,
} from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }
  try {
    const result = await updatePageMeta(pageId, {
      title: body.title,
      slug: body.slug,
    });
    if (!result) return fail('Page not found', 404);
    const { page, projectSlug, previousSlug } = result;
    if (projectSlug) {
      revalidateTag(`route:${projectSlug}:${page.slug}`);
      revalidatePath(`/${projectSlug}/${page.slug}`);
      const preview = previewPagePath(projectSlug, page.slug);
      if (preview) revalidatePath(preview);
      if (previousSlug) {
        revalidateTag(`route:${projectSlug}:${previousSlug}`);
        revalidatePath(`/${projectSlug}/${previousSlug}`);
        const prevPreview = previewPagePath(projectSlug, previousSlug);
        if (prevPreview) revalidatePath(prevPreview);
      }
    }
    return ok({ page, projectSlug, previousSlug });
  } catch (error) {
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to update page', 500, error.message);
  }
}

export async function DELETE(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const projectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
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

