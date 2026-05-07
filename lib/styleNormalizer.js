import { buildRowMobileStackLayout, COLUMN_MOBILE_WIDTH_ONLY } from './responsiveLayoutDefaults.js';
import { DEFAULT_SITE_THEME } from './siteDesignTheme.js';

const OPTIONAL_LAYOUT_KEYS = [
  'gap',
  'gapScale',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'minWidth',
  'maxWidth',
  'boxSizing',
  'alignSelf',
  'width',
];

export function normalizeStyle(style = {}) {
  const lo = { ...(style.layout || {}) };
  const sp = style.spacing || {};
  /** Legacy `spacing.gap` → single source `layout.gap` (px number when parseable). */
  if ((lo.gap === undefined || lo.gap === null || lo.gap === '') && sp.gap != null && sp.gap !== '') {
    const n = parseFloat(String(sp.gap).replace(/px/gi, '').trim());
    if (Number.isFinite(n)) lo.gap = n;
  }
  const layout = {
    display: lo.display || 'block',
    flexDirection: lo.flexDirection || 'row',
    justifyContent: lo.justifyContent || 'flex-start',
    alignItems: lo.alignItems || 'stretch',
    alignContent: lo.alignContent || 'stretch',
    position: lo.position || 'static',
    top: lo.top || 'auto',
    right: lo.right || 'auto',
    bottom: lo.bottom || 'auto',
    left: lo.left || 'auto',
    zIndex: lo.zIndex || 'auto',
    overflow: lo.overflow || 'visible',
  };
  for (const key of OPTIONAL_LAYOUT_KEYS) {
    if (lo[key] !== undefined && lo[key] !== null && lo[key] !== '') {
      layout[key] = lo[key];
    }
  }
  if ('visible' in lo) layout.visible = lo.visible;
  if ('hidden' in lo) layout.hidden = lo.hidden;

  const spacing = {
    margin: sp.margin || '0px',
    padding: sp.padding || '0px',
  };

  return {
    layout,
    spacing,
    size: {
      width: style.size?.width || '100%',
      height: style.size?.height || 'auto'
    },
    typography: {
      fontFamily: style.typography?.fontFamily || 'Inter',
      fontSize: style.typography?.fontSize || '16px',
      fontWeight: style.typography?.fontWeight || '400',
      lineHeight: style.typography?.lineHeight || '1.4',
      letterSpacing: style.typography?.letterSpacing || '0px',
      textTransform: style.typography?.textTransform || 'none',
      textDecoration: style.typography?.textDecoration || 'none',
      textAlign: style.typography?.textAlign || 'left',
      color: style.typography?.color || '#000000'
    },
    colors: {
      ...(style.colors?.text != null && style.colors?.text !== '' ? { text: style.colors.text } : {}),
      textColor: style.colors?.textColor || style.colors?.text || style.typography?.color || '#000000',
      ...(style.colors?.background != null && style.colors?.background !== ''
        ? { background: style.colors.background }
        : {}),
      backgroundColor:
        style.colors?.backgroundColor || style.colors?.background || style.background?.backgroundColor || 'transparent',
    },
    background: {
      backgroundColor: style.background?.backgroundColor || 'transparent',
      backgroundImage: style.background?.backgroundImage || 'none',
      backgroundSize: style.background?.backgroundSize || 'cover',
      backgroundPosition: style.background?.backgroundPosition || 'center',
      backgroundRepeat: style.background?.backgroundRepeat || 'no-repeat',
    },
    effects: {
      borderRadius: style.effects?.borderRadius || '0px',
      boxShadow: style.effects?.boxShadow || 'none',
      opacity: style.effects?.opacity || '1',
    },
    border: {
      radius: style.border?.radius || style.effects?.borderRadius || '0px',
      width: style.border?.width || '0px',
      color: style.border?.color || '#000000',
      style: style.border?.style || 'solid',
    },
  };
}

function mergeStyleLayers(base, override = {}) {
  return {
    layout: {
      ...base.layout,
      ...(override.layout || {}),
    },
    spacing: {
      ...base.spacing,
      ...(override.spacing || {}),
    },
    size: {
      ...base.size,
      ...(override.size || {}),
    },
    typography: {
      ...base.typography,
      ...(override.typography || {}),
    },
    colors: {
      ...base.colors,
      ...(override.colors || {}),
    },
    background: {
      ...base.background,
      ...(override.background || {}),
    },
    effects: {
      ...base.effects,
      ...(override.effects || {}),
    },
    border: {
      ...base.border,
      ...(override.border || {}),
    },
  };
}

function pickOverrides(base, merged) {
  const pickGroup = (group) => {
    const out = {};
    Object.keys(merged[group] || {}).forEach((key) => {
      if (merged[group][key] !== base[group][key]) {
        out[key] = merged[group][key];
      }
    });
    return Object.keys(out).length ? out : undefined;
  };

  const result = {
    layout: pickGroup('layout'),
    spacing: pickGroup('spacing'),
    size: pickGroup('size'),
    typography: pickGroup('typography'),
    colors: pickGroup('colors'),
    background: pickGroup('background'),
    effects: pickGroup('effects'),
    border: pickGroup('border'),
  };

  Object.keys(result).forEach((key) => {
    if (!result[key]) delete result[key];
  });
  return result;
}

/**
 * When `style_json` omits mobile overrides, apply stable defaults (single source; no read-time merge).
 * @param {Record<string, unknown>} styleJson
 * @param {string|null|undefined} nodeType
 * @param {object|null|undefined} siteTheme — drives tokenized gap; defaults to light preset
 */
export function ensureResponsiveLayoutStyleJson(styleJson = {}, nodeType, siteTheme) {
  if (!styleJson || typeof styleJson !== 'object') return styleJson || {};
  const theme = siteTheme && typeof siteTheme === 'object' ? siteTheme : DEFAULT_SITE_THEME;
  if (nodeType === 'row') {
    const mobileLayer = styleJson.mobile && typeof styleJson.mobile === 'object' ? styleJson.mobile : {};
    const existingLayout = mobileLayer.layout && typeof mobileLayer.layout === 'object' ? mobileLayer.layout : {};
    /** Auto-stack on small viewports when mobile layout is missing (single source; no CSS overrides). */
    if (existingLayout.flexDirection != null && existingLayout.flexDirection !== '') {
      return styleJson;
    }
    return {
      ...styleJson,
      mobile: {
        ...mobileLayer,
        layout: {
          ...buildRowMobileStackLayout(theme),
          ...existingLayout,
          flexDirection: 'column',
        },
      },
    };
  }
  if (nodeType === 'column') {
    const m = styleJson.mobile || {};
    if (m.size?.width != null && m.size.width !== '') {
      return styleJson;
    }
    return {
      ...styleJson,
      mobile: {
        ...m,
        size: { ...(m.size || {}), ...COLUMN_MOBILE_WIDTH_ONLY.mobile.size },
      },
    };
  }
  return styleJson;
}

/**
 * @param {Record<string, unknown>} style
 * @param {{ nodeType?: string|null, siteTheme?: object|null }} [options] — `siteTheme` tunes row mobile gap from spacing tokens
 */
export function normalizeResponsiveStyle(style = {}, options = {}) {
  const nodeType = options?.nodeType ?? null;
  const siteTheme = options?.siteTheme ?? null;
  const prepared = nodeType ? ensureResponsiveLayoutStyleJson(style || {}, nodeType, siteTheme) : style || {};
  const desktopInput = prepared.desktop || prepared;
  const desktop = normalizeStyle(desktopInput);

  const tabletMerged = normalizeStyle(mergeStyleLayers(desktop, prepared.tablet || {}));
  const mobileMerged = normalizeStyle(mergeStyleLayers(desktop, prepared.mobile || {}));

  return {
    desktop,
    tablet: pickOverrides(desktop, tabletMerged),
    mobile: pickOverrides(desktop, mobileMerged),
  };
}

/**
 * Remove keys from `layout` for one breakpoint (normalized shape).
 * @param {'desktop'|'tablet'|'mobile'} device
 * @param {string[]} keys — e.g. `['flexWrap','gap','gapScale']`
 */
export function stripDeviceLayoutKeysInStyleJson(styleJson, device, keys, nodeType, siteTheme) {
  if (!Array.isArray(keys) || !keys.length) return styleJson || {};
  const n = normalizeResponsiveStyle({ ...(styleJson || {}) }, { nodeType, siteTheme });

  if (device === 'desktop') {
    const lo = { ...(n.desktop?.layout || {}) };
    keys.forEach((k) => delete lo[k]);
    return { ...n, desktop: { ...n.desktop, layout: lo } };
  }

  if (device !== 'tablet' && device !== 'mobile') return n;

  const layer = { ...(n[device] || {}) };
  const lo = { ...(layer.layout || {}) };
  keys.forEach((k) => delete lo[k]);
  const nextLayer = { ...layer };
  if (Object.keys(lo).length > 0) nextLayer.layout = lo;
  else delete nextLayer.layout;

  const out = { ...n };
  if (Object.keys(nextLayer).length > 0) out[device] = nextLayer;
  else delete out[device];
  return out;
}