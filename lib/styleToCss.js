import { resolvedLayoutGapPx } from './layoutGapUtils.js';
import { DEFAULT_SITE_THEME } from './siteDesignTheme.js';

export function formatBox(box) {
  if (!box) return undefined;
  if (typeof box === 'string') return box;
  if (typeof box !== 'object') return undefined;
  const top = Number(box.top ?? 0);
  const right = Number(box.right ?? 0);
  const bottom = Number(box.bottom ?? 0);
  const left = Number(box.left ?? 0);
  return `${top}px ${right}px ${bottom}px ${left}px`;
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

function designTokenVars(style, siteTheme) {
  const theme = siteTheme ?? DEFAULT_SITE_THEME;
  const resolvedPx = resolvedLayoutGapPx(style.layout || {}, theme);
  const gapVal = coerceCssGap(resolvedPx ?? style.layout?.gap);
  const padStr = formatBox(style.spacing?.padding) || style.spacing?.padding;
  const rad = style.border?.radius || style.effects?.borderRadius;
  const radStr =
    rad != null && rad !== '' ? (typeof rad === 'number' && Number.isFinite(rad) ? `${rad}px` : String(rad)) : undefined;
  const textColor = style.colors?.text || style.colors?.textColor || style.typography?.color;
  const bg =
    style.colors?.background ||
    style.colors?.backgroundColor ||
    style.background?.backgroundColor;
  const borderWidth = style.border?.width;
  const borderColor = style.border?.color;

  const out = {};
  if (gapVal) out['--node-gap'] = gapVal;
  if (textColor) out['--node-text'] = textColor;
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
 */
export function styleToCss(style, siteTheme) {
  if (!style) return {};

  const theme = siteTheme ?? DEFAULT_SITE_THEME;
  const resolvedPx = resolvedLayoutGapPx(style.layout || {}, theme);
  const gapVal = coerceCssGap(resolvedPx ?? style.layout?.gap);
  const vars = designTokenVars(style, theme);
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

  return {
    ...vars,
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

    margin: formatBox(style.spacing?.margin) || style.spacing?.margin,
    padding: formatBox(style.spacing?.padding) || style.spacing?.padding,
    gap: gapVal,

    width: style.size?.width,
    height: style.size?.height,
    minHeight: style.size?.minHeight,
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
    whiteSpace: style.typography?.whiteSpace || style.layout?.whiteSpace,
    color: style.colors?.text || style.colors?.textColor || style.typography?.color,

    backgroundColor: style.colors?.background || style.colors?.backgroundColor || style.background?.backgroundColor,
    backgroundImage: style.background?.backgroundImage,
    backgroundSize: style.background?.backgroundSize,
    backgroundPosition: style.background?.backgroundPosition,
    backgroundRepeat: style.background?.backgroundRepeat,

    borderRadius: style.border?.radius || style.effects?.borderRadius,
    borderWidth: style.border?.width,
    borderColor: style.border?.color,
    borderStyle: style.border?.width ? (style.border?.style || 'solid') : undefined,
    boxShadow: style.effects?.boxShadow,
    opacity: style.effects?.opacity,
  };
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

export function menuCssVars(style = {}) {
  const menu = style?.menu || {};
  const colors = style?.colors || {};
  const typo = style?.typography || {};
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
  };
  if (textColor) out['--menu-color'] = textColor;
  return out;
}

function mergeDeviceLayers(base = {}, override = {}) {
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
    menu: { ...(base.menu || {}), ...(override.menu || {}) },
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
