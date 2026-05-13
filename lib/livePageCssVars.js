/**
 * Per-page CSS variables for `.live-site` (published, preview, builder mirror).
 */

/** @param {unknown} siteTheme */
export function getPageVarsBucket(siteTheme, pageSlug) {
  if (!pageSlug || !siteTheme?.pageVars || typeof siteTheme.pageVars !== 'object' || Array.isArray(siteTheme.pageVars)) {
    return null;
  }
  return siteTheme.pageVars[pageSlug] || null;
}

/**
 * Optional cap for `.live-doc` width (px). Omit or invalid → use CSS default on `.live-site`.
 * @returns {number | null}
 */
export function resolveContentMaxWidthPx(pageVars) {
  if (!pageVars || typeof pageVars !== 'object') return null;
  const raw = Number(pageVars.contentMaxWidthPx);
  if (!Number.isFinite(raw) || raw < 320) return null;
  return Math.min(2560, Math.floor(raw));
}

/**
 * @param {{ sectionGapPx?: number | null, sectionPadBottomPx?: number | null, contentMaxWidthPx?: number | null }} vars
 * @returns {Record<string, string>}
 */
export function livePageCssVarOverrides(vars) {
  const { sectionGapPx, sectionPadBottomPx, contentMaxWidthPx } = vars || {};
  return {
    ...(sectionGapPx != null ? { '--live-section-gap': `${sectionGapPx}px` } : {}),
    ...(sectionPadBottomPx != null ? { '--live-section-pad-bottom': `${sectionPadBottomPx}px` } : {}),
    ...(contentMaxWidthPx != null ? { '--live-content-max-width': `${contentMaxWidthPx}px` } : {}),
  };
}

/**
 * Whole page: contained column (default) vs edge-to-edge body.
 * @returns {'container'|'full'}
 */
export function resolveBodyLayout(siteTheme, pageSlug) {
  const pv = getPageVarsBucket(siteTheme, pageSlug);
  const v = String(pv?.bodyLayout || '').toLowerCase().trim();
  return v === 'full' ? 'full' : 'container';
}

/**
 * Per-row section width (`node.props.meta.rootStripLayout`): `full` or `boxed`.
 * Root rows (`.live-doc` children) use `data-live-root-strip` (viewport breakout on live site).
 * Nested rows use `data-live-nested-strip` (full width of parent column/stack only).
 * @param {boolean} isLiveDocRootRow
 * @param {object} rowMeta
 * @returns {Record<string, string>}
 */
export function rowSectionStripDataAttrs(isLiveDocRootRow, rowMeta) {
  const strip = String(rowMeta?.rootStripLayout || '').toLowerCase().trim();
  if (strip === 'full') {
    return isLiveDocRootRow ? { 'data-live-root-strip': 'full' } : { 'data-live-nested-strip': 'full' };
  }
  if (strip === 'boxed') {
    return isLiveDocRootRow ? { 'data-live-root-strip': 'boxed' } : { 'data-live-nested-strip': 'boxed' };
  }
  return {};
}

/** @deprecated Use rowSectionStripDataAttrs(isLiveDocRootRow, rowMeta) */
export function rootRowStripDataAttrs(rowMeta) {
  return rowSectionStripDataAttrs(true, rowMeta);
}
