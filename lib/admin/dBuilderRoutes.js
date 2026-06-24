/** Builder editor opened by page id (project manager flow). */
export function dBuilderPagePath(pageId) {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) return '/d/projects';
  return `/d/builder/${id}`;
}

/** Draft preview opened by page id. */
export function dPreviewPagePath(pageId) {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return `/d/preview/${id}`;
}
