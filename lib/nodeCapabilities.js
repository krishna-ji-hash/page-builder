/**
 * Universal node capability map used by the Builder inspector.
 *
 * Rules:
 * - Does NOT change renderTree/live renderer pipeline
 * - Only controls which inspector tabs/panels are shown and which control-groups are enabled
 * - Responsive override-only behavior remains in BuilderInspector merge pipeline
 */
import { getInspectorExtensions } from './pluginInspectorRegistry.js';
import { COMPOUND_WIDGET_META } from './compoundWidgetRegistry.js';

const ALL = Object.freeze({
  supportsLayout: true,
  supportsSpacing: true,
  supportsTypography: true,
  supportsBackground: true,
  supportsBorder: true,
  supportsEffects: true,
  supportsTransform: true,
  supportsInteractions: true,
  supportsParallax: false,
  supportsResponsive: true,
  supportsAnimation: true,
  supportsCms: false,
  supportsSeo: false,
  supportsMedia: false,
  supportsCarousel: false,
  supportsForm: false,
  supportsMenu: false,
  supportsAdvanced: true,
  supportsCompoundChrome: false,
});

/** Minimal overrides per nodeType (everything else inherits from ALL). */
const OVERRIDES_BASE = {
  row: { supportsSeo: true, supportsCms: true, supportsParallax: true },
  column: { supportsCms: true, supportsParallax: true },
  stack: { supportsCms: true, supportsParallax: true },
  image: { supportsMedia: true, supportsParallax: true },
  video_embed: { supportsMedia: true },
  carousel: { supportsCarousel: true, supportsMedia: true },
  menu: { supportsMenu: true, supportsCms: true },
  newsletter_form: { supportsForm: true, supportsCms: true },
  form: { supportsForm: true, supportsCms: true },
  tabs: { supportsCms: true },
  accordion: { supportsCms: true },
  widget: { supportsCms: true, supportsAdvanced: true },
};

for (const [nodeType, meta] of Object.entries(COMPOUND_WIDGET_META)) {
  OVERRIDES_BASE[nodeType] = { ...(OVERRIDES_BASE[nodeType] || {}), ...meta.caps };
}

const OVERRIDES = Object.freeze(OVERRIDES_BASE);

function mergeCaps(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  const out = { ...base };
  Object.keys(extra).forEach((k) => {
    if (k in out) out[k] = Boolean(extra[k]);
  });
  return out;
}

/**
 * Returns resolved capabilities for a node type, including plugin extensions.
 * @param {string} nodeType
 * @param {object} [ctx]
 */
export function getNodeCapabilities(nodeType, ctx = {}) {
  const nt = String(nodeType || 'widget').trim() || 'widget';
  const base = { ...ALL, ...(OVERRIDES[nt] || {}) };

  // Plugins/apps may extend capabilities without editing core logic.
  const exts = getInspectorExtensions();
  const extCaps = exts?.capabilityExtensions || [];
  let merged = base;
  for (const ext of extCaps) {
    try {
      const patch = typeof ext === 'function' ? ext(nt, ctx) : null;
      merged = mergeCaps(merged, patch);
    } catch {
      // ignore extension errors; never break inspector
    }
  }
  return merged;
}

/** Convenience: compute which inspector tabs to show for a node. */
export function inspectorTabsForNode(nodeType, { isTheme = false } = {}) {
  if (isTheme) {
    return [{ id: 'theme', label: 'Theme', icon: '◆' }];
  }
  const caps = getNodeCapabilities(nodeType);
  const tabs = [{ id: 'content', label: 'Content', icon: '✎' }];
  if (caps.supportsLayout) tabs.push({ id: 'layout', label: 'Layout', icon: '▦' });
  if (
    caps.supportsCompoundChrome ||
    caps.supportsSpacing ||
    caps.supportsTypography ||
    caps.supportsBackground ||
    caps.supportsBorder ||
    caps.supportsEffects ||
    caps.supportsTransform ||
    caps.supportsMenu ||
    caps.supportsCarousel ||
    caps.supportsForm ||
    caps.supportsMedia
  ) {
    tabs.push({ id: 'style', label: 'Style', icon: '◐' });
  }
  if (caps.supportsForm) tabs.push({ id: 'form', label: 'Form', icon: '▤' });
  if (caps.supportsInteractions) tabs.push({ id: 'interactions', label: 'Interactions', icon: '↯' });
  if (caps.supportsAdvanced) tabs.push({ id: 'advanced', label: 'Advanced', icon: '⚙' });
  if (caps.supportsSeo || caps.supportsCms) tabs.push({ id: 'seo', label: 'SEO/CMS', icon: '◎' });
  return tabs;
}

