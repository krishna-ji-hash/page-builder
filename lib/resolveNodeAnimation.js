/**
 * Resolve style_json.interactions.animation with optional project preset ref.
 */

import { findAnimationPreset } from './animationPresetsStore.js';
import { normalizeAnimationPreset } from './interactionAnimations.js';

function isPlainObject(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

/**
 * Merge project preset defaults with per-node animation overrides.
 * @param {object} anim — style_json.interactions.animation
 * @param {object|null|undefined} animationPresets — projects.config_json.animationPresets
 */
export function resolveEffectiveAnimation(anim, animationPresets) {
  if (!anim || typeof anim !== 'object') return null;
  const presetRef = String(anim.presetRef || '').trim();
  let base = { ...anim };
  if (presetRef && animationPresets) {
    const found = findAnimationPreset(animationPresets, presetRef);
    if (found?.animation) {
      base = { ...found.animation, ...anim };
    }
  }
  const preset = normalizeAnimationPreset(base.preset);
  if (preset === 'none') return null;
  return { ...base, preset };
}

/**
 * @param {object} style — device-merged style_json layer
 * @param {object|null|undefined} animationPresets
 */
export function resolveNodeInteractions(style, animationPresets) {
  const ix = style?.interactions;
  if (!ix || typeof ix !== 'object') return ix;
  const eff = resolveEffectiveAnimation(ix.animation, animationPresets);
  if (!eff) {
    if (!ix.animation) return ix;
    const { animation: _a, ...rest } = ix;
    return Object.keys(rest).length ? rest : undefined;
  }
  if (eff === ix.animation) return ix;
  return { ...ix, animation: eff };
}

/**
 * @param {object} style
 * @param {object|null|undefined} animationPresets
 */
export function styleWithResolvedInteractions(style, animationPresets) {
  if (!style || typeof style !== 'object') return style;
  const ix = resolveNodeInteractions(style, animationPresets);
  if (ix === style?.interactions) return style;
  if (!ix) {
    if (!style.interactions) return style;
    const { interactions: _i, ...rest } = style;
    return rest;
  }
  return { ...style, interactions: ix };
}
