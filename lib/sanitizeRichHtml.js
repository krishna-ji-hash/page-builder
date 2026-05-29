import DOMPurify from 'isomorphic-dompurify';

let hooksAdded = false;
/** Set per `sanitizeRichHtml` call — hooks read this (DOMPurify hooks are global). */
let neutralizeHardcodedBodyTextColorsActive = false;
let remapLightNeutralTextColorsActive = false;

function linSrgb(u) {
  return u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
}

function relLuminance255(r, g, b) {
  const R = linSrgb(r / 255);
  const G = linSrgb(g / 255);
  const B = linSrgb(b / 255);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** CSS named colors often pasted from Word / email (lowercase keys). */
const NAMED_RGB = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  navy: [0, 0, 128],
  midnightblue: [25, 25, 112],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  darkgray: [169, 169, 169],
  darkgrey: [169, 169, 169],
};

/**
 * Best-effort parse of a single CSS `<color>` token to sRGB 0–255.
 * @returns {[number, number, number]|null}
 */
export function parseCssColorToRgb(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s || s === 'inherit' || s === 'currentcolor' || s.startsWith('var(')) return null;

  const named = NAMED_RGB[s.replace(/\s/g, '')];
  if (named) return named;

  const hexM = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s.replace(/\s/g, ''));
  if (hexM) {
    let h = hexM[1];
    if (h.length === 3) h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].every((x) => Number.isFinite(x))) return [r, g, b];
    return null;
  }

  const rgbM = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i.exec(s);
  if (rgbM) {
    const r = Number(rgbM[1]);
    const g = Number(rgbM[2]);
    const b = Number(rgbM[3]);
    if ([r, g, b].every((x) => Number.isFinite(x) && x >= 0 && x <= 255)) return [r, g, b];
    return null;
  }

  const hslM = /^hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%/i.exec(s);
  if (hslM) {
    const h = ((Number(hslM[1]) % 360) + 360) % 360;
    const S = Math.min(1, Math.max(0, Number(hslM[2]) / 100));
    const L = Math.min(1, Math.max(0, Number(hslM[3]) / 100));
    const c = (1 - Math.abs(2 * L - 1)) * S;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = L - c / 2;
    let rp = 0;
    let gp = 0;
    let bp = 0;
    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];
    const r = Math.round((rp + m) * 255);
    const g = Math.round((gp + m) * 255);
    const b = Math.round((bp + m) * 255);
    return [r, g, b];
  }

  return null;
}

/**
 * Pasted “body” colors from light layouts on dark surfaces stay dark — invisible.
 * Strip only neutral-ish dark colors; keep vivid brand hues.
 */
export function shouldStripNeutralDarkCssColor(raw) {
  const rgb = parseCssColorToRgb(raw);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const L = relLuminance255(r, g, b);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const maxc = Math.max(rn, gn, bn);
  const minc = Math.min(rn, gn, bn);
  const chroma = maxc - minc;
  if (L < 0.32) return true;
  return L < 0.52 && chroma < 0.22;
}

/** Pasted light neutrals (#fff, #f8fafc) on dark surfaces stay invisible until remapped. */
export function shouldStripNeutralLightCssColor(raw) {
  const rgb = parseCssColorToRgb(raw);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const L = relLuminance255(r, g, b);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const maxc = Math.max(rn, gn, bn);
  const minc = Math.min(rn, gn, bn);
  const chroma = maxc - minc;
  if (L > 0.9 && chroma < 0.12) return true;
  return L > 0.82 && chroma < 0.08;
}

export function stripNeutralBodyColorsFromStyleAttr(styleAttr, options = {}) {
  if (!styleAttr || typeof styleAttr !== 'string') return styleAttr;
  const remapDark = Boolean(options.neutralizeHardcodedBodyTextColors);
  const remapLight = options.remapLightNeutralTextColors !== false;
  const parts = styleAttr
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  const kept = [];
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx === -1) {
      kept.push(part);
      continue;
    }
    const prop = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (prop === 'color' || prop === '-webkit-text-fill-color') {
      if (remapDark && shouldStripNeutralDarkCssColor(val)) continue;
      if (remapLight && shouldStripNeutralLightCssColor(val)) continue;
    }
    kept.push(part);
  }
  return kept.join('; ').trim();
}

/**
 * `style_json` often carries pasted neutral dark `color` / `--node-text` (same hues we strip from inline HTML).
 * Map those to the site theme token so dark presets do not render body copy as near-black on navy sections.
 * @param {Record<string, unknown>|null|undefined} css — output of `styleToCss`
 */
/**
 * Remap pasted light-mode neutrals to contextual section foreground (per row/column/stack).
 * @param {Record<string, unknown>|null|undefined} css
 * @param {{ darkContentMode?: boolean }} [options]
 */
export function neutralizeLeafTextCssObject(css, options = {}) {
  if (!css || typeof css !== 'object') return css;
  const sectionTone = options.sectionTone;
  const remapDark = Boolean(options.darkContentMode) && sectionTone !== 'light';
  const remapLight =
    options.remapLightNeutralTextColors !== false && sectionTone !== 'dark';
  if (!remapDark && !remapLight) return css;
  let changed = false;
  const next = { ...css };
  const textToken = 'var(--live-section-fg, var(--color-text))';
  const remapColor = (key) => {
    const val = next[key];
    if (val == null || val === '') return;
    const c = String(val);
    if (
      (remapDark && shouldStripNeutralDarkCssColor(c)) ||
      (remapLight && shouldStripNeutralLightCssColor(c))
    ) {
      next[key] = textToken;
      changed = true;
    }
  };
  remapColor('color');
  remapColor('--node-text');
  return changed ? next : css;
}

function ensureHtmlHooks() {
  if (hooksAdded) return;
  hooksAdded = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A' || !node.hasAttribute('href')) return;
    const href = node.getAttribute('href') || '';
    const lower = href.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
      node.setAttribute('href', '#');
      return;
    }
    if (/^https?:\/\//i.test(href) || lower.startsWith('//')) {
      node.setAttribute('rel', 'noopener noreferrer');
      if (!node.getAttribute('target')) node.setAttribute('target', '_blank');
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!neutralizeHardcodedBodyTextColorsActive && !remapLightNeutralTextColorsActive) return;
    if (!node?.hasAttribute?.('style')) return;
    const old = node.getAttribute('style') || '';
    const next = stripNeutralBodyColorsFromStyleAttr(old, {
      neutralizeHardcodedBodyTextColors: neutralizeHardcodedBodyTextColorsActive,
      remapLightNeutralTextColors: remapLightNeutralTextColorsActive,
    });
    if (next) node.setAttribute('style', next);
    else node.removeAttribute('style');
  });
}

/**
 * Strip scripts/event handlers; keep headings, paragraphs, lists, inline styles, links.
 * Used on save (API) and before rendering (live / builder).
 *
 * @param {string} html
 * @param {{ emptyReturn?: string, neutralizeHardcodedBodyTextColors?: boolean }} [options]
 *        — `neutralizeHardcodedBodyTextColors`: remove pasted neutral dark `color` / `-webkit-text-fill-color` in `style` so theme text shows.
 */
export function sanitizeRichHtml(html, options = {}) {
  ensureHtmlHooks();

  const emptyReturn = typeof options.emptyReturn === 'string' ? options.emptyReturn : '<p></p>';

  if (typeof html !== 'string' || !html.trim()) {
    return emptyReturn;
  }

  neutralizeHardcodedBodyTextColorsActive = Boolean(options.neutralizeHardcodedBodyTextColors);
  remapLightNeutralTextColorsActive = options.remapLightNeutralTextColors !== false;
  let clean;
  try {
    clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'div',
        'span',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'h1',
        'h2',
        'h3',
        'a',
        'ul',
        'ol',
        'li',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'title'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
    });
  } finally {
    neutralizeHardcodedBodyTextColorsActive = false;
    remapLightNeutralTextColorsActive = false;
  }

  return clean.trim() ? clean : '<p></p>';
}
