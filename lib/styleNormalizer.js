import {
  buildHeaderRowCompactLayout,
  buildRowMobileStackLayout,
  COLUMN_MOBILE_WIDTH_ONLY,
  MOBILE_IMAGE_SIZE,
} from './responsiveLayoutDefaults.js';
import { DEFAULT_SITE_THEME } from './siteDesignTheme.js';

function isHeaderOrFooterRowMeta(meta) {
  if (!meta || typeof meta !== 'object') return false;
  const role = String(meta.role || '').toLowerCase();
  return Boolean(meta.isHeader || meta.isFooter || role === 'header' || role === 'footer');
}

function isHeaderRowMeta(meta) {
  if (!meta || typeof meta !== 'object') return false;
  const role = String(meta.role || '').toLowerCase();
  return Boolean(meta.isHeader || role === 'header');
}

function isFooterRowMeta(meta) {
  if (!meta || typeof meta !== 'object') return false;
  const role = String(meta.role || '').toLowerCase();
  return Boolean(meta.isFooter || role === 'footer');
}

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

/** Preserved verbatim through normalizeStyle / responsive merge (not defaulted). */
const PASS_THROUGH_STYLE_GROUPS = ['menu', 'interactions', 'transform'];

/**
 * @param {Record<string, unknown>} style
 * @param {{ nodeType?: string|null }} [options] — stacks default main axis to column (blocks stack vertically in a column).
 */
export function normalizeStyle(style = {}, options = {}) {
  const lo = { ...(style.layout || {}) };
  const sp = style.spacing || {};
  /** Legacy `spacing.gap` → single source `layout.gap` (px number when parseable). */
  if ((lo.gap === undefined || lo.gap === null || lo.gap === '') && sp.gap != null && sp.gap !== '') {
    const n = parseFloat(String(sp.gap).replace(/px/gi, '').trim());
    if (Number.isFinite(n)) lo.gap = n;
  }
  const defaultFlexDirection = options?.nodeType === 'stack' ? 'column' : 'row';
  const layout = {
    display: lo.display || 'block',
    flexDirection: lo.flexDirection || defaultFlexDirection,
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

  const out = {
    layout,
    spacing,
    size: {
      width: style.size?.width || '100%',
      height: style.size?.height || 'auto',
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
      color: style.typography?.color || '#000000',
      ...(style.typography?.whiteSpace != null && String(style.typography.whiteSpace).trim() !== ''
        ? { whiteSpace: style.typography.whiteSpace }
        : {}),
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
      ...(style.background?.backgroundImage && String(style.background.backgroundImage).trim() !== 'none'
        ? {
            backgroundImage: style.background.backgroundImage,
            backgroundSize: style.background?.backgroundSize || 'cover',
            backgroundPosition: style.background?.backgroundPosition || 'center',
            backgroundRepeat: style.background?.backgroundRepeat || 'no-repeat',
          }
        : {}),
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
  for (const key of PASS_THROUGH_STYLE_GROUPS) {
    const group = style[key];
    if (group && typeof group === 'object' && !Array.isArray(group)) {
      out[key] = { ...group };
    }
  }
  return out;
}

function mergeStyleLayers(base, override = {}) {
  const merged = {
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
  for (const key of PASS_THROUGH_STYLE_GROUPS) {
    const b = base[key];
    const o = override[key];
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      merged[key] = { ...b, ...(o && typeof o === 'object' && !Array.isArray(o) ? o : {}) };
    } else if (o && typeof o === 'object' && !Array.isArray(o)) {
      merged[key] = { ...o };
    }
  }
  return merged;
}

function pickOverrides(base, merged) {
  const pickGroup = (group) => {
    const mergedGroup = merged[group];
    if (!mergedGroup || typeof mergedGroup !== 'object' || Array.isArray(mergedGroup)) {
      return undefined;
    }
    const baseGroup =
      base[group] && typeof base[group] === 'object' && !Array.isArray(base[group]) ? base[group] : {};
    const out = {};
    Object.keys(mergedGroup).forEach((key) => {
      if (mergedGroup[key] !== baseGroup[key]) {
        out[key] = mergedGroup[key];
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
  for (const key of PASS_THROUGH_STYLE_GROUPS) {
    const picked = pickGroup(key);
    if (picked) result[key] = picked;
  }

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
export function ensureResponsiveLayoutStyleJson(styleJson = {}, nodeType, siteTheme, rowMeta = null) {
  if (!styleJson || typeof styleJson !== 'object') return styleJson || {};
  const theme = siteTheme && typeof siteTheme === 'object' ? siteTheme : DEFAULT_SITE_THEME;
  if (nodeType === 'row') {
    const mobileLayer = styleJson.mobile && typeof styleJson.mobile === 'object' ? styleJson.mobile : {};
    const tabletLayer = styleJson.tablet && typeof styleJson.tablet === 'object' ? styleJson.tablet : {};
    const existingMobileLayout =
      mobileLayer.layout && typeof mobileLayer.layout === 'object' ? mobileLayer.layout : {};
    const existingTabletLayout =
      tabletLayer.layout && typeof tabletLayer.layout === 'object' ? tabletLayer.layout : {};
    const compactLayout = buildHeaderRowCompactLayout();

    if (isFooterRowMeta(rowMeta)) {
      if (existingMobileLayout.flexDirection != null && existingMobileLayout.flexDirection !== '') {
        return styleJson;
      }
      return {
        ...styleJson,
        mobile: {
          ...mobileLayer,
          layout: {
            ...buildRowMobileStackLayout(theme),
            ...existingMobileLayout,
            flexDirection: 'column',
            flexWrap: 'nowrap',
          },
        },
        tablet: {
          ...tabletLayer,
          layout: {
            ...existingTabletLayout,
            flexWrap: 'wrap',
            alignItems: 'stretch',
          },
        },
      };
    }

    if (isHeaderRowMeta(rowMeta)) {
      return {
        ...styleJson,
        mobile: {
          ...mobileLayer,
          layout: {
            ...existingMobileLayout,
            ...compactLayout,
            flexDirection: 'row',
            flexWrap: 'nowrap',
          },
        },
        tablet: {
          ...tabletLayer,
          layout: {
            ...existingTabletLayout,
            ...compactLayout,
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: 12,
          },
        },
      };
    }

    /** Auto-stack on small viewports when mobile layout is missing (single source; no CSS overrides). */
    if (existingMobileLayout.flexDirection != null && existingMobileLayout.flexDirection !== '') {
      return styleJson;
    }
    return {
      ...styleJson,
      mobile: {
        ...mobileLayer,
        layout: {
          ...buildRowMobileStackLayout(theme),
          ...existingMobileLayout,
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

/** Mobile typography + image width when layers are missing (render-time parity). */
export function ensureResponsiveTypographyAndMediaStyleJson(styleJson = {}, nodeType) {
  if (!styleJson || typeof styleJson !== 'object') return styleJson || {};
  let next = { ...styleJson };

  if (nodeType === 'heading') {
    const mobileLayer = next.mobile && typeof next.mobile === 'object' ? { ...next.mobile } : {};
    const mobileTypo =
      mobileLayer.typography && typeof mobileLayer.typography === 'object' ? mobileLayer.typography : {};
    if (parseFontSizePx(mobileTypo) == null) {
      const desktopTypo =
        next.desktop?.typography && typeof next.desktop.typography === 'object'
          ? next.desktop.typography
          : next.typography && typeof next.typography === 'object'
            ? next.typography
            : {};
      let scaled = scaleTypographyLayer({ typography: desktopTypo }, 0.72, 16);
      let fs = parseFontSizePx(scaled.typography);
      if (fs != null && fs > 36) {
        scaled = {
          ...scaled,
          typography: { ...scaled.typography, fontSize: '32px', lineHeight: '1.1' },
        };
      }
      next = {
        ...next,
        mobile: mergeDeviceSlice(mobileLayer, scaled),
      };
    }
  }

  if (nodeType === 'text') {
    const mobileLayer = next.mobile && typeof next.mobile === 'object' ? { ...next.mobile } : {};
    const mobileTypo =
      mobileLayer.typography && typeof mobileLayer.typography === 'object' ? mobileLayer.typography : {};
    const desktopFs = parseFontSizePx(
      next.desktop?.typography || (next.typography && typeof next.typography === 'object' ? next.typography : {})
    );
    if (parseFontSizePx(mobileTypo) == null && desktopFs != null && desktopFs > 18) {
      next = {
        ...next,
        mobile: mergeDeviceSlice(mobileLayer, {
          typography: { fontSize: `${Math.max(14, Math.round(desktopFs * 0.9))}px` },
          size: { maxWidth: '100%' },
        }),
      };
    }
  }

  if (nodeType === 'image') {
    const m = next.mobile && typeof next.mobile === 'object' ? next.mobile : {};
    if (m.size?.width == null || m.size.width === '') {
      next = {
        ...next,
        mobile: mergeDeviceSlice(m, MOBILE_IMAGE_SIZE.mobile),
      };
    }
  }

  return next;
}

/**
 * @param {Record<string, unknown>} style
 * @param {{ nodeType?: string|null, siteTheme?: object|null }} [options] — `siteTheme` tunes row mobile gap from spacing tokens
 */
export function normalizeResponsiveStyle(style = {}, options = {}) {
  const nodeType = options?.nodeType ?? null;
  const siteTheme = options?.siteTheme ?? null;
  const rowMeta = options?.rowMeta ?? null;
  let prepared = style || {};
  if (nodeType) {
    prepared = ensureResponsiveLayoutStyleJson(prepared, nodeType, siteTheme, rowMeta);
    prepared = ensureResponsiveTypographyAndMediaStyleJson(prepared, nodeType);
  }
  const desktopInput = prepared.desktop || prepared;
  const normOpts = { nodeType };
  const desktop = normalizeStyle(desktopInput, normOpts);

  const tabletMerged = normalizeStyle(mergeStyleLayers(desktop, prepared.tablet || {}), normOpts);
  const mobileMerged = normalizeStyle(mergeStyleLayers(desktop, prepared.mobile || {}), normOpts);

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