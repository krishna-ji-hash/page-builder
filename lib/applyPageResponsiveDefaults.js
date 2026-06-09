/**
 * Apply tablet/mobile style_json defaults across a page tree (builder + live).
 */
import { isFooterRowNode, isHeaderRowNode } from './rowLayoutMeta.js';
import { isRootPageRow } from './liveDocSectionSpacing.js';
import {
  applySectionLayoutToStyleJson,
  normalizeSectionLayout,
} from './sectionLayout.js';
import {
  buildRowMobileStackLayout,
  COLUMN_MOBILE_PATCH,
  FOOTER_COLUMN_MOBILE_PATCH,
  HEADER_COLUMN_MOBILE_PATCH,
  HEADER_ROW_MOBILE_COMPACT_FRAGMENT,
  ROW_MOBILE_STACK_FRAGMENT,
} from './responsiveLayoutDefaults.js';
import { DEFAULT_SITE_THEME, themeSpacingPx } from './siteDesignTheme.js';

const TABLET_ROW_WRAP_FRAGMENT = {
  tablet: {
    layout: {
      flexWrap: 'wrap',
      alignItems: 'stretch',
      gap: 14,
    },
  },
};

const MOBILE_ROW_CONTENT_SPACING = {
  mobile: {
    spacing: {
      padding: '56px 20px',
    },
  },
};

const MOBILE_IMAGE_SIZE = {
  mobile: {
    size: { width: '100%', maxWidth: '100%' },
    layout: { maxWidth: '100%' },
  },
};

function mergeDeviceSlice(base = {}, patch = {}) {
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv == null || typeof pv !== 'object' || Array.isArray(pv)) {
      out[key] = pv;
      continue;
    }
    const bv = base[key] && typeof base[key] === 'object' ? base[key] : {};
    out[key] = { ...bv, ...pv };
  }
  return out;
}

function mergeStyleJsonLayers(styleJson, fragments = []) {
  let next = styleJson && typeof styleJson === 'object' ? { ...styleJson } : {};
  for (const frag of fragments) {
    if (!frag || typeof frag !== 'object') continue;
    if (frag.mobile) {
      next = { ...next, mobile: mergeDeviceSlice(next.mobile, frag.mobile) };
    }
    if (frag.tablet) {
      next = { ...next, tablet: mergeDeviceSlice(next.tablet, frag.tablet) };
    }
    if (frag.desktop) {
      next = { ...next, desktop: mergeDeviceSlice(next.desktop, frag.desktop) };
    }
  }
  return next;
}

function parseFontSizePx(typography = {}) {
  const raw = typography?.fontSize;
  if (raw == null || raw === '') return null;
  const n = parseFloat(String(raw).replace(/px/gi, '').trim());
  return Number.isFinite(n) ? n : null;
}

function scaleTypographyLayer(deviceStyle, scale, minPx = 14) {
  if (!deviceStyle || typeof deviceStyle !== 'object') return deviceStyle;
  const typo = deviceStyle.typography && typeof deviceStyle.typography === 'object' ? deviceStyle.typography : {};
  const fs = parseFontSizePx(typo);
  if (fs == null) return deviceStyle;
  const nextFs = Math.max(minPx, Math.round(fs * scale));
  return {
    ...deviceStyle,
    typography: { ...typo, fontSize: `${nextFs}px` },
  };
}

function patchNodeResponsive(node, { siteTheme = DEFAULT_SITE_THEME, mobile = true, tablet = true, pageTree = [] }) {
  if (!node || typeof node !== 'object') return node;
  const nodeType = node.nodeType;
  let style_json = node.style_json || node.props?.style_json || {};

  const isHeader = nodeType === 'row' && isHeaderRowNode(node);
  const isFooter = nodeType === 'row' && isFooterRowNode(node);
  const isRootRow = nodeType === 'row' && Array.isArray(pageTree) && isRootPageRow(pageTree, node);

  if (nodeType === 'row' && isRootRow) {
    const frags = [];
    if (isHeader) {
      if (mobile || tablet) frags.push(HEADER_ROW_MOBILE_COMPACT_FRAGMENT);
    } else if (isFooter) {
      if (mobile) frags.push(ROW_MOBILE_STACK_FRAGMENT);
      if (tablet) frags.push(TABLET_ROW_WRAP_FRAGMENT);
    } else {
      if (mobile) {
        frags.push(ROW_MOBILE_STACK_FRAGMENT);
        frags.push({
          mobile: {
            layout: buildRowMobileStackLayout(siteTheme),
          },
        });
        frags.push(MOBILE_ROW_CONTENT_SPACING);
      }
      if (tablet) frags.push(TABLET_ROW_WRAP_FRAGMENT);
    }
    if (frags.length) style_json = mergeStyleJsonLayers(style_json, frags);

    const meta = node.props?.meta;
    if (meta?.sectionLayout && typeof meta.sectionLayout === 'object') {
      const layout = normalizeSectionLayout(meta.sectionLayout, meta.sectionTemplate);
      const withStack = { ...layout, mobileStack: true };
      style_json = applySectionLayoutToStyleJson(style_json, withStack);
    }
  }

  if (nodeType === 'column' && (mobile || tablet)) {
    if (isHeader) {
      style_json = mergeStyleJsonLayers(style_json, [HEADER_COLUMN_MOBILE_PATCH]);
    } else if (isFooter) {
      style_json = mergeStyleJsonLayers(style_json, [FOOTER_COLUMN_MOBILE_PATCH]);
    } else {
      style_json = mergeStyleJsonLayers(style_json, [COLUMN_MOBILE_PATCH]);
    }
  }

  if (nodeType === 'heading') {
    if (tablet) {
      const base = style_json.tablet && typeof style_json.tablet === 'object' ? style_json.tablet : {};
      style_json = {
        ...style_json,
        tablet: scaleTypographyLayer(base, 0.88, 18),
      };
    }
    if (mobile) {
      const base = style_json.mobile && typeof style_json.mobile === 'object' ? style_json.mobile : {};
      const desktopTypo =
        style_json.desktop?.typography && typeof style_json.desktop.typography === 'object'
          ? style_json.desktop.typography
          : {};
      const mobileTypo = base.typography && typeof base.typography === 'object' ? base.typography : {};
      const sourceTypo =
        parseFontSizePx(mobileTypo) != null
          ? mobileTypo
          : parseFontSizePx(desktopTypo) != null
            ? desktopTypo
            : mobileTypo;
      style_json = {
        ...style_json,
        mobile: scaleTypographyLayer({ ...base, typography: sourceTypo }, 0.72, 16),
      };
      const fs = parseFontSizePx(style_json.mobile?.typography);
      if (fs != null && fs > 36) {
        style_json = {
          ...style_json,
          mobile: mergeDeviceSlice(style_json.mobile, {
            typography: { fontSize: '32px', lineHeight: '1.1' },
          }),
        };
      }
    }
  }

  if (nodeType === 'text' && mobile) {
    style_json = mergeStyleJsonLayers(style_json, [
      {
        mobile: {
          typography: { fontSize: undefined },
          size: { maxWidth: '100%' },
        },
      },
    ]);
    const fs = parseFontSizePx(style_json.mobile?.typography || style_json.desktop?.typography);
    if (fs != null && fs > 18) {
      style_json = mergeStyleJsonLayers(style_json, [
        { mobile: { typography: { fontSize: `${Math.max(14, Math.round(fs * 0.9))}px` } } },
      ]);
    }
  }

  if (nodeType === 'image' && mobile) {
    style_json = mergeStyleJsonLayers(style_json, [MOBILE_IMAGE_SIZE]);
  }

  if (nodeType === 'button' && mobile) {
    style_json = mergeStyleJsonLayers(style_json, [
      {
        mobile: {
          size: { width: '100%', maxWidth: '100%' },
          layout: { width: '100%' },
        },
      },
    ]);
  }

  const children = Array.isArray(node.children)
    ? node.children.map((ch) => patchNodeResponsive(ch, { siteTheme, mobile, tablet, pageTree }))
    : [];

  const out = { ...node, style_json, children };
  if (out.props && typeof out.props === 'object') {
    out.props = { ...out.props, style_json };
  }
  return out;
}

/**
 * @param {object[]} tree
 * @param {{ siteTheme?: object, mobile?: boolean, tablet?: boolean }} [options]
 */
export function applyResponsiveDefaultsToTree(tree, options = {}) {
  const roots = Array.isArray(tree) ? tree : [];
  const siteTheme = options.siteTheme || DEFAULT_SITE_THEME;
  const mobile = options.mobile !== false;
  const tablet = options.tablet !== false;
  return roots.map((node) => patchNodeResponsive(node, { siteTheme, mobile, tablet, pageTree: roots }));
}

/** Default page-level vars per breakpoint (stored on siteTheme.pageVars[slug].breakpoints). */
export function defaultPageBreakpointVars(breakpoint, siteTheme = DEFAULT_SITE_THEME) {
  const gapLg = themeSpacingPx(siteTheme, 'lg');
  if (breakpoint === 'mobile') {
    return {
      contentMaxWidthPx: null,
      sectionGapPx: Math.max(8, gapLg - 4),
      sectionPadBottomPx: 10,
    };
  }
  if (breakpoint === 'tablet') {
    return {
      contentMaxWidthPx: 960,
      sectionGapPx: Math.max(10, gapLg - 2),
      sectionPadBottomPx: 12,
    };
  }
  return {};
}

/**
 * @param {object|null|undefined} pageVars
 * @param {'tablet'|'mobile'} breakpoint
 */
export function getPageVarsForBreakpoint(pageVars, breakpoint) {
  const base = pageVars && typeof pageVars === 'object' ? pageVars : {};
  const bp =
    base.breakpoints && typeof base.breakpoints === 'object' ? base.breakpoints[breakpoint] || {} : {};
  return { ...base, ...bp };
}
