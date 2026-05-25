/**
 * Optional spacing overrides for a **root** page row (direct child of `.live-doc`).
 * Stored on `node.props.meta` — when absent, page theme `pageVars` defaults apply.
 *
 * Keys: `sectionGapBeforePx`, `sectionGapAfterPx`, `sectionPadBottomPx` (numbers ≥ 0).
 *
 * Section width (`props.meta.sectionWidthMode` or legacy `rootStripLayout`): see `lib/liveContentContainer.js`.
 * Root rows emit `data-live-root-strip` + optional `data-live-section-content`; nested rows use `data-live-nested-strip`.
 * Default root content sections: full-bleed background + boxed inner column (`fullWidthContentBoxed`).
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

/** True when `style_json.spacing.padding` is set (row controls its own inset; skip theme bottom pad override). */
export function rowHasSpacingPadding(style) {
  const pad = style?.spacing?.padding;
  if (pad == null || pad === '') return false;
  if (typeof pad === 'object' && !Array.isArray(pad)) {
    return ['top', 'right', 'bottom', 'left'].some((k) => pad[k] != null && pad[k] !== '');
  }
  return true;
}
