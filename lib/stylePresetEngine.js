/**
 * Apply project style presets / variants to a node's device style.
 *
 * Merge order:
 * local override → preset → siteTheme defaults (handled by caller)
 *
 * We do NOT mutate node/style_json; caller just uses merged output for rendering.
 */

import { getDeviceStyle } from './styleToCss';
import { deepMergePreferDefined } from './siteDesignTheme';
import { findPreset, normalizeStylePresets } from './stylePresetsStore';

const VARIANT_STYLE_NODE_TYPES = new Set([
  'button',
  'content_card',
  'row',
  'column',
  'stack',
  'heading',
  'text',
  'rich_text',
  'badge_label',
  'container_box',
]);

function styleVariantForNode(node) {
  const nt = String(node?.nodeType || '');
  if (!VARIANT_STYLE_NODE_TYPES.has(nt)) return '';
  const v = typeof node?.props?.variant === 'string' ? node.props.variant.trim() : '';
  return v;
}

export function resolveNodePresetRef(node) {
  const presetId = typeof node?.props?.presetId === 'string' ? node.props.presetId.trim() : '';
  const variant = styleVariantForNode(node);
  return { presetId, variant };
}

export function applyStylePresetToDeviceStyle({ node, device, localDeviceStyle, stylePresets } = {}) {
  if (!node || !localDeviceStyle) return localDeviceStyle || {};
  const sp = normalizeStylePresets(stylePresets);
  const { presetId, variant } = resolveNodePresetRef(node);
  const preset = findPreset(sp, { presetId, nodeType: node.nodeType, variant });
  if (!preset?.style_json) return localDeviceStyle;
  const presetDeviceStyle = getDeviceStyle(preset.style_json, device);
  // Local overrides win, so `over=local` and `base=preset`.
  return deepMergePreferDefined(localDeviceStyle, presetDeviceStyle || {});
}

