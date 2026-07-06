import { parseCssColorToRgb } from './sanitizeRichHtml.js';

export function rgbToHex6(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Pull fallback from `var(--token, #fff)` so native color inputs can display it. */
export function extractCssVarFallback(color) {
  const s = String(color || '').trim();
  const m = /var\([^,]+,\s*([^)]+)\)/i.exec(s);
  if (m) return m[1].trim();
  return s;
}

/** `#rrggbb` for `<input type="color">` — supports hex, rgb(), hsl(), and var() fallbacks. */
export function hex6ForColorInput(color, fallback = '#ffffff') {
  const candidates = [extractCssVarFallback(color), String(color || '').trim()];
  for (const raw of candidates) {
    if (!raw) continue;
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      const h = raw.slice(1);
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    }
    const rgb = parseCssColorToRgb(raw);
    if (rgb) return rgbToHex6(rgb[0], rgb[1], rgb[2]);
  }
  return hex6ForColorInput(fallback, '#ffffff');
}

/** True when the stored value should paint as fully transparent in CSS. */
export function isTransparentBackground(color) {
  if (color == null || color === '') return false;
  const s = String(color).trim().toLowerCase().replace(/\s/g, '');
  if (s === 'transparent') return true;
  if (s === 'rgba(0,0,0,0)' || s === 'hsla(0,0%,0%,0)') return true;
  const m = /^#([0-9a-f]{8})$/i.exec(s);
  if (m && m[1].slice(6, 8).toLowerCase() === '00') return true;
  return false;
}

export function isCssGradientImage(value) {
  const s = String(value || '').trim().toLowerCase();
  return (
    s.startsWith('linear-gradient') ||
    s.startsWith('radial-gradient') ||
    s.startsWith('conic-gradient') ||
    s.startsWith('repeating-linear-gradient') ||
    s.startsWith('repeating-radial-gradient')
  );
}

/** Background image field should only hold uploadable URLs — not CSS gradients. */
export function backgroundImageUrlForInspector(backgroundImage) {
  const s = String(backgroundImage || '').trim();
  if (!s || isCssGradientImage(s)) return '';
  return s;
}
