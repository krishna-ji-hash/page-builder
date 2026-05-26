/**
 * Parse CSS margin/padding shorthand (supports clamp(), calc(), 1–4 components).
 */

function parsePxNumber(value, fallback = 0) {
  const num = parseFloat(String(value ?? '').replace(/px$/i, '').trim());
  return Number.isFinite(num) ? num : fallback;
}

/** Split on whitespace but keep parentheses groups (e.g. clamp(20px, 4vw, 40px)). */
export function tokenizeCssSpaceSeparated(str) {
  const tokens = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') {
      depth += 1;
      cur += ch;
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1);
      cur += ch;
    } else if (/\s/.test(ch) && depth === 0) {
      if (cur.trim()) tokens.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) tokens.push(cur.trim());
  return tokens;
}

function expandShorthandTokens(tokens) {
  if (!tokens.length) return { top: '0', right: '0', bottom: '0', left: '0' };
  if (tokens.length === 1) {
    const a = tokens[0];
    return { top: a, right: a, bottom: a, left: a };
  }
  if (tokens.length === 2) {
    return { top: tokens[0], right: tokens[1], bottom: tokens[0], left: tokens[1] };
  }
  if (tokens.length === 3) {
    return { top: tokens[0], right: tokens[1], bottom: tokens[2], left: tokens[1] };
  }
  return { top: tokens[0], right: tokens[1], bottom: tokens[2], left: tokens[3] };
}

/** @returns {{ top: number, right: number, bottom: number, left: number, tokens: { top: string, right: string, bottom: string, left: string } }} */
export function parseBoxShorthand(value) {
  const empty = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    tokens: { top: '0', right: '0', bottom: '0', left: '0' },
  };
  if (value == null || String(value).trim() === '') return empty;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const top = String(value.top ?? '0');
    const right = String(value.right ?? top);
    const bottom = String(value.bottom ?? top);
    const left = String(value.left ?? right);
    return {
      top: parsePxNumber(top, 0),
      right: parsePxNumber(right, 0),
      bottom: parsePxNumber(bottom, 0),
      left: parsePxNumber(left, 0),
      tokens: { top, right, bottom, left },
    };
  }
  const raw = String(value).trim();
  const parts = tokenizeCssSpaceSeparated(raw);
  const sides = expandShorthandTokens(parts);
  return {
    top: parsePxNumber(sides.top, 0),
    right: parsePxNumber(sides.right, 0),
    bottom: parsePxNumber(sides.bottom, 0),
    left: parsePxNumber(sides.left, 0),
    tokens: sides,
  };
}

/** Inspector / spacing UI display: numbers for simple px, raw token for clamp/calc/% . */
export function boxSideDisplayValue(parsed, side) {
  const token = parsed.tokens?.[side] ?? '';
  if (/clamp|calc|var|\(|%|em|rem/i.test(token)) return token;
  const n = parsed[side];
  if (n === 0 && !token) return '';
  return String(n);
}

/** Build shorthand from per-side box fields (numbers or raw tokens). */
export function formatBoxFromSides(box, clampFn = (n) => n) {
  const tok = (side) => {
    const raw = box[side];
    if (raw === '' || raw == null) return `${clampFn(0)}px`;
    const s = String(raw).trim();
    if (/clamp|calc|var|\(|%|em|rem/i.test(s)) {
      return /px|%|em|rem|\)|vw|vh/i.test(s) ? s : `${s}px`;
    }
    const n = parsePxNumber(s, NaN);
    return `${clampFn(Number.isFinite(n) ? n : 0)}px`;
  };
  const t = tok('top');
  const r = tok('right');
  const b = tok('bottom');
  const l = tok('left');
  if (t === b && r === l) {
    if (t === r) return t;
    return `${t} ${r}`;
  }
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}
