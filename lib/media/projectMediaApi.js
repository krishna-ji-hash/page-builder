/**
 * Project media API paths — admin routes with legacy fallback.
 */

export function adminProjectMediaListUrl(projectId) {
  return `/api/admin/projects/${projectId}/media`;
}

export function adminProjectMediaUploadUrl(projectId) {
  return `/api/admin/projects/${projectId}/media/upload`;
}

export function adminMediaDeleteUrl(mediaId) {
  return `/api/admin/media/${mediaId}`;
}

export function legacyProjectMediaListUrl(projectId) {
  return `/api/projects/${projectId}/media`;
}

export function legacyProjectMediaUploadUrl(projectId) {
  return `/api/projects/${projectId}/media`;
}

export function legacyProjectMediaDeleteUrl(projectId, mediaId) {
  return `/api/projects/${projectId}/media/${mediaId}`;
}

export function projectMediaListUrl(projectId) {
  return adminProjectMediaListUrl(projectId);
}

export function projectMediaUploadUrl(projectId) {
  return adminProjectMediaUploadUrl(projectId);
}

export async function fetchProjectMediaList(projectId, init) {
  const pid = String(projectId);
  const adminRes = await fetch(adminProjectMediaListUrl(pid), init);
  if (adminRes.ok || adminRes.status !== 404) return adminRes;
  return fetch(legacyProjectMediaListUrl(pid), init);
}

export async function postProjectMediaUpload(projectId, body) {
  const pid = String(projectId);
  const adminRes = await fetch(adminProjectMediaUploadUrl(pid), { method: 'POST', body });
  if (adminRes.ok || adminRes.status !== 404) return adminRes;
  return fetch(legacyProjectMediaUploadUrl(pid), { method: 'POST', body });
}

export async function deleteProjectMedia(projectId, mediaId) {
  const adminRes = await fetch(adminMediaDeleteUrl(mediaId), { method: 'DELETE' });
  if (adminRes.ok || adminRes.status !== 404) return adminRes;
  return fetch(legacyProjectMediaDeleteUrl(projectId, mediaId), { method: 'DELETE' });
}

export function normalizeMediaItemForBuilder(item) {
  if (!item || typeof item !== 'object') return null;
  const url = String(item.publicUrl || item.url || '').trim();
  return {
    ...item,
    publicUrl: url,
    url,
    mimeType: item.mimeType || item.mime_type || '',
    originalName: item.originalName || item.original_name || '',
    thumbUrl: item.thumbUrl ?? item.thumb_url ?? null,
    altText: item.altText ?? item.alt_text ?? null,
    bytes: item.bytes ?? item.size ?? 0,
    kind: item.kind || 'image',
  };
}
