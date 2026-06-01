import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteMediaAsset, updateMediaAssetMetadata } from '@/services/builder/mediaService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const mediaId = Number(resolved.mediaId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(mediaId) || mediaId <= 0) return fail('Invalid mediaId', 400);

  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body', 400);

  try {
    const updated = await updateMediaAssetMetadata({
      projectId,
      mediaId,
      title: body.title ?? null,
      altText: body.altText ?? null,
      folder: body.folder,
    });
    return ok({ item: updated });
  } catch (error) {
    return fail('Failed to update media', 500, error?.message);
  }
}

export async function DELETE(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const mediaId = Number(resolved.mediaId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(mediaId) || mediaId <= 0) return fail('Invalid mediaId', 400);

  try {
    const result = await deleteMediaAsset({ projectId, mediaId });
    return ok(result);
  } catch (error) {
    return fail('Failed to delete media', 500, error?.message);
  }
}

