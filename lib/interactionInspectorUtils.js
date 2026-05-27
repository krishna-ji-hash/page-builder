/**
 * Normalize style_json.interactions for inspector + storage (no UI placeholder defaults).
 */

import { isValidAnimationPreset, normalizeAnimationPreset } from './interactionAnimations.js';

function isEmpty(val) {
  return val == null || val === '' || (typeof val === 'string' && !String(val).trim());
}

function cleanGroup(group = {}) {
  if (!group || typeof group !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(group)) {
    if (!isEmpty(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

function cleanAnimation(anim = {}) {
  if (!anim || typeof anim !== 'object') return null;
  const preset = normalizeAnimationPreset(anim.preset);
  if (preset === 'none') return null;
  if (!isValidAnimationPreset(preset)) return null;
  const out = { preset };
  if (!isEmpty(anim.duration)) out.duration = Number(anim.duration) || 0.6;
  if (!isEmpty(anim.delay)) out.delay = Number(anim.delay) || 0;
  if (!isEmpty(anim.easing)) out.easing = String(anim.easing);
  if (anim.loop === true) out.loop = true;
  const trigger = String(anim.trigger || '').trim();
  out.trigger =
    trigger === 'on-hover' || trigger === 'on-scroll' || trigger === 'on-load' ? trigger : 'on-load';
  return out;
}

/** Remove empty groups and animation when preset is none. */
export function pruneInteractions(ix = {}) {
  if (!ix || typeof ix !== 'object') return {};
  const out = {};
  const hover = cleanGroup(ix.hover);
  const active = cleanGroup(ix.active);
  const focus = cleanGroup(ix.focus);
  const animation = cleanAnimation(ix.animation);
  if (hover) out.hover = hover;
  if (active) out.active = active;
  if (focus) out.focus = focus;
  if (animation) out.animation = animation;
  return out;
}

/** Form display: no fake trigger/duration until animation is configured. */
export function interactionsForForm(ix = {}) {
  const pruned = pruneInteractions(ix);
  if (pruned.animation?.preset) {
    pruned.animation = {
      ...pruned.animation,
      preset: normalizeAnimationPreset(pruned.animation.preset),
    };
  }
  return pruned;
}

/** Remove one interaction group in a single patch (avoid N API writes on "Clear"). */
export function clearInteractionGroup(currentIx = {}, group) {
  const prev = pruneInteractions(currentIx);
  if (!group || !prev[group]) return prev;
  const next = { ...prev };
  delete next[group];
  return pruneInteractions(next);
}

export function patchInteractionGroup(currentIx = {}, group, key, value) {
  const prev = pruneInteractions(currentIx);
  const nextGroup = { ...(prev[group] || {}) };
  if (isEmpty(value)) {
    delete nextGroup[key];
  } else if (group === 'animation' && key === 'loop') {
    nextGroup[key] = Boolean(value);
  } else if (group === 'animation' && (key === 'duration' || key === 'delay')) {
    const n = Number.parseFloat(String(value));
    if (Number.isFinite(n)) nextGroup[key] = n;
  } else {
    nextGroup[key] = value;
  }

  const next = { ...prev };
  const cleaned = group === 'animation' ? cleanAnimation(nextGroup) : cleanGroup(nextGroup);
  if (cleaned) next[group] = cleaned;
  else delete next[group];

  return pruneInteractions(next);
}
