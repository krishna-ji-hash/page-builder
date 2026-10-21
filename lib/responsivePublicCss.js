/**
 * Public viewport CSS for explicit style_json tablet/mobile overrides.
 *
 * Inheritance matches getDeviceStyle():
 *   desktop = desktop
 *   tablet  = desktop + tablet
 *   mobile  = desktop + mobile
 * Tablet is not folded into mobile. The tablet query is the 768–1024px band.
 * The mobile query is max-width 767px.
 *
 * A property is emitted only when that device layer stores an explicit value
 * that differs from desktop. Empty buckets leave automatic public CSS in charge
 * (live-mobile-stack, live-tablet-wrap, root-row stacking, header, footer, blog).
 *
 * Header and footer subtrees do not receive generated flex/position rules.
 * Those landmarks stay on the existing structural stylesheet.
 */
import { isFooterRowNode, isHeaderRowNode } from './rowLayoutMeta.js';
import { getDeviceStyle, styleToCss } from './styleToCss.js';

export const RESPONSIVE_TABLET_MEDIA = '(max-width: 1024px) and (min-width: 768px)';
export const RESPONSIVE_MOBILE_MEDIA = '(max-width: 767px)';

const PUBLIC_SCOPE = '.live-doc:not([data-bld-device])';

/** Visual properties already painted by styleToCss. */
const VISUAL_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textTransform',
  'textDecoration',
  'textShadow',
  'whiteSpace',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'width',
  'maxWidth',
  'minWidth',
  'height',
  'maxHeight',
  'minHeight',
  'color',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'borderStyle',
  'boxShadow',
  'opacity',
  'transform',
  'filter',
];

/**
 * Image desktop ownership matches splitImageNodeCss:
 * size/margin live on the wrap, the rest on the figure.
 */
const IMAGE_SHELL_PROPS = new Set([
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'width',
  'maxWidth',
  'minWidth',
]);

/** Inspector flex controls. Grow/shrink/basis stay excluded (structural column rules). */
const LAYOUT_PROPS = [
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'rowGap',
  'columnGap',
  'alignSelf',
  'order',
];

const POSITION_PROPS = ['position', 'top', 'right', 'bottom', 'left', 'zIndex'];

const LAYOUT_SOURCE_KEY = {
  flexDirection: 'flexDirection',
  flexWrap: 'flexWrap',
  justifyContent: 'justifyContent',
  alignItems: 'alignItems',
  alignContent: 'alignContent',
  alignSelf: 'alignSelf',
  order: 'order',
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  zIndex: 'zIndex',
};

const KEYWORD_VALUES = {
  flexDirection: new Set(['row', 'row-reverse', 'column', 'column-reverse']),
  flexWrap: new Set(['nowrap', 'wrap', 'wrap-reverse']),
  justifyContent: new Set([
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
    'start',
    'end',
    'left',
    'right',
    'stretch',
  ]),
  alignItems: new Set(['stretch', 'flex-start', 'flex-end', 'center', 'baseline', 'start', 'end', 'normal']),
  alignContent: new Set([
    'stretch',
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
    'start',
    'end',
  ]),
  alignSelf: new Set(['auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline']),
  position: new Set(['static', 'relative', 'absolute', 'fixed', 'sticky']),
};

function cssPropName(key) {
  return key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function normCssValue(value) {
  if (value == null || value === false) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value !== 'string') return '';
  return value.trim();
}

/** Reject values that could break out of a declaration. */
export function isSafeResponsiveCssValue(value) {
  const text = normCssValue(value);
  if (!text || text.length > 300) return false;
  if (/[{}<>;]|\/\*|\*\/|\\|expression\s*\(|javascript\s*:|@import|!important/i.test(text)) return false;
  return true;
}

function isAllowedLayoutValue(prop, value) {
  const allowed = KEYWORD_VALUES[prop];
  if (allowed) return allowed.has(value);
  if (prop === 'order') return /^-?\d{1,4}$/.test(value);
  if (prop === 'zIndex') return value === 'auto' || /^-?\d{1,6}$/.test(value);
  return true;
}

/** Stable public node key. Rejects anything that is not a safe attribute value. */
export function responsiveNodeKey(id) {
  const text = String(id ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(text)) return '';
  return text;
}

export function publicLiveNodeAttrs(node, options) {
  if (options?.builderDataAttr) return {};
  const id = responsiveNodeKey(node?.id);
  if (!id) return {};
  return { 'data-live-node': id };
}

/** Figure/image visual target. Omitted in the builder selection tree. */
export function publicLiveNodeVisualAttrs(node, options) {
  if (options?.builderDataAttr) return {};
  const id = responsiveNodeKey(node?.id);
  if (!id) return {};
  return { 'data-live-node-visual': id };
}

function deviceCss(styleJson, device, siteTheme) {
  const css = styleToCss(getDeviceStyle(styleJson || {}, device), siteTheme) || {};
  const out = {};
  const keys = [...VISUAL_PROPS, ...LAYOUT_PROPS, ...POSITION_PROPS];
  for (const key of keys) {
    const text = normCssValue(css[key]);
    if (!text || !isSafeResponsiveCssValue(text)) continue;
    if (!isAllowedLayoutValue(key, text)) continue;
    out[key] = text;
  }
  if (normCssValue(css.display) === 'none') out.display = 'none';
  return out;
}

function rawLayout(styleJson, device) {
  const layer = styleJson?.[device];
  if (!layer || typeof layer !== 'object') return null;
  const layout = layer.layout;
  return layout && typeof layout === 'object' ? layout : null;
}

function hasExplicitLayoutKey(styleJson, device, prop) {
  const layout = rawLayout(styleJson, device);
  if (!layout) return false;
  if (prop === 'rowGap' || prop === 'columnGap') {
    const gap = layout.gap;
    const scale = layout.gapScale;
    return (gap != null && String(gap).trim() !== '') || (scale != null && String(scale).trim() !== '');
  }
  const source = LAYOUT_SOURCE_KEY[prop];
  if (!source) return false;
  const value = layout[source];
  return value != null && String(value).trim() !== '';
}

function targetFor(nodeType, prop) {
  if (LAYOUT_PROPS.includes(prop) || POSITION_PROPS.includes(prop)) return 'layout';
  if (nodeType === 'image' && prop !== 'display' && !IMAGE_SHELL_PROPS.has(prop)) return 'visual';
  return 'node';
}

function diffDeclarations(node, device, base, next, { skipStructuralLayout }) {
  const groups = { node: [], visual: [], layout: [] };
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  for (const key of keys) {
    const value = next[key];
    if (!value || value === base[key]) continue;
    if (key === 'display' && value !== 'none') continue;
    if (!isSafeResponsiveCssValue(value) || !isAllowedLayoutValue(key, value)) continue;
    const structural = LAYOUT_PROPS.includes(key) || POSITION_PROPS.includes(key);
    if (structural) {
      if (skipStructuralLayout) continue;
      if (!hasExplicitLayoutKey(node.style_json, device, key)) continue;
    }
    const target = targetFor(node.nodeType, key);
    groups[target].push(`${cssPropName(key)}:${value} !important`);
  }
  for (const list of Object.values(groups)) list.sort();
  return groups;
}

function walkNodes(nodes, insideLandmark, visit) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const landmark = insideLandmark || isHeaderRowNode(node) || isFooterRowNode(node);
    visit(node, landmark);
    if (Array.isArray(node.children)) walkNodes(node.children, landmark, visit);
  }
}

function selectorFor(id, target) {
  if (target === 'visual') return `${PUBLIC_SCOPE} [data-live-node-visual="${id}"]`;
  if (target === 'layout') {
    return `${PUBLIC_SCOPE} [data-live-node="${id}"][data-live-node="${id}"]`;
  }
  return `${PUBLIC_SCOPE} [data-live-node="${id}"]`;
}

function blockFor(media, groups) {
  if (!groups.size) return '';
  const bodies = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, ids]) => {
      const splitAt = key.indexOf('\n');
      const target = key.slice(0, splitAt);
      const decl = key.slice(splitAt + 1);
      const selectors = [...ids].sort().map((id) => selectorFor(id, target)).join(',\n');
      return `${selectors} {\n  ${decl.split(';').join(';\n  ')};\n}`;
    });
  return `@media ${media} {\n${bodies.join('\n')}\n}`;
}

/**
 * One stylesheet for a rendered public tree. Empty when nothing overrides desktop.
 * @param {object[]|null|undefined} nodes
 * @param {object|null|undefined} [siteTheme] resolves layout.gapScale the same way as the renderer
 * @returns {string}
 */
export function buildResponsivePublicCss(nodes, siteTheme) {
  const tablet = new Map();
  const mobile = new Map();

  const add = (bucket, id, target, declarations) => {
    if (!declarations.length) return;
    const key = `${target}\n${declarations.join(';')}`;
    const ids = bucket.get(key) || [];
    ids.push(id);
    bucket.set(key, ids);
  };

  walkNodes(nodes, false, (node, insideLandmark) => {
    const id = responsiveNodeKey(node.id);
    if (!id || !node.style_json || typeof node.style_json !== 'object') return;
    const desktop = deviceCss(node.style_json, 'desktop', siteTheme);
    for (const device of ['tablet', 'mobile']) {
      const bucket = device === 'tablet' ? tablet : mobile;
      const groups = diffDeclarations(node, device, desktop, deviceCss(node.style_json, device, siteTheme), {
        skipStructuralLayout: insideLandmark,
      });
      add(bucket, id, 'node', groups.node);
      add(bucket, id, 'visual', groups.visual);
      add(bucket, id, 'layout', groups.layout);
    }
  });

  return [blockFor(RESPONSIVE_TABLET_MEDIA, tablet), blockFor(RESPONSIVE_MOBILE_MEDIA, mobile)]
    .filter(Boolean)
    .join('\n');
}
