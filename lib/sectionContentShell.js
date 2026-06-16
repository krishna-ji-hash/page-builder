/**
 * Full-bleed section background + boxed inner column (Elementor-style).
 * Outer row paints edge-to-edge; `.site-container.section-inner` holds layout children.
 */

export const SECTION_FULL_BG_CLASS = 'section-full-bg';
export const SECTION_BUILDER_CLASS = 'builder-section';
export const SECTION_INNER_CLASS = 'site-container section-inner';

const INNER_LAYOUT_KEYS = new Set([
  'display',
  'flexDirection',
  'flexWrap',
  'gap',
  'rowGap',
  'columnGap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'width',
  'minWidth',
  'boxSizing',
]);

/**
 * @param {string | undefined} padding
 * @returns {string | undefined}
 */
function paddingVerticalOnly(padding) {
  if (!padding) return undefined;
  const parts = String(padding).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0];
  if (parts.length === 3) return `${parts[0]} ${parts[2]}`;
  if (parts.length === 4) return `${parts[0]} ${parts[2]}`;
  return padding;
}

/**
 * @param {Record<string, unknown> | null | undefined} css
 * @returns {{ sectionCss: Record<string, unknown> | null | undefined, innerCss: Record<string, unknown> }}
 */
export function splitRowCssForSectionContentShell(css) {
  const innerCss = { width: '100%', boxSizing: 'border-box', minWidth: 0 };
  if (!css || typeof css !== 'object') {
    innerCss.display = 'flex';
    innerCss.flexDirection = 'column';
    innerCss.justifyContent = 'flex-start';
    return { sectionCss: css, innerCss };
  }

  const sectionCss = {};
  for (const [key, value] of Object.entries(css)) {
    if (value == null || value === '') continue;
    if (key === 'padding') {
      const vertical = paddingVerticalOnly(String(value));
      if (vertical) sectionCss.padding = vertical;
      continue;
    }
    if (key === 'paddingLeft' || key === 'paddingRight') continue;
    if (key === 'maxWidth') continue;
    if (INNER_LAYOUT_KEYS.has(key) || key.startsWith('--bld-section-layout')) {
      innerCss[key] = value;
      continue;
    }
    sectionCss[key] = value;
  }

  if (!innerCss.display) {
    innerCss.display = 'flex';
    innerCss.flexDirection = innerCss.flexDirection || 'column';
  }
  if (!innerCss.justifyContent || innerCss.justifyContent === 'center') {
    innerCss.justifyContent = 'flex-start';
  }

  sectionCss.display = 'block';
  sectionCss.width = '100%';
  sectionCss.maxWidth = 'none';
  sectionCss.paddingLeft = 0;
  sectionCss.paddingRight = 0;
  sectionCss.marginLeft = 0;
  sectionCss.marginRight = 0;
  sectionCss.boxSizing = 'border-box';

  return { sectionCss, innerCss };
}

/**
 * @param {string} sectionContentMode
 * @param {boolean} isRootContentRow
 */
export function shouldWrapRootSectionContent(sectionContentMode, isRootContentRow) {
  return sectionContentMode === 'boxed' && Boolean(isRootContentRow);
}

/**
 * @param {string[]} containerClassParts
 */
export function appendSectionFullBgClasses(containerClassParts) {
  return [...containerClassParts, SECTION_BUILDER_CLASS, SECTION_FULL_BG_CLASS].filter(Boolean).join(' ');
}
