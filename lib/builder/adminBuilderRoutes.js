/** Admin builder editor URL — mirrors public `/{projectSlug}/{pageSlug}`. */
export function adminBuilderPagePath(projectSlug, pageSlug) {
  if (!projectSlug || !pageSlug) return '/admin/builder';
  return `/admin/builder/${projectSlug}/${pageSlug}`;
}

/** Draft preview URL — same slugs as public and builder routes. */
export function previewPagePath(projectSlug, pageSlug) {
  if (!projectSlug || !pageSlug) return null;
  return `/preview/${projectSlug}/${pageSlug}`;
}
