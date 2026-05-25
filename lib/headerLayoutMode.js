/**
 * Header layout modes for Style → Section width and template presets.
 * Background strip is always full-bleed; modes control inner bar (logo | nav | actions).
 */

/** @param {object} rowMeta */
export function resolveHeaderLayoutMode(rowMeta) {
  const layout = String(rowMeta?.headerLayout || '').toLowerCase().trim();
  if (layout === 'spread' || layout === 'full') return 'spread';
  if (layout === 'centered' || layout === 'center') return 'spread';
  if (layout === 'boxed') return 'boxed';
  const content = String(rowMeta?.headerContentWidth || '').toLowerCase().trim();
  if (content === 'full') return 'spread';
  if (layout === 'standard') return 'spread';
  return 'spread';
}

/** Strip legacy row max-width / horizontal auto margin so full-bleed headers can spread edge-to-edge. */
export function sanitizeHeaderRowCss(css, rowMeta) {
  if (!css || typeof css !== 'object') return css;
  const mode = resolveHeaderLayoutMode(rowMeta);
  const out = { ...css, width: '100%' };
  const h = out.height;
  if (h === 0 || h === '0' || h === '0px') {
    out.height = 'auto';
    out.minHeight = out.minHeight || 'min-content';
  }
  out.maxWidth = undefined;
  if (mode === 'spread' || mode === 'centered') {
    out.marginLeft = undefined;
    out.marginRight = undefined;
    if (typeof out.margin === 'string' && /\bauto\b/.test(out.margin)) {
      const parts = out.margin.trim().split(/\s+/);
      if (parts.length === 4) {
        out.margin = `${parts[0]} 0 ${parts[2]} 0`;
      } else if (parts.length === 2) {
        out.margin = `${parts[0]} 0`;
      } else {
        out.margin = undefined;
      }
    }
  }
  return out;
}

/**
 * @param {'spread'|'boxed'|'centered'} mode
 * @param {object} [prevMeta]
 */
export function headerLayoutMetaPatch(mode, prevMeta = {}) {
  const m = String(mode || 'boxed').toLowerCase();
  const base = { ...prevMeta, rootStripLayout: 'full', isHeader: true, role: 'header' };
  if (m === 'spread') {
    return {
      ...base,
      headerLayout: 'spread',
      headerContentWidth: 'full',
      headerAlign: 'between',
    };
  }
  if (m === 'centered') {
    return {
      ...base,
      headerLayout: 'centered',
      headerContentWidth: 'full',
      headerAlign: 'center',
    };
  }
  return {
    ...base,
    headerLayout: 'boxed',
    headerContentWidth: 'boxed',
    headerContentMaxWidthPx: Number(prevMeta.headerContentMaxWidthPx) >= 320 ? prevMeta.headerContentMaxWidthPx : 1200,
    headerAlign: 'between',
  };
}

export function headerAlignToJustifyContent(alignId) {
  const id = String(alignId || 'between').toLowerCase();
  if (id === 'left') return 'flex-start';
  if (id === 'center') return 'center';
  if (id === 'right') return 'flex-end';
  return 'space-between';
}

/** Patch desktop/tablet/mobile row `justifyContent` to match header alignment meta. */
export function applyHeaderAlignToRowStyleJson(styleJson, alignId) {
  const justify = headerAlignToJustifyContent(alignId);
  const base = styleJson && typeof styleJson === 'object' ? styleJson : {};
  const patchLayer = (layer) => {
    const L = layer && typeof layer === 'object' ? layer : {};
    const prevLayout = L.layout && typeof L.layout === 'object' ? L.layout : {};
    const layout = { ...prevLayout, justifyContent: justify };
    if (prevLayout.gap == null || prevLayout.gap === '') {
      layout.gap = 'clamp(10px, 2vw, 24px)';
    }
    return { ...L, layout };
  };
  return {
    ...base,
    desktop: patchLayer(base.desktop),
    tablet: patchLayer(base.tablet),
    mobile: patchLayer(base.mobile),
  };
}
