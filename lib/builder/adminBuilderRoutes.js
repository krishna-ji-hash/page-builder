/** Admin builder editor URL — mirrors public `/{projectSlug}/{pageSlug}`. */
export function adminBuilderPagePath(projectSlug, pageSlug) {
  if (!projectSlug || !pageSlug) return '/admin/builder';
  return `/admin/builder/${projectSlug}/${pageSlug}`;
}

/** Draft preview URL — same slugs as public and builder routes. */
export function previewPagePath(projectSlug, pageSlug, options = {}) {
  if (!projectSlug || !pageSlug) return null;
  const base = `/preview/${projectSlug}/${pageSlug}`;
  const versionId = Number(options.versionId);
  if (Number.isInteger(versionId) && versionId > 0) {
    return `${base}?versionId=${versionId}`;
  }
  return base;
}

/** Read-only preview of a frozen page_versions snapshot. */
export function previewVersionPath(versionId) {
  const id = Number(versionId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return `/preview/version/${id}`;
}
