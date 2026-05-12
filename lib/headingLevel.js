const HEADING_LEVEL_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * @param {unknown} tag
 * @param {string} [fallback='h1']
 * @returns {'h1'|'h2'|'h3'|'h4'|'h5'|'h6'}
 */
export function normalizeHeadingLevel(tag, fallback = 'h1') {
  const fb = HEADING_LEVEL_TAGS.has(String(fallback || 'h1').toLowerCase())
    ? String(fallback || 'h1').toLowerCase()
    : 'h1';
  const t = String(tag || fb).toLowerCase();
  return HEADING_LEVEL_TAGS.has(t) ? t : fb;
}

/** Default visual scale per level when style_json has no `typography.fontSize`. */
export function semanticHeadingTypography(tag) {
  const t = normalizeHeadingLevel(tag);
  const map = {
    h1: { fontSize: 'clamp(2rem, 4.2vw, 2.75rem)', lineHeight: '1.1' },
    h2: { fontSize: 'clamp(1.65rem, 3.2vw, 2.25rem)', lineHeight: '1.12' },
    h3: { fontSize: 'clamp(1.4rem, 2.4vw, 1.75rem)', lineHeight: '1.15' },
    h4: { fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', lineHeight: '1.2' },
    h5: { fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)', lineHeight: '1.25' },
    h6: { fontSize: 'clamp(0.95rem, 1.3vw, 1.05rem)', lineHeight: '1.3' },
  };
  return map[t] || map.h2;
}
