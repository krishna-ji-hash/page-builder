/** Default line color (slate-300). */
export const DIVIDER_DEFAULT_COLOR = '#cbd5e1';

export function dividerOrientationFromProps(props) {
  return props?.orientation === 'vertical' ? 'vertical' : 'horizontal';
}

/**
 * Responsive style_json for a divider leaf (color + thickness via background + size).
 */
export function buildDividerDefaultStyleJson(orientation = 'horizontal', options = {}) {
  const color = options.color || DIVIDER_DEFAULT_COLOR;
  const thickness = Number(options.thicknessPx) > 0 ? Number(options.thicknessPx) : 2;
  const isVertical = orientation === 'vertical';
  return {
    desktop: {
      background: { backgroundColor: color },
      size: isVertical
        ? { width: `${thickness}px`, height: '48px', minHeight: '24px' }
        : { width: '100%', height: `${thickness}px` },
      layout: {
        alignSelf: 'stretch',
        flexShrink: 0,
        display: 'block',
      },
    },
  };
}

export function buildDividerCreatePayload(orientation = 'horizontal') {
  return {
    props: { orientation, thicknessPx: 2 },
    style_json: buildDividerDefaultStyleJson(orientation),
  };
}

/** Full-height vertical accent beside a content column (heading + paragraphs). */
export function buildDividerStretchVerticalStyleJson(options = {}) {
  const color = options.color || DIVIDER_DEFAULT_COLOR;
  const thickness = Number(options.thicknessPx) > 0 ? Number(options.thicknessPx) : 2;
  return {
    desktop: {
      background: { backgroundColor: color },
      size: { width: `${thickness}px`, height: '100%', minHeight: '48px' },
      layout: {
        alignSelf: 'stretch',
        flex: '1 1 auto',
        flexShrink: 0,
        display: 'block',
      },
    },
  };
}

/** Sync size when thickness changes (keeps length on the long axis). */
export function dividerSizePatchForThickness(orientation, thicknessPx) {
  const t = Number(thicknessPx) > 0 ? Number(thicknessPx) : 2;
  if (orientation === 'vertical') {
    return { width: `${t}px` };
  }
  return { height: `${t}px`, width: '100%' };
}

/** Full size patch when orientation changes. */
export function dividerSizePatchForOrientation(orientation, thicknessPx) {
  const t = Number(thicknessPx) > 0 ? Number(thicknessPx) : 2;
  if (orientation === 'vertical') {
    return { width: `${t}px`, height: '48px', minHeight: '24px' };
  }
  return { width: '100%', height: `${t}px` };
}
