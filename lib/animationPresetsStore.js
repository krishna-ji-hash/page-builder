/**
 * Project-level animation presets on `projects.config_json.animationPresets`.
 * Built-ins are seeded; custom presets are user-created duplicates/edits.
 */

import { BUILTIN_ANIMATION_DEFINITIONS, normalizeAnimationPreset } from './interactionAnimations.js';

export const ANIMATION_PRESETS_SCHEMA_VERSION = 1;

function isPlainObject(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

function safeId(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  return s.length > 80 ? s.slice(0, 80) : s;
}

function defaultAnimationForPresetId(id) {
  const def = BUILTIN_ANIMATION_DEFINITIONS.find((p) => p.id === id);
  return {
    preset: normalizeAnimationPreset(id),
    duration: def?.defaultDuration ?? 0.6,
    delay: def?.defaultDelay ?? 0,
    easing: def?.defaultEasing ?? 'ease-out',
    trigger: def?.defaultTrigger ?? 'on-enter-viewport',
    repeat: 1,
    loop: false,
  };
}

export function seedBuiltinAnimationPresets() {
  return BUILTIN_ANIMATION_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.label,
    builtin: true,
    animation: defaultAnimationForPresetId(def.id),
  }));
}

export const DEFAULT_ANIMATION_PRESETS = {
  schemaVersion: ANIMATION_PRESETS_SCHEMA_VERSION,
  revision: 0,
  presets: seedBuiltinAnimationPresets(),
};

const BUILTIN_PRESET_IDS = new Set(BUILTIN_ANIMATION_DEFINITIONS.map((def) => def.id));

function normalizeAnimSignature(anim = {}, fallbackPresetId = '') {
  const preset = normalizeAnimationPreset(anim.preset || fallbackPresetId);
  const def = BUILTIN_ANIMATION_DEFINITIONS.find((p) => p.id === preset);
  const duration = Number(anim.duration);
  const delay = Number(anim.delay);
  const repeat = Number(anim.repeat);
  return JSON.stringify({
    preset,
    duration: Number.isFinite(duration)
      ? Math.round(duration * 1000) / 1000
      : def?.defaultDuration ?? 0.6,
    delay: Number.isFinite(delay) ? Math.round(delay * 1000) / 1000 : def?.defaultDelay ?? 0,
    easing: String(anim.easing || def?.defaultEasing || 'ease-out').trim(),
    trigger: String(anim.trigger || def?.defaultTrigger || 'on-enter-viewport').trim(),
    loop: anim.loop === true,
    repeat: anim.loop === true ? null : Number.isFinite(repeat) && repeat > 1 ? Math.floor(repeat) : 1,
  });
}

export function pruneRedundantAnimationPresets(presets = []) {
  const list = Array.isArray(presets) ? presets : [];
  const byId = new Map();
  for (const p of list) {
    if (!p?.id || byId.has(p.id)) continue;
    byId.set(p.id, p);
  }

  const kept = [];
  const seenIds = new Set();
  const seenSigs = new Set();

  for (const builtin of seedBuiltinAnimationPresets()) {
    const fromList = byId.get(builtin.id);
    const entry = fromList
      ? {
          ...builtin,
          ...fromList,
          id: builtin.id,
          builtin: true,
          name: String(fromList.name || builtin.name).trim().slice(0, 120),
          animation: { ...builtin.animation, ...(fromList.animation || {}) },
        }
      : builtin;
    seenIds.add(builtin.id);
    seenSigs.add(normalizeAnimSignature(entry.animation, entry.id));
    kept.push(entry);
  }

  for (const p of list) {
    const id = safeId(p?.id);
    if (!id || seenIds.has(id) || BUILTIN_PRESET_IDS.has(id)) continue;
    const sig = normalizeAnimSignature(p.animation, id);
    if (seenSigs.has(sig)) continue;
    seenIds.add(id);
    seenSigs.add(sig);
    kept.push({
      id,
      name: String(p.name || id).trim().slice(0, 120),
      builtin: false,
      animation: isPlainObject(p.animation) ? p.animation : defaultAnimationForPresetId(id),
    });
  }

  return kept;
}

export function customAnimationPresets(animationPresets) {
  return normalizeAnimationPresets(animationPresets).presets.filter((p) => !p.builtin);
}

export function normalizeAnimationPresets(input, options = {}) {
  const { defaultRevision = 0, defaultSchemaVersion = ANIMATION_PRESETS_SCHEMA_VERSION } = options;
  const src = isPlainObject(input) ? input : {};
  const schemaOk =
    typeof src.schemaVersion === 'number' && Number.isFinite(src.schemaVersion) && src.schemaVersion >= 1;
  const revOk = typeof src.revision === 'number' && Number.isFinite(src.revision) && src.revision >= 0;
  const list = Array.isArray(src.presets) ? src.presets : [];
  let presets = list
    .map((p) => {
      if (!isPlainObject(p)) return null;
      const id = safeId(p.id);
      if (!id) return null;
      const name = String(p.name || id).trim().slice(0, 120);
      const animSrc = isPlainObject(p.animation) ? p.animation : {};
      const preset = normalizeAnimationPreset(animSrc.preset || id);
      if (preset === 'none') return null;
      const animation = {
        preset,
        ...(animSrc.duration != null ? { duration: Number(animSrc.duration) } : {}),
        ...(animSrc.delay != null ? { delay: Number(animSrc.delay) } : {}),
        ...(animSrc.easing ? { easing: String(animSrc.easing) } : {}),
        ...(animSrc.trigger ? { trigger: String(animSrc.trigger) } : {}),
        ...(animSrc.loop === true ? { loop: true } : {}),
        ...(animSrc.repeat != null ? { repeat: Number(animSrc.repeat) } : {}),
      };
      return {
        id,
        name,
        builtin: Boolean(p.builtin),
        animation,
      };
    })
    .filter(Boolean);
  const beforePrune = presets.length;
  if (options.pruneRedundant !== false) {
    presets = pruneRedundantAnimationPresets(presets);
  }
  const prunedCount = beforePrune - presets.length;
  const baseRevision = revOk ? Math.floor(src.revision) : defaultRevision;
  const bumpRevision = prunedCount > 0 && options.bumpRevisionOnPrune === true;
  return {
    schemaVersion: schemaOk ? Math.floor(src.schemaVersion) : defaultSchemaVersion,
    revision: bumpRevision ? baseRevision + 1 : baseRevision,
    presets: presets.length ? presets : seedBuiltinAnimationPresets(),
  };
}

export function findAnimationPreset(animationPresets, presetId) {
  const normalized = normalizeAnimationPresets(animationPresets);
  const id = String(presetId || '').trim();
  if (!id) return null;
  return normalized.presets.find((p) => p.id === id) || null;
}

export function duplicateAnimationPreset(animationPresets, sourceId) {
  const normalized = normalizeAnimationPresets(animationPresets);
  const source = findAnimationPreset(normalized, sourceId);
  if (!source) return normalized;
  if (source.builtin) return normalized;
  const sourceSig = normalizeAnimSignature(source.animation, source.id);
  const base = `${source.id}-copy`;
  let id = base;
  let n = 2;
  while (normalized.presets.some((p) => p.id === id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  const copy = {
    id,
    name: `${source.name} (copy)`,
    builtin: false,
    animation: { ...source.animation },
  };
  if (
    normalized.presets.some(
      (p) => p.id !== source.id && normalizeAnimSignature(p.animation, p.id) === sourceSig
    )
  ) {
    return normalized;
  }
  return {
    ...normalized,
    presets: [...normalized.presets, copy],
  };
}

export function upsertAnimationPreset(animationPresets, preset) {
  const normalized = normalizeAnimationPresets(animationPresets);
  const id = safeId(preset?.id);
  if (!id) return normalized;
  const next = {
    id,
    name: String(preset.name || id).trim().slice(0, 120),
    builtin: Boolean(preset.builtin),
    animation: isPlainObject(preset.animation) ? preset.animation : defaultAnimationForPresetId(id),
  };
  const idx = normalized.presets.findIndex((p) => p.id === id);
  const presets = [...normalized.presets];
  if (idx >= 0) {
    if (presets[idx].builtin && !next.builtin) {
      next.builtin = false;
    }
    presets[idx] = { ...presets[idx], ...next };
  } else {
    presets.push(next);
  }
  return { ...normalized, presets };
}

export function deleteAnimationPreset(animationPresets, presetId) {
  const normalized = normalizeAnimationPresets(animationPresets);
  const id = String(presetId || '').trim();
  const target = normalized.presets.find((p) => p.id === id);
  if (!target || target.builtin) return normalized;
  return {
    ...normalized,
    presets: normalized.presets.filter((p) => p.id !== id),
  };
}
