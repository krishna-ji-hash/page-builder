/**
 * Project-level reusable style presets stored on `projects.config_json.stylePresets`.
 *
 * Presets are responsive style_json fragments (desktop/tablet/mobile) and are merged under local node styles:
 * local overrides → preset → siteTheme defaults (already handled elsewhere)
 *
 * Notes:
 * - Presets should prefer theme tokens via `token-*` references.
 * - We keep a small set of built-in seed presets for quick start.
 */

import { BUTTON_STYLE_PRESETS, CARD_STYLE_PRESETS, SECTION_STYLE_PRESETS, TEXT_STYLE_PRESETS } from './stylePresets.js';

export const STYLE_PRESETS_SCHEMA_VERSION = 1;

const DEFAULT_SEED = () => {
  const seed = [];
  const pushGroup = (category, nodeType, variants) => {
    Object.keys(variants || {}).forEach((variant) => {
      seed.push({
        id: `${category}.${variant}`,
        category,
        nodeType,
        variant,
        name: `${category} / ${variant}`,
        style_json: { desktop: variants[variant] },
      });
    });
  };
  pushGroup('button', 'button', BUTTON_STYLE_PRESETS);
  pushGroup('card', 'content_card', CARD_STYLE_PRESETS);
  pushGroup('section', 'row', SECTION_STYLE_PRESETS);
  pushGroup('text', 'text', TEXT_STYLE_PRESETS);
  return seed;
};

export const DEFAULT_STYLE_PRESETS = {
  schemaVersion: STYLE_PRESETS_SCHEMA_VERSION,
  revision: 0,
  presets: DEFAULT_SEED(),
};

function isPlainObject(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

function safeId(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  return s.length > 80 ? s.slice(0, 80) : s;
}

export function normalizeStylePresets(input, options = {}) {
  const { defaultRevision = 0, defaultSchemaVersion = STYLE_PRESETS_SCHEMA_VERSION } = options;
  const src = isPlainObject(input) ? input : {};
  const schemaOk =
    typeof src.schemaVersion === 'number' && Number.isFinite(src.schemaVersion) && src.schemaVersion >= 1;
  const revOk = typeof src.revision === 'number' && Number.isFinite(src.revision) && src.revision >= 0;
  const list = Array.isArray(src.presets) ? src.presets : [];
  const presets = list
    .map((p) => {
      if (!isPlainObject(p)) return null;
      const id = safeId(p.id);
      const nodeType = safeId(p.nodeType);
      if (!id || !nodeType) return null;
      const category = safeId(p.category || '');
      const variant = safeId(p.variant || '');
      const name = String(p.name || id).trim().slice(0, 120);
      const style_json = isPlainObject(p.style_json) ? p.style_json : {};
      return { id, category, nodeType, variant, name, style_json };
    })
    .filter(Boolean);
  return {
    schemaVersion: schemaOk ? Math.floor(src.schemaVersion) : defaultSchemaVersion,
    revision: revOk ? Math.floor(src.revision) : defaultRevision,
    presets,
  };
}

export function findPreset(stylePresets, { presetId, nodeType, variant } = {}) {
  const sp = normalizeStylePresets(stylePresets);
  const pid = String(presetId || '').trim();
  const nt = String(nodeType || '').trim();
  const v = String(variant || '').trim();
  if (pid) return sp.presets.find((p) => p.id === pid) || null;
  if (nt && v) return sp.presets.find((p) => p.nodeType === nt && p.variant === v) || null;
  return null;
}

