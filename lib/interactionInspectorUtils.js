/**
 * Normalize style_json.interactions for inspector + storage (no UI placeholder defaults).
 */

import { isValidAnimationPreset, normalizeAnimationPreset } from './interactionAnimations.js';
import { clampOpacity } from './inspectorStyleValidate.js';
import { parseFiniteNumber } from './inspectorNumeric.js';

function isEmpty(val) {
  return val == null || val === '' || (typeof val === 'string' && !String(val).trim());
}

function cleanInteractionScalar(key, value) {
  if (isEmpty(value)) return null;
  if (key === 'opacity') {
    const n = parseFiniteNumber(value);
    return n == null ? null : clampOpacity(n);
  }
  if (key === 'scale') {
    const n = parseFiniteNumber(value);
    return n == null ? String(value).trim() : String(n);
  }
  return value;
}

function cleanGroup(group = {}) {
  if (!group || typeof group !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(group)) {
    const cleaned = cleanInteractionScalar(k, v);
    if (cleaned != null && !isEmpty(cleaned)) out[k] = cleaned;
  }
  return Object.keys(out).length ? out : null;
}

function cleanAnimation(anim = {}) {
  if (!anim || typeof anim !== 'object') return null;
  const preset = normalizeAnimationPreset(anim.preset);
  if (preset === 'none') return null;
  if (!isValidAnimationPreset(preset)) return null;
  const out = { preset };
  if (!isEmpty(anim.duration)) {
    const d = parseFiniteNumber(anim.duration);
    if (d != null && d >= 0) out.duration = d;
  }
  if (!isEmpty(anim.delay)) {
    const d = parseFiniteNumber(anim.delay);
    if (d != null && d >= 0) out.delay = d;
  }
  if (!isEmpty(anim.easing)) out.easing = String(anim.easing);
  if (anim.loop === true) out.loop = true;
  if (!isEmpty(anim.repeat)) {
    const r = parseFiniteNumber(anim.repeat);
    if (r != null && r > 1) out.repeat = Math.min(99, Math.floor(r));
  }
  const trigger = String(anim.trigger || '').trim();
  const allowed = new Set([
    'on-load',
    'on-scroll',
    'on-enter-viewport',
    'on-hover',
    'on-click',
    'on-focus',
  ]);
  out.trigger = allowed.has(trigger) ? trigger : 'on-load';
  const presetRef = String(anim.presetRef || '').trim();
  if (presetRef) out.presetRef = presetRef;
  return out;
}

/** Remove empty groups and animation when preset is none. */
export function pruneInteractions(ix = {}) {
  if (!ix || typeof ix !== 'object') return {};
  const out = {};
  const hover = cleanGroup(ix.hover);
  const active = cleanGroup(ix.active);
  const pressed = cleanGroup(ix.pressed);
  const focus = cleanGroup(ix.focus);
  const animation = cleanAnimation(ix.animation);
  if (hover) out.hover = hover;
  if (active) out.active = active;
  if (pressed) out.pressed = pressed;
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
  // Back-compat: "pressed" replaces legacy "active" click styles.
  if (group === 'pressed' && next.active) delete next.active;
  return pruneInteractions(next);
}

export function patchInteractionGroup(currentIx = {}, group, key, value) {
  const prev = pruneInteractions(currentIx);
  const normalizedGroup = group === 'pressed' ? 'pressed' : group;
  const nextGroup = { ...(prev[normalizedGroup] || {}) };
  if (isEmpty(value)) {
    delete nextGroup[key];
  } else if (group === 'animation' && key === 'loop') {
    nextGroup[key] = Boolean(value);
  } else if (group === 'animation' && key === 'repeat') {
    const n = parseFiniteNumber(value);
    if (n != null && n > 1) nextGroup[key] = Math.min(99, Math.floor(n));
    else delete nextGroup[key];
  } else if (group === 'animation' && (key === 'duration' || key === 'delay')) {
    const n = parseFiniteNumber(value);
    if (n != null && n >= 0) nextGroup[key] = n;
  } else if ((group === 'hover' || group === 'active' || group === 'pressed') && key === 'opacity') {
    const n = parseFiniteNumber(value);
    if (n != null) nextGroup[key] = clampOpacity(n);
  } else {
    nextGroup[key] = value;
  }

  const next = { ...prev };
  const cleaned = group === 'animation' ? cleanAnimation(nextGroup) : cleanGroup(nextGroup);
  if (cleaned) next[normalizedGroup] = cleaned;
  else delete next[normalizedGroup];

  // Back-compat: once pressed is edited, drop legacy active click styles.
  if (normalizedGroup === 'pressed' && next.active) {
    delete next.active;
  }

  return pruneInteractions(next);
}
