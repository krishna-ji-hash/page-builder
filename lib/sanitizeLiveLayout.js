/**
 * Published / preview layout guards — builder canvas may keep free-move coordinates;
 * live output must stay in normal document flow so sections contain their children.
 */

/** @param {Record<string, unknown> | null | undefined} css */
export function sanitizeLiveFlowPositionCss(css) {
  if (!css || typeof css !== 'object') return css;
  const pos = String(css.position || '').toLowerCase();
  if (pos !== 'absolute' && pos !== 'fixed') return css;
  return {
    ...css,
    position: 'relative',
    top: undefined,
    right: undefined,
    bottom: undefined,
    left: undefined,
    inset: undefined,
  };
}

/** Root content rows (section/main): never absolute — matches footer/header live guards. */
export function sanitizeLiveRootContentRowCss(css) {
  const base = sanitizeLiveFlowPositionCss(css);
  if (!base || typeof base !== 'object') return base;
  return {
    ...base,
    position: 'static',
    top: undefined,
    right: undefined,
    bottom: undefined,
    left: undefined,
    inset: undefined,
    zIndex: undefined,
    transform: undefined,
  };
}

/** Layout/box model only — compound widgets (FAQ accordion, feature tabs) own typography in CSS. */
const COMPOUND_WIDGET_SHELL_KEYS = new Set([
  'width',
  'maxWidth',
  'minWidth',
  'height',
  'maxHeight',
  'minHeight',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'boxSizing',
  'alignSelf',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'order',
]);

/**
 * Strip typography/colors from widget inline styles so live matches builder canvas
 * (builder applies node layout on the widget shell, not inherited fonts).
 * @param {Record<string, unknown> | null | undefined} css
 */
export function sanitizeCompoundWidgetShellCss(css) {
  if (!css || typeof css !== 'object') return css;
  const out = {};
  for (const [key, value] of Object.entries(css)) {
    if (value == null || value === '') continue;
    if (COMPOUND_WIDGET_SHELL_KEYS.has(key)) {
      out[key] = value;
      continue;
    }
    if (key.startsWith('--node-') && (key.includes('pad') || key.includes('margin') || key.includes('width'))) {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}
