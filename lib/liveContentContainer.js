/**
 * Section width modes for live / builder mirror (Elementor-style page structure).
 *
 * - boxed: section + content follow the page content column
 * - fullWidth: background and content span the viewport (legacy “full bleed”)
 * - fullWidthContentBoxed: full-bleed background, centered inner column (default for root content)
 */

export const SECTION_WIDTH_MODES = {
  BOXED: 'boxed',
  FULL_WIDTH: 'fullWidth',
  FULL_WIDTH_CONTENT_BOXED: 'fullWidthContentBoxed',
};

const MODE_SET = new Set(Object.values(SECTION_WIDTH_MODES));

/**
 * @param {object} rowMeta
 * @param {{ isLiveDocRootRow?: boolean, isHeaderRow?: boolean, isFooterRow?: boolean, isRootContentRow?: boolean }} [ctx]
 * @returns {typeof SECTION_WIDTH_MODES[keyof typeof SECTION_WIDTH_MODES] | ''}
 */
export function resolveSectionWidthMode(rowMeta, ctx = {}) {
  const { isLiveDocRootRow, isHeaderRow, isFooterRow, isRootContentRow } = ctx;

  if (isHeaderRow || isFooterRow) {
    return '';
  }

  const explicit = String(rowMeta?.sectionWidthMode || '')
    .trim()
    .replace(/-/g, '');
  const normalizedExplicit =
    explicit === 'fullwidthcontentboxed'
      ? SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED
      : explicit === 'fullwidth'
        ? SECTION_WIDTH_MODES.FULL_WIDTH
        : explicit === 'boxed'
          ? SECTION_WIDTH_MODES.BOXED
          : MODE_SET.has(explicit)
            ? explicit
            : '';

  if (normalizedExplicit) return normalizedExplicit;

  const strip = String(rowMeta?.rootStripLayout || '').toLowerCase().trim();
  if (strip === 'boxed') return SECTION_WIDTH_MODES.BOXED;
  if (strip === 'full') {
    return isRootContentRow || isLiveDocRootRow
      ? SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED
      : SECTION_WIDTH_MODES.FULL_WIDTH;
  }

  if (isRootContentRow || (isLiveDocRootRow && !isHeaderRow && !isFooterRow)) {
    return SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED;
  }
  return '';
}

/**
 * Effective strip (`data-live-root-strip` / `data-live-nested-strip`).
 * @returns {'full'|'boxed'|''}
 */
export function resolveRootStripLayout(rowMeta, ctx = {}) {
  const { isLiveDocRootRow, isHeaderRow, isFooterRow } = ctx;
  if (isLiveDocRootRow && (isHeaderRow || isFooterRow)) return 'full';

  const mode = resolveSectionWidthMode(rowMeta, ctx);
  if (mode === SECTION_WIDTH_MODES.BOXED) return 'boxed';
  if (mode === SECTION_WIDTH_MODES.FULL_WIDTH || mode === SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED) {
    return 'full';
  }

  const strip = String(rowMeta?.rootStripLayout || '').toLowerCase().trim();
  if (strip === 'full' || strip === 'boxed') return strip;
  return '';
}

/**
 * Inner content column for full-bleed sections (`data-live-section-content`).
 * @returns {'boxed'|''}
 */
export function resolveSectionContentWidth(rowMeta, ctx = {}) {
  const mode = resolveSectionWidthMode(rowMeta, ctx);
  if (mode === SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED) return 'boxed';
  return '';
}

/**
 * @param {object} rowMeta
 * @param {string | number | undefined} layoutMaxWidth
 * @returns {number}
 */
export function resolveSectionContentMaxWidthPx(rowMeta, layoutMaxWidth) {
  const fromMeta = Number(rowMeta?.sectionContentMaxWidthPx ?? rowMeta?.containerWidthPx);
  if (Number.isFinite(fromMeta) && fromMeta >= 320) return Math.min(2560, Math.floor(fromMeta));
  const raw = String(layoutMaxWidth || '').trim();
  const px = raw.endsWith('px') ? parseFloat(raw) : NaN;
  if (Number.isFinite(px) && px >= 320) return Math.min(2560, Math.floor(px));
  return 1280;
}

/**
 * @param {boolean} isLiveDocRootRow
 * @param {object} rowMeta
 * @param {{ isHeaderRow?: boolean, isFooterRow?: boolean, isRootContentRow?: boolean }} [ctx]
 * @returns {Record<string, string>}
 */
export function rowSectionStripDataAttrs(isLiveDocRootRow, rowMeta, ctx = {}) {
  const strip = resolveRootStripLayout(rowMeta, { ...ctx, isLiveDocRootRow });
  if (strip === 'full') {
    return isLiveDocRootRow ? { 'data-live-root-strip': 'full' } : { 'data-live-nested-strip': 'full' };
  }
  if (strip === 'boxed') {
    return isLiveDocRootRow ? { 'data-live-root-strip': 'boxed' } : { 'data-live-nested-strip': 'boxed' };
  }
  return {};
}

/**
 * @param {object} rowMeta
 * @param {{ isLiveDocRootRow?: boolean, isHeaderRow?: boolean, isFooterRow?: boolean, isRootContentRow?: boolean }} [ctx]
 * @returns {Record<string, string>}
 */
export function sectionContentDataAttrs(rowMeta, ctx = {}) {
  const mode = resolveSectionContentWidth(rowMeta, ctx);
  if (mode !== 'boxed') return {};
  return {
    'data-live-section-content': 'boxed',
    'data-live-content-band': 'true',
  };
}
