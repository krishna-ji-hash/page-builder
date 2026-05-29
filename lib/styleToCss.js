import { animationCssFromInteractions, interactionInlineStyleVars } from './nodeInteractionCss.js';
import {
  shouldStripNeutralDarkCssColor,
  shouldStripNeutralLightCssColor,
} from './sanitizeRichHtml.js';
import { resolvedLayoutGapPx } from './layoutGapUtils.js';
import { DEFAULT_SITE_THEME } from './siteDesignTheme.js';
import { coerceTokenRef } from './themeTokens.js';
import {
  mergeLiveSectionContrastVars,
  shouldApplySectionContrast,
} from './liveSectionContrastVars.js';
import {
  neutralizeLightSurfaceCssObject,
  surfaceNodeTypesForNeutralization,
} from './sectionSurfaceNeutralization.js';

const SECTION_AWARE_TEXT = 'var(--live-section-fg, var(--color-text))';

/**
 * Map pasted neutral whites / dark body colors to section contrast tokens.
 * @param {string|number|null|undefined} raw
 * @param {{ darkContentMode?: boolean }} [opts]
 */
export function coerceSectionAwareTextColor(raw, opts = {}) {
  if (raw == null || raw === '') return undefined;
  const s = String(raw).trim();
  if (opts.darkContentMode && shouldStripNeutralLightCssColor(s)) return SECTION_AWARE_TEXT;
  if (opts.darkContentMode && shouldStripNeutralDarkCssColor(s)) return SECTION_AWARE_TEXT;
  return coerceTokenRef(raw);
}

export function formatBox(box) {
  if (!box) return undefined;
  if (typeof box === 'string') return box;
  if (typeof box !== 'object') return undefined;
  const side = (v, fallback = 0) => {
    const n = Number(v ?? fallback);
    return Number.isFinite(n) ? n : fallback;
  };
  const top = side(box.top);
  const right = side(box.right);
  const bottom = side(box.bottom);
  const left = side(box.left);
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

function parseSpacingMarginSides(margin) {
  if (margin == null || margin === '') return null;
  if (typeof margin === 'object') {
    return {
      top: margin.top ?? 0,
      right: margin.right ?? 0,
      bottom: margin.bottom ?? 0,
      left: margin.left ?? 0,
    };
  }
  const parts = String(margin).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const toSide = (p) => {
    if (p === 'auto') return 'auto';
    const n = Number.parseFloat(p);
    return Number.isFinite(n) ? n : p;
  };
  if (parts.length === 1) {
    const s = toSide(parts[0]);
    return { top: s, right: s, bottom: s, left: s };
  }
  if (parts.length === 2) {
    const a = toSide(parts[0]);
    const b = toSide(parts[1]);
    return { top: a, right: b, bottom: a, left: b };
  }
  if (parts.length === 3) {
    const a = toSide(parts[0]);
    const b = toSide(parts[1]);
    const c = toSide(parts[2]);
    return { top: a, right: b, bottom: c, left: b };
  }
  return {
    top: toSide(parts[0]),
    right: toSide(parts[1]),
    bottom: toSide(parts[2]),
    left: toSide(parts[3]),
  };
}

function coerceMarginCssValue(v) {
  if (v == null || v === '') return undefined;
  if (v === 'auto') return 'auto';
  if (typeof v === 'number' && Number.isFinite(v)) return `${v}px`;
  const s = String(v).trim();
  if (s === 'auto') return 'auto';
  if (/px|%|em|rem|vh|vw/i.test(s)) return s;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? `${n}px` : s;
}

/** Longhand margins only — avoids React warnings when layout also sets marginTop, etc. */
export function resolveMarginCssLonghand(style = {}) {
  const layout = style.layout || {};
  const sides = parseSpacingMarginSides(style.spacing?.margin);

  let top = sides?.top ?? 0;
  let right = sides?.right ?? 0;
  let bottom = sides?.bottom ?? 0;
  let left = sides?.left ?? 0;

  if (layout.marginTop != null && layout.marginTop !== '') top = layout.marginTop;
  if (layout.marginRight != null && layout.marginRight !== '') right = layout.marginRight;
  if (layout.marginBottom != null && layout.marginBottom !== '') bottom = layout.marginBottom;
  if (layout.marginLeft != null && layout.marginLeft !== '') left = layout.marginLeft;

  const hasSpacing = sides != null;
  const hasLayout =
    (layout.marginTop != null && layout.marginTop !== '') ||
    (layout.marginRight != null && layout.marginRight !== '') ||
    (layout.marginBottom != null && layout.marginBottom !== '') ||
    (layout.marginLeft != null && layout.marginLeft !== '');

  if (!hasSpacing && !hasLayout) return {};

  const out = {};
  const t = coerceMarginCssValue(top);
  const r = coerceMarginCssValue(right);
  const b = coerceMarginCssValue(bottom);
  const l = coerceMarginCssValue(left);
  if (t !== undefined) out.marginTop = t;
  if (r !== undefined) out.marginRight = r;
  if (b !== undefined) out.marginBottom = b;
  if (l !== undefined) out.marginLeft = l;
  return out;
}

function splitGapShorthand(gap) {
  if (gap == null || gap === '') return null;
  const parts = String(gap).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return { rowGap: parts[0], columnGap: parts[0] };
  return { rowGap: parts[0], columnGap: parts[1] };
}

/**
 * Normalize `gap` → `rowGap` + `columnGap` to avoid React mixed shorthand/longhand warnings.
 * React can warn when `gap` is removed on rerender while `rowGap/columnGap` are present.
 */
export function sanitizeGapShorthandConflict(css) {
  if (!css || typeof css !== 'object') return css;
  if (css.gap == null || css.gap === '') return css;
  const split = splitGapShorthand(css.gap);
  if (!split) return css;
  const out = { ...css };
  // If longhands are already set, they win; otherwise derive from shorthand.
  if (out.rowGap == null || out.rowGap === '') out.rowGap = split.rowGap;
  if (out.columnGap == null || out.columnGap === '') out.columnGap = split.columnGap;
  delete out.gap;
  return out;
}

/** Strip `margin` shorthand when longhands are present (preview CSS, image shell split). */
export function sanitizeInlineMarginCss(css) {
  if (!css || typeof css !== 'object') return css;
  let out = css;
  const hasShorthand = out.margin != null && out.margin !== '';
  const hasLonghand =
    (out.marginTop != null && out.marginTop !== '') ||
    (out.marginRight != null && out.marginRight !== '') ||
    (out.marginBottom != null && out.marginBottom !== '') ||
    (out.marginLeft != null && out.marginLeft !== '');
  if (hasShorthand) {
    out = { ...out };
    if (hasLonghand) {
      delete out.margin;
    } else {
      const sides = parseSpacingMarginSides(out.margin);
      delete out.margin;
      if (sides) {
        const t = coerceMarginCssValue(sides.top);
        const r = coerceMarginCssValue(sides.right);
        const b = coerceMarginCssValue(sides.bottom);
        const l = coerceMarginCssValue(sides.left);
        if (t !== undefined) out.marginTop = t;
        if (r !== undefined) out.marginRight = r;
        if (b !== undefined) out.marginBottom = b;
        if (l !== undefined) out.marginLeft = l;
      }
    }
  }
  return sanitizeGapShorthandConflict(out);
}

/** Flex `gap` from `style_json.layout.gap` only (number or string with px). */
export function coerceCssGap(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  return String(value);
}

/** Maps `layout.flex` shorthand (e.g. `0 1 auto`) when explicit grow/shrink/basis are unset. */
export function layoutFlexShorthandToParts(layout = {}) {
  const raw = layout?.flex;
  if (raw == null || raw === '') return {};
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { flexGrow: raw };
  }
  if (typeof raw !== 'string') return {};
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { flexGrow: parts[0] };
  if (parts.length === 2) return { flexGrow: parts[0], flexShrink: parts[1] };
  return { flexGrow: parts[0], flexShrink: parts[1], flexBasis: parts.slice(2).join(' ') };
}

function designTokenVars(style, siteTheme, opts = {}) {
  const theme = siteTheme ?? DEFAULT_SITE_THEME;
  const resolvedPx = resolvedLayoutGapPx(style.layout || {}, theme);
  const gapVal = coerceCssGap(resolvedPx ?? style.layout?.gap);
  const padStr = formatBox(style.spacing?.padding) || style.spacing?.padding;
  const rad = style.border?.radius || style.effects?.borderRadius;
  const radStr =
    rad != null && rad !== '' ? (typeof rad === 'number' && Number.isFinite(rad) ? `${rad}px` : String(rad)) : undefined;
  const textColorRaw = style.colors?.text || style.colors?.textColor || style.typography?.color;
  const textColor = coerceSectionAwareTextColor(textColorRaw, opts);
  const bg =
    style.colors?.background ||
    style.colors?.backgroundColor ||
    style.background?.backgroundColor;
  const borderWidth = style.border?.width;
  const borderColor = style.border?.color;

  const out = {};
  if (gapVal) out['--node-gap'] = gapVal;
  if (textColor != null && textColor !== '') out['--node-text'] = textColor;
  if (bg) out['--node-bg'] = bg;
  if (radStr) out['--node-radius'] = radStr;
  if (padStr) out['--node-pad'] = padStr;
  if (borderWidth != null && borderWidth !== '') out['--node-border-width'] = String(borderWidth);
  if (borderColor != null && borderColor !== '') out['--node-border-color'] = String(borderColor);
  return out;
}

/**
 * Maps merged device style → React inline style (builder + live).
 * Also sets `--node-*` CSS variables for shared design tokens.
 * @param {object|null|undefined} [siteTheme] — resolves `layout.gapScale` to px when set
 * @param {{ nodeType?: string, darkContentMode?: boolean, animationPresets?: object }} [opts]
 *        — `nodeType` `row` sets section contrast vars; `darkContentMode` remaps light pasted surfaces
 */
export function styleToCss(style, siteTheme, opts = {}) {
  if (!style) return {};

  const theme = siteTheme ?? DEFAULT_SITE_THEME;
  const resolvedPx = resolvedLayoutGapPx(style.layout || {}, theme);
  const gapVal = coerceCssGap(resolvedPx ?? style.layout?.gap);
  const vars = designTokenVars(style, theme, opts);
  const position = style.layout?.position;
  const rawTop = style.layout?.top;
  const rawZ = style.layout?.zIndex;
  const stickyTop =
    position === 'sticky' && (rawTop == null || rawTop === '' || String(rawTop).toLowerCase() === 'auto')
      ? '0px'
      : rawTop;
  const stickyZIndex =
    position === 'sticky' && (rawZ == null || rawZ === '' || String(rawZ).toLowerCase() === 'auto')
      ? 2000
      : rawZ;

  const flexParts = layoutFlexShorthandToParts(style.layout || {});
  const animationPresets = opts.animationPresets;
  const ixVars = interactionInlineStyleVars(style, animationPresets);
  const ixAnim = animationCssFromInteractions(style, animationPresets);
  const transformRaw = style.transform?.transform || style.effects?.transform;
  const filterParts = [];
  if (style.effects?.blur) filterParts.push(`blur(${style.effects.blur})`);
  if (style.effects?.brightness) filterParts.push(`brightness(${style.effects.brightness})`);
  if (style.effects?.contrast) filterParts.push(`contrast(${style.effects.contrast})`);
  if (style.effects?.saturate) filterParts.push(`saturate(${style.effects.saturate})`);
  if (style.effects?.grayscale) filterParts.push(`grayscale(${style.effects.grayscale})`);
  const filterVal = filterParts.length ? filterParts.join(' ') : undefined;

  const out = {
    ...vars,
    ...ixVars,
    ...ixAnim,
    display: style.layout?.display,
    flexDirection: style.layout?.flexDirection,
    justifyContent: style.layout?.justifyContent,
    alignItems: style.layout?.alignItems,
    alignContent: style.layout?.alignContent,
    flexGrow: style.layout?.flexGrow ?? flexParts.flexGrow,
    flexShrink: style.layout?.flexShrink ?? flexParts.flexShrink,
    flexBasis: style.layout?.flexBasis ?? flexParts.flexBasis,
    flexWrap: style.layout?.flexWrap,
    alignSelf: style.layout?.alignSelf,
    order: style.layout?.order,
    minWidth: style.layout?.minWidth,
    maxWidth: style.layout?.maxWidth,
    boxSizing: style.layout?.boxSizing,
    position,
    top: stickyTop,
    right: style.layout?.right,
    bottom: style.layout?.bottom,
    left: style.layout?.left,
    zIndex: stickyZIndex,
    overflow: style.layout?.overflow,

    ...resolveMarginCssLonghand(style),
    padding: formatBox(style.spacing?.padding) || style.spacing?.padding,
    ...(gapVal ? splitGapShorthand(gapVal) : null),

    width: style.size?.width,
    height: style.size?.height,
    minWidth: style.size?.minWidth ?? style.layout?.minWidth,
    maxWidth: style.size?.maxWidth ?? style.layout?.maxWidth,
    minHeight: style.size?.minHeight,
    maxHeight: style.size?.maxHeight,
    aspectRatio: style.size?.aspectRatio,

    fontFamily: style.typography?.fontFamily,
    fontSize: style.typography?.fontSize,
    fontWeight: style.typography?.fontWeight,
    fontStyle: style.typography?.fontStyle,
    lineHeight: style.typography?.lineHeight,
    letterSpacing: style.typography?.letterSpacing,
    textTransform: style.typography?.textTransform,
    textDecoration: style.typography?.textDecoration,
    textAlign: style.typography?.textAlign,
    textShadow: style.typography?.textShadow || style.effects?.textShadow,
    whiteSpace: style.typography?.whiteSpace || style.layout?.whiteSpace,
    color: coerceSectionAwareTextColor(
      style.colors?.text || style.colors?.textColor || style.typography?.color,
      opts
    ),

    backgroundColor: coerceTokenRef(
      style.colors?.background || style.colors?.backgroundColor || style.background?.backgroundColor
    ),
    backgroundImage: style.background?.backgroundImage,
    backgroundSize: style.background?.backgroundSize,
    backgroundPosition: style.background?.backgroundPosition,
    backgroundRepeat: style.background?.backgroundRepeat,
    backgroundBlendMode: style.background?.blendMode || style.effects?.blendMode,
    mixBlendMode: style.effects?.blendMode,

    borderRadius: coerceTokenRef(style.border?.radius || style.effects?.borderRadius),
    borderWidth: style.border?.width,
    borderColor: coerceTokenRef(style.border?.color),
    borderStyle: style.border?.width ? (style.border?.style || 'solid') : undefined,
    boxShadow: coerceTokenRef(style.effects?.boxShadow),
    opacity: style.effects?.opacity,
    filter: filterVal,
    backdropFilter: style.effects?.backdropFilter,
    transform: transformRaw,
    transition: style.interactions?.hover
      ? 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease'
      : undefined,
  };
  // Token refs for common spacing/size shorthands
  if (out.padding) out.padding = coerceTokenRef(out.padding);
  if (out.marginTop) out.marginTop = coerceTokenRef(out.marginTop);
  if (out.marginRight) out.marginRight = coerceTokenRef(out.marginRight);
  if (out.marginBottom) out.marginBottom = coerceTokenRef(out.marginBottom);
  if (out.marginLeft) out.marginLeft = coerceTokenRef(out.marginLeft);
  if (out.width) out.width = coerceTokenRef(out.width);
  if (out.height) out.height = coerceTokenRef(out.height);
  if (out.minWidth) out.minWidth = coerceTokenRef(out.minWidth);
  if (out.maxWidth) out.maxWidth = coerceTokenRef(out.maxWidth);
  if (out.minHeight) out.minHeight = coerceTokenRef(out.minHeight);
  if (out.maxHeight) out.maxHeight = coerceTokenRef(out.maxHeight);

  let result = out;
  if (
    opts?.darkContentMode &&
    opts?.nodeType &&
    surfaceNodeTypesForNeutralization().has(opts.nodeType)
  ) {
    result = neutralizeLightSurfaceCssObject(result);
  }
  if (opts?.nodeType && shouldApplySectionContrast(opts.nodeType, result, style)) {
    return mergeLiveSectionContrastVars(result, style, theme);
  }
  return result;
}

export function menuItemCss(style = {}) {
  const menu = style?.menu || {};
  const pad = menu.itemPadding != null && menu.itemPadding !== '' ? menu.itemPadding : undefined;
  const rad = menu.borderRadius != null && menu.borderRadius !== '' ? menu.borderRadius : undefined;
  return {
    padding: pad ?? 'var(--menu-item-padding, 8px 14px)',
    borderRadius: rad ?? 'var(--menu-item-radius, 6px)',
    color: 'var(--menu-color, inherit)',
    background: 'var(--menu-item-bg, transparent)',
  };
}

export function menuCssVars(style = {}, options = {}) {
  const menu = style?.menu || {};
  const dd = menu?.dropdown || {};
  const colors = style?.colors || {};
  const typo = style?.typography || {};
  const remapContentColors = Boolean(options.darkContentMode);
  const gapRaw = menu.gap;
  const gap =
    gapRaw != null && gapRaw !== ''
      ? typeof gapRaw === 'number'
        ? `${gapRaw}px`
        : String(gapRaw)
      : '12px';
  const textColor = colors.text || colors.textColor || typo.color;
  const pad = menu.itemPadding != null && menu.itemPadding !== '' ? String(menu.itemPadding) : '8px 14px';
  const rad = menu.borderRadius != null && menu.borderRadius !== '' ? String(menu.borderRadius) : '6px';
  const out = {
    '--menu-gap': gap,
    '--menu-item-padding': pad,
    '--menu-item-radius': rad,
    '--menu-hover-color': menu.hoverColor || '#6366f1',
    '--menu-hover-bg': menu.hoverBg || 'rgba(99, 102, 241, 0.12)',
    '--menu-item-bg': menu.itemBg || 'transparent',
    '--menu-item-border-color': menu.itemBorderColor || 'color-mix(in srgb, currentColor 22%, transparent)',
    '--menu-button-bg': menu.buttonBg || '#6366f1',
    '--menu-button-color': menu.buttonColor || '#ffffff',

    // Dropdown vars (Menu dropdown inspector → style_json.menu.dropdown)
    ...(dd.itemFontSizePx > 0 ? { '--menu-dd-item-font-size': `${Number(dd.itemFontSizePx)}px` } : {}),
    ...(dd.itemPadding ? { '--menu-dd-item-padding': String(dd.itemPadding) } : {}),
    ...(dd.width ? { '--menu-dd-width': String(dd.width) } : {}),
    ...(dd.minWidth ? { '--menu-dd-min-width': String(dd.minWidth) } : {}),
    ...(dd.maxWidth ? { '--menu-dd-max-width': String(dd.maxWidth) } : {}),
    ...(dd.overflow ? { '--menu-dd-overflow': String(dd.overflow) } : {}),
    ...(dd.chevronSizePx > 0 ? { '--menu-dd-chev-size': `${Number(dd.chevronSizePx)}px` } : {}),
    ...(dd.chevronGapPx > 0 ? { '--menu-dd-chev-gap': `${Number(dd.chevronGapPx)}px` } : {}),
    ...(dd.shadow ? { '--menu-dd-shadow': String(dd.shadow) } : {}),
    ...(dd.borderRadiusPx > 0 ? { '--menu-dd-radius': `${Number(dd.borderRadiusPx)}px` } : {}),
    ...(dd.itemGapPx > 0 ? { '--menu-dd-item-gap': `${Number(dd.itemGapPx)}px` } : {}),
    ...(dd.offsetXPx ? { '--menu-dd-offset-x': `${Number(dd.offsetXPx)}px` } : {}),
    ...(dd.offsetYPx ? { '--menu-dd-offset-y': `${Number(dd.offsetYPx)}px` } : {}),
    ...(dd.nestedIndentPx > 0 ? { '--menu-dd-nested-indent': `${Number(dd.nestedIndentPx)}px` } : {}),
    ...(dd.nestedGapPx > 0 ? { '--menu-dd-nested-gap': `${Number(dd.nestedGapPx)}px` } : {}),
  };
  if (textColor) {
    let tc = String(textColor);
    if (
      remapContentColors &&
      (shouldStripNeutralDarkCssColor(tc) || shouldStripNeutralLightCssColor(tc))
    ) {
      tc = 'var(--live-section-fg, var(--color-text))';
    }
    out['--menu-color'] = tc;
  }
  return out;
}

function mergeInteractionLayers(base, override) {
  if (!override || typeof override !== 'object') return base || {};
  const out = { ...(base || {}) };
  for (const key of ['hover', 'pressed', 'active', 'focus', 'animation']) {
    if (override[key] == null) continue;
    out[key] = { ...(base?.[key] || {}), ...(override[key] || {}) };
  }
  return out;
}

function mergeDeviceLayers(base = {}, override = {}) {
  const baseMenu = base.menu || {};
  const overrideMenu = override.menu || {};
  const mergedMenu = {
    ...baseMenu,
    ...overrideMenu,
    dropdown: { ...(baseMenu.dropdown || {}), ...(overrideMenu.dropdown || {}) },
  };
  return {
    ...base,
    ...override,
    layout: { ...(base.layout || {}), ...(override.layout || {}) },
    spacing: { ...(base.spacing || {}), ...(override.spacing || {}) },
    colors: { ...(base.colors || {}), ...(override.colors || {}) },
    typography: { ...(base.typography || {}), ...(override.typography || {}) },
    size: { ...(base.size || {}), ...(override.size || {}) },
    background: { ...(base.background || {}), ...(override.background || {}) },
    effects: { ...(base.effects || {}), ...(override.effects || {}) },
    border: { ...(base.border || {}), ...(override.border || {}) },
    menu: mergedMenu,
    interactions: mergeInteractionLayers(base.interactions, override.interactions),
    transform: { ...(base.transform || {}), ...(override.transform || {}) },
  };
}

/** Responsive hide: `layout.visible === false` or `layout.hidden` (normalized). */
function applyResponsiveVisibility(merged) {
  if (!merged || typeof merged !== 'object') return merged;
  const lo = merged.layout || {};
  if (lo.visible === false || lo.visible === 'hidden' || lo.hidden === true) {
    return {
      ...merged,
      layout: {
        ...lo,
        display: 'none',
      },
    };
  }
  return merged;
}

/**
 * Desktop = base layer; tablet/mobile merge as overrides only (deep merge for key groups).
 * Legacy flat `style_json` (no `desktop` key) is treated as the desktop layer.
 */
export function getDeviceStyle(style = {}, device = 'desktop') {
  if (!style || typeof style !== 'object') return {};
  const hasDesktopKey =
    Object.prototype.hasOwnProperty.call(style, 'desktop') &&
    style.desktop != null &&
    typeof style.desktop === 'object';
  const base = hasDesktopKey ? { ...(style.desktop || {}) } : { ...style };
  if (device === 'desktop') {
    return applyResponsiveVisibility(base);
  }
  return applyResponsiveVisibility(mergeDeviceLayers(base, style[device] || {}));
}
