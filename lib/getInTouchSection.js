/** @param {object | null | undefined} node */
export function isGetInTouchSectionRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.props?.meta;
  if (meta && typeof meta === 'object' && meta.sectionTemplate === 'getInTouch') return true;
  const name = String(node.displayName || '').toLowerCase();
  return name.includes('get in touch');
}
