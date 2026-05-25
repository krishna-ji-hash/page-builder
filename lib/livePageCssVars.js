/**
 * Per-page CSS variables for `.live-site` (published, preview, builder mirror).
 */

import { resolveHeaderLayoutMode } from '@/lib/headerLayoutMode';
import {
  resolveRootStripLayout as resolveRootStripLayoutFromMode,
  rowSectionStripDataAttrs as rowSectionStripDataAttrsFromMode,
  sectionContentDataAttrs,
} from '@/lib/liveContentContainer';

export { sectionContentDataAttrs };
export {
  resolveSectionWidthMode,
  resolveSectionContentWidth,
  resolveSectionContentMaxWidthPx,
  SECTION_WIDTH_MODES,
} from '@/lib/liveContentContainer';

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
 * Effective strip width (see `lib/liveContentContainer.js`).
 * @param {object} rowMeta
 * @param {{ isLiveDocRootRow?: boolean, isHeaderRow?: boolean, isFooterRow?: boolean, isRootContentRow?: boolean }} [ctx]
 * @returns {'full'|'boxed'|''}
 */
export function resolveRootStripLayout(rowMeta, ctx = {}) {
  return resolveRootStripLayoutFromMode(rowMeta, ctx);
}

/**
 * @param {boolean} isLiveDocRootRow
 * @param {object} rowMeta
 * @param {{ isHeaderRow?: boolean, isFooterRow?: boolean, isRootContentRow?: boolean }} [ctx]
 * @returns {Record<string, string>}
 */
export function rowSectionStripDataAttrs(isLiveDocRootRow, rowMeta, ctx = {}) {
  return rowSectionStripDataAttrsFromMode(isLiveDocRootRow, rowMeta, ctx);
}

/**
 * Inner bar width for full-bleed header/footer rows (logo | nav | CTA stay in a centered column).
 * @param {object} rowMeta
 * @param {{ isHeaderRow?: boolean, isFooterRow?: boolean }} [ctx]
 * @returns {'boxed'|'full'|''}
 */
export function resolveLandmarkContentWidth(rowMeta, ctx = {}) {
  const { isHeaderRow, isFooterRow } = ctx;
  if (isHeaderRow) {
    return resolveHeaderLayoutMode(rowMeta) === 'boxed' ? 'boxed' : 'full';
  }
  if (isFooterRow) {
    const raw = String(rowMeta?.footerContentWidth || '').toLowerCase().trim();
    if (raw === 'full' || raw === 'boxed') return raw;
    return 'boxed';
  }
  return '';
}

/**
 * Max width (px) for the centered header/footer content band.
 * @param {object} rowMeta
 * @param {string | number | undefined} layoutMaxWidth — from resolved row `layout.maxWidth`
 * @returns {number}
 */
export function resolveLandmarkContentMaxWidthPx(rowMeta, layoutMaxWidth) {
  const fromMeta = Number(rowMeta?.headerContentMaxWidthPx ?? rowMeta?.footerContentMaxWidthPx);
  if (Number.isFinite(fromMeta) && fromMeta >= 320) return Math.min(2560, Math.floor(fromMeta));
  const raw = String(layoutMaxWidth || '').trim();
  const px = raw.endsWith('px') ? parseFloat(raw) : NaN;
  if (Number.isFinite(px) && px >= 320) return Math.min(2560, Math.floor(px));
  return 1280;
}

/**
 * @param {object} rowMeta
 * @param {{ isLiveDocRootRow?: boolean, isHeaderRow?: boolean, isFooterRow?: boolean }} [ctx]
 * @returns {Record<string, string>}
 */
export function landmarkContentDataAttrs(rowMeta, ctx = {}) {
  const { isLiveDocRootRow, isHeaderRow, isFooterRow } = ctx;
  if (!isLiveDocRootRow || (!isHeaderRow && !isFooterRow)) return {};
  const mode = resolveLandmarkContentWidth(rowMeta, { isHeaderRow, isFooterRow });
  if (isHeaderRow) return { 'data-live-header-content': mode };
  return { 'data-live-footer-content': mode };
}

/** @deprecated Use rowSectionStripDataAttrs(isLiveDocRootRow, rowMeta) */
export function rootRowStripDataAttrs(rowMeta) {
  return rowSectionStripDataAttrs(true, rowMeta);
}
