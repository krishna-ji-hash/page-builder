/** Portal target so floating builder UI inherits `--bld-*` theme tokens. */
export function getBuilderPortalRoot() {
  if (typeof document === 'undefined') return null;
  return document.querySelector('.bld-builder-root') || document.body;
}
