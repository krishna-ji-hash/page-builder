/**
 * Root-level rows map to landmarks (matches builder badges + live DOM).
 * Used by liveRenderer and BuilderCanvas for parity.
 */
function rowLandmarkRole(node) {
  const meta = node?.props?.meta || {};
  if (meta.isHeader || meta.role === 'header') return 'header';
  if (meta.isFooter || meta.role === 'footer') return 'footer';
  return null;
}

export function rootSemanticTag(allRootNodes, index) {
  const onlyRows = allRootNodes.length > 0 && allRootNodes.every((n) => n?.nodeType === 'row');
  if (!onlyRows || !allRootNodes[index] || allRootNodes[index]?.nodeType !== 'row') {
    return null;
  }
  const node = allRootNodes[index];
  const role = rowLandmarkRole(node);
  if (role) return role;
  const total = allRootNodes.length;
  if (total === 1) return 'main';
  /* Do not treat first/last page rows as header/footer unless meta says so — avoids header grid CSS on hero/feature sections. */
  return 'section';
}
