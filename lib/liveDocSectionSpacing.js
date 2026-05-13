/**
 * Optional spacing overrides for a **root** page row (direct child of `.live-doc`).
 * Stored on `node.props.meta` — when absent, page theme `pageVars` defaults apply.
 *
 * Keys: `sectionGapBeforePx`, `sectionGapAfterPx`, `sectionPadBottomPx` (numbers ≥ 0).
 *
 * Strip width (`props.meta.rootStripLayout`): `'full'` or `'boxed'`. Root `.live-doc` rows emit
 * `data-live-root-strip`; nested rows emit `data-live-nested-strip` (parent-relative, no viewport breakout).
 * Omit or other values → default strip behavior from layout/CSS.
 */

export function liveDocRootRowSpacingVars(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const out = {};
  const gb = Number(meta.sectionGapBeforePx);
  if (Number.isFinite(gb) && gb >= 0) out['--live-row-gap-before'] = `${gb}px`;
  const g = Number(meta.sectionGapAfterPx);
  if (Number.isFinite(g) && g >= 0) out['--live-row-gap-after'] = `${g}px`;
  const p = Number(meta.sectionPadBottomPx);
  if (Number.isFinite(p) && p >= 0) out['--live-root-row-pad-bottom'] = `${p}px`;
  return Object.keys(out).length ? out : null;
}

export function isRootPageRow(tree, node) {
  if (!node || node.nodeType !== 'row' || !Array.isArray(tree)) return false;
  return tree.some((n) => n && n.id === node.id);
}
