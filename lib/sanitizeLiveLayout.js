/**
 * Published / preview layout guards — builder canvas may keep free-move coordinates;
 * live output must stay in normal document flow so sections contain their children.
 */

/** @param {Record<string, unknown> | null | undefined} css */
export function sanitizeLiveFlowPositionCss(css) {
  if (!css || typeof css !== 'object') return css;
  const pos = String(css.position || '').toLowerCase();
  if (pos !== 'absolute' && pos !== 'fixed') return css;
  return {
    ...css,
    position: 'relative',
    top: undefined,
    right: undefined,
    bottom: undefined,
    left: undefined,
    inset: undefined,
  };
}

/** Root content rows (section/main): never absolute — matches footer/header live guards. */
export function sanitizeLiveRootContentRowCss(css) {
  const base = sanitizeLiveFlowPositionCss(css);
  if (!base || typeof base !== 'object') return base;
  return {
    ...base,
    position: 'static',
    top: undefined,
    right: undefined,
    bottom: undefined,
    left: undefined,
    inset: undefined,
    zIndex: undefined,
    transform: undefined,
  };
}
