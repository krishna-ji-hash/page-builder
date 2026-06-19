/** Admin builder editor URL — mirrors public `/{projectSlug}/{pageSlug}`. */
export function adminBuilderPagePath(projectSlug, pageSlug) {
  if (!projectSlug || !pageSlug) return '/admin/builder';
  return `/admin/builder/${projectSlug}/${pageSlug}`;
}

/** Draft preview URL — same slugs as public and builder routes. */
export function previewPagePath(projectSlug, pageSlug, options = null) {
  if (!projectSlug || !pageSlug) return null;
  const base = `/preview/${projectSlug}/${pageSlug}`;
  const versionId = options?.versionId;
  if (versionId != null && versionId !== '' && Number.isInteger(Number(versionId)) && Number(versionId) > 0) {
    return `${base}?versionId=${Number(versionId)}`;
  }
  return base;
}

/** Immutable published-version preview (version history). */
export function previewVersionPath(versionId) {
  const id = Number(versionId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return `/preview/version/${id}`;
}
