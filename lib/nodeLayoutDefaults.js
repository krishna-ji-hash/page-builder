import { DEFAULT_SITE_THEME, normalizeSiteTheme, themeSpacingPx } from './siteDesignTheme.js';
import { applyTypographicStackRowToColumnDeviceStyle } from './stackLayoutCoercion.js';

/**
 * Layout defaults live in style_json (merged → inline styles), not in stylesheets.
 * Only fills keys that are missing so inspector / mouse edits always win.
 */

function mergeLayout(layout = {}, defaults = {}) {
  const out = { ...layout };
  for (const [k, v] of Object.entries(defaults)) {
    const cur = out[k];
    if (cur === undefined || cur === null || cur === '') {
      out[k] = v;
    }
  }
  return out;
}

function mergeSize(size = {}, defaults = {}) {
  const out = { ...size };
  for (const [k, v] of Object.entries(defaults)) {
    const cur = out[k];
    if (cur === undefined || cur === null || cur === '') {
      out[k] = v;
    }
  }
  return out;
}

function mergeSpacing(spacing = {}, defaults = {}) {
  const out = { ...spacing };
  for (const [k, v] of Object.entries(defaults)) {
    const cur = out[k];
    if (cur === undefined || cur === null || cur === '') {
      out[k] = v;
    }
  }
  return out;
}

function enforceLayout(layout = {}, required = {}) {
  return {
    ...layout,
    ...required,
  };
}

/**
 * Row flex defaults for builder + live (inline style_json). Later keys in `style` win.
 * @param {Record<string, unknown>} style — layout-like object (e.g. merged layout slice)
 */
export function applyRowDefaults(style = {}) {
  return {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: style.justifyContent ?? 'space-between',
    alignItems: style.alignItems ?? 'center',
    width: style.width ?? '100%',
    ...style,
  };
}

/**
 * @param {string} nodeType
 * @param {Record<string, unknown>} deviceStyle — output of getDeviceStyle(...)
 * @param {{ treeNode?: { nodeType?: string, children?: unknown[] }|null }} [options] — pass `treeNode` for stack typographic-pair row→column coercion (canvas / live / inspector parity)
 */
export function mergeDeviceStyleWithTypeDefaults(nodeType, deviceStyle = {}, options = {}) {
  const layout = deviceStyle.layout || {};
  const size = deviceStyle.size || {};
  const spacing = deviceStyle.spacing || {};

  if (nodeType === 'row') {
    const mergedRowLayout = applyRowDefaults(
      mergeLayout(layout, {
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
      })
    );
    /** Only default wrap when unset so saved `flex-wrap: wrap` (e.g. stacked header) is respected. */
    const rowRequired = {};
    if (mergedRowLayout.flexWrap == null || mergedRowLayout.flexWrap === '') {
      rowRequired.flexWrap = 'nowrap';
    }
    return {
      ...deviceStyle,
      layout: enforceLayout(mergedRowLayout, rowRequired),
      size: mergeSize(size, {
        width: '100%',
        height: size.height ?? 'auto',
      }),
    };
  }

  if (nodeType === 'column') {
    const merged = mergeLayout(layout, {
      alignItems: 'stretch',
      alignSelf: 'stretch',
      boxSizing: 'border-box',
    });
    const required = {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    };
    if (merged.flexGrow == null || merged.flexGrow === '') {
      required.flexGrow = 1;
    }
    if (merged.flexShrink == null || merged.flexShrink === '') {
      required.flexShrink = 1;
    }
    if (merged.flexBasis == null || merged.flexBasis === '') {
      required.flexBasis = '0%';
    }
    return {
      ...deviceStyle,
      layout: enforceLayout(merged, required),
      size: mergeSize(size, {
        width: '100%',
        height: size.height ?? 'auto',
      }),
    };
  }

  if (nodeType === 'stack') {
    const ds =
      options?.treeNode != null
        ? applyTypographicStackRowToColumnDeviceStyle(options.treeNode, deviceStyle)
        : deviceStyle;
    const stackLayout = ds.layout || {};
    const stackSize = ds.size || {};
    const stackSpacing = ds.spacing || {};
    const gapFromSpacing =
      stackSpacing.gap != null && stackSpacing.gap !== ''
        ? Number.parseFloat(String(stackSpacing.gap).replace(/px/gi, '').trim())
        : null;
    const resolvedGap =
      stackLayout.gap !== undefined && stackLayout.gap !== null && stackLayout.gap !== ''
        ? stackLayout.gap
        : Number.isFinite(gapFromSpacing)
          ? gapFromSpacing
          : 12;
    const { gap: _dropLegacyStackGap, ...spacingRest } = stackSpacing;
    const explicitDir = stackLayout.flexDirection;
    /** Default column so heading + paragraph + widgets stack vertically inside a column (row was a footgun). */
    const implicitDir =
      explicitDir != null && explicitDir !== '' && explicitDir !== undefined ? explicitDir : 'column';
    const defaultCrossAlign = implicitDir === 'column' ? 'stretch' : 'center';
    let merged = mergeLayout(stackLayout, {
      justifyContent: 'flex-start',
      alignItems: defaultCrossAlign,
      alignSelf: 'stretch',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box',
      gap: resolvedGap,
    });
    /** Hero chip stacks were saved with `flex: 0 1 auto` but styleToCss ignored `layout.flex` until it was parsed — browser default shrink split pill width. */
    if (
      (implicitDir === 'row' || implicitDir === 'row-reverse' || String(implicitDir || '').toLowerCase() === 'row') &&
      merged.flex != null &&
      String(merged.flex).trim().replace(/\s+/g, ' ') === '0 1 auto'
    ) {
      const { flex: _dropLegacyFlex, ...rest } = merged;
      merged = {
        ...rest,
        flexGrow: merged.flexGrow != null && merged.flexGrow !== '' ? merged.flexGrow : 0,
        flexShrink: merged.flexShrink != null && merged.flexShrink !== '' ? merged.flexShrink : 0,
        flexBasis: merged.flexBasis != null && merged.flexBasis !== '' ? merged.flexBasis : 'auto',
      };
    }
    const required = {
      display: 'flex',
      gap: resolvedGap,
      flexDirection: implicitDir,
    };
    /** `nowrap` keeps row-direction stacks (e.g. header: logo | nav | actions) on one line inside columns. */
    if (merged.flexWrap == null || merged.flexWrap === '') {
      required.flexWrap = 'nowrap';
    }
    // Row stacks (chips, icon+label pills, toolbar groups) should hug content width. Defaulting
    // `width: 100%` on every stack makes each pill in a horizontal row fight for 100% of the parent,
    // so flex-shrink splits them equally → narrow pills → wrapped label text on live.
    // Column stacks still default to full width of the parent column.
    const isRowStack =
      implicitDir === 'row' ||
      implicitDir === 'row-reverse' ||
      String(implicitDir || '').toLowerCase() === 'row';
    const stackSizeIn = ds.size || {};
    /** Saved pages often persist legacy `size.width: 100%` on row stacks; that forces equal shrink in a chip row. */
    let stackSizeOut = stackSizeIn;
    if (isRowStack && stackSizeOut.width != null && stackSizeOut.width !== '') {
      const ws = String(stackSizeOut.width).trim().toLowerCase();
      if (ws === '100%' || ws === '100') {
        const { width: _drop, ...rest } = stackSizeOut;
        stackSizeOut = rest;
      }
    }
    const defaultStackWidth = isRowStack ? 'auto' : '100%';
    return {
      ...ds,
      layout: enforceLayout(merged, required),
      spacing: mergeSpacing(spacingRest, {}),
      size: mergeSize(stackSizeOut, {
        width: defaultStackWidth,
        height: stackSizeOut.height ?? 'auto',
      }),
    };
  }

  if (nodeType === 'button') {
    const merged = mergeLayout(layout, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      flexShrink: 0,
      minWidth: 0,
      maxWidth: '100%',
      whiteSpace: 'nowrap',
    });
    return {
      ...deviceStyle,
      layout: enforceLayout(merged, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }),
      size: mergeSize(size, {
        width: size.width ?? 'auto',
        height: size.height ?? 'auto',
      }),
    };
  }

  if (nodeType === 'carousel') {
    // Carousels should fill their container (esp. inside row-direction stacks where align-items defaults to center).
    const rawWidth = size?.width;
    const widthStr = rawWidth != null ? String(rawWidth).trim().toLowerCase() : '';
    const isFullLike = widthStr === '' || widthStr === 'auto' || widthStr === '100%' || widthStr === '100';
    const isPercent = widthStr.endsWith('%');
    const forceFullWidth = !isPercent && !isFullLike;

    const merged = mergeLayout(layout, {
      display: 'block',
      alignSelf: 'stretch',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box',
    });
    return {
      ...deviceStyle,
      layout: enforceLayout(merged, { display: 'block' }),
      size: mergeSize(size, {
        ...(forceFullWidth ? { width: '100%' } : {}),
        // If user never set a width, default to full-width.
        ...(rawWidth == null || rawWidth === '' ? { width: '100%' } : {}),
        height: size.height ?? 'auto',
      }),
    };
  }

  if (nodeType === 'rich_text') {
    return {
      ...deviceStyle,
      layout: mergeLayout(layout, {
        display: 'block',
        boxSizing: 'border-box',
      }),
      size: mergeSize(size, {
        width: '100%',
        height: size.height ?? 'auto',
      }),
    };
  }

  return deviceStyle;
}

/**
 * Heading / text inside flex stacks often shrink-wrap; `text-align: center|right` then has no room.
 * Stretch to the parent track and use full width when alignment needs a line box (unless width is explicit).
 */
export function mergeLeafTypographicAlignmentLayout(nodeType, deviceStyle) {
  if (!deviceStyle || typeof deviceStyle !== 'object') return deviceStyle;
  if (nodeType !== 'heading' && nodeType !== 'text') return deviceStyle;
  const ta = String(deviceStyle.typography?.textAlign || 'left').trim().toLowerCase();
  if (ta !== 'center' && ta !== 'right') return deviceStyle;
  const layout = deviceStyle.layout || {};
  const size = deviceStyle.size || {};
  const w = size.width;
  const wStr = w != null && w !== '' ? String(w).trim().toLowerCase() : '';
  const hasExplicitWidth =
    w != null &&
    w !== '' &&
    wStr !== 'auto' &&
    wStr !== 'fit-content' &&
    wStr !== 'max-content' &&
    wStr !== 'min-content';
  if (hasExplicitWidth) {
    return {
      ...deviceStyle,
      layout: {
        ...layout,
        alignSelf: 'stretch',
        minWidth: layout.minWidth ?? 0,
      },
    };
  }
  return {
    ...deviceStyle,
    layout: {
      ...layout,
      alignSelf: 'stretch',
      minWidth: layout.minWidth ?? 0,
    },
    size: {
      ...size,
      width: '100%',
    },
  };
}

function menuAlignToJustify(align) {
  const raw = String(align || 'center').trim();
  const a = raw.toLowerCase().replace(/\s+/g, '');
  if (['flex-start', 'center', 'flex-end', 'space-between', 'space-around'].includes(raw)) return raw;
  if (a === 'center') return 'center';
  if (a === 'right') return 'flex-end';
  if (a === 'spacebetween' || a === 'space-between') return 'space-between';
  if (a === 'left') return 'flex-start';
  return 'flex-start';
}

/**
 * Menu widget: flex row/column from orientation; main-axis alignment from props.align (or menu.align fallback).
 * Gap is driven by CSS var --menu-gap on .menu (not spacing.gap) to avoid double gap / overrides.
 */
export function mergeMenuDeviceStyle(orientation, deviceStyle = {}, menuProps = {}, siteTheme) {
  const isCol = orientation === 'column';
  const layout = deviceStyle.layout || {};
  const menu = deviceStyle.menu || {};
  const alignSource = menuProps.align ?? menu.align ?? 'center';
  const justify = menuAlignToJustify(alignSource);
  const theme = siteTheme && typeof siteTheme === 'object' ? normalizeSiteTheme(siteTheme) : normalizeSiteTheme(DEFAULT_SITE_THEME);

  const spacing = { ...(deviceStyle.spacing || {}) };
  delete spacing.gap;

  const rawGap = layout.gap ?? menu.gap;
  const defaultGap = themeSpacingPx(theme, 'md');
  let resolvedGap = defaultGap;
  if (rawGap != null && rawGap !== '') {
    if (typeof rawGap === 'number' && Number.isFinite(rawGap)) {
      resolvedGap = rawGap;
    } else {
      const n = Number.parseFloat(String(rawGap).replace(/px/gi, '').trim());
      if (Number.isFinite(n)) resolvedGap = n;
    }
  }

  const mergedLayout = mergeLayout(layout, {
    display: 'flex',
    flexDirection: isCol ? 'column' : 'row',
    flexWrap: isCol ? 'nowrap' : 'nowrap',
    alignItems: isCol ? 'flex-start' : 'center',
    justifyContent: justify,
    boxSizing: 'border-box',
    gap: resolvedGap,
    ...(isCol
      ? {}
      : {
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
        }),
  });

  return {
    ...deviceStyle,
    menu: {
      ...menu,
      gap: menu.gap != null && menu.gap !== '' ? menu.gap : resolvedGap,
    },
    layout: {
      ...mergedLayout,
      flexDirection: isCol ? 'column' : 'row',
      alignItems: isCol ? 'flex-start' : 'center',
      justifyContent: justify,
    },
    spacing: mergeSpacing(spacing, {}),
  };
}
