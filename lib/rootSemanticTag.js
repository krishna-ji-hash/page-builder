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
  const total = allRootNodes.length;
  const node = allRootNodes[index];
  if (total === 1) {
    const role = rowLandmarkRole(node);
    if (role === 'header') return 'header';
    if (role === 'footer') return 'footer';
    return 'main';
  }
  if (index === 0) return 'header';
  if (index === total - 1) return 'footer';
  return 'section';
}
