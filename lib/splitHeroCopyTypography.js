/** Split hero carousel: hero copy typography (title/body) via props + CSS variables. */

export function isSplitHeroCarouselNode(node) {
  return (
    node?.nodeType === 'carousel' && String(node?.props?.variant || '').toLowerCase() === 'splithero'
  );
}

const STYLE_KEYS = new Set([
  'fontSizePx',
  'fontWeight',
  'lineHeight',
  'letterSpacingPx',
  'textColor',
  'fontFamily',
  'alignment',
  'splitHeroBodyFontSizePx',
  'splitHeroBodyColor',
  'splitHeroCtaBackgroundColor',
  'splitHeroCtaTextColor',
  'splitHeroCtaBorderColor',
  'splitHeroCtaFontSizePx',
  'splitHeroCtaBorderRadiusPx',
  'splitHeroCtaBorderWidthPx',
]);

export function isSplitHeroCopyStyleKey(key) {
  return STYLE_KEYS.has(key);
}

export function normalizeSplitHeroCopyTypo(raw) {
  const t = raw && typeof raw === 'object' ? raw : {};
  const clampPx = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : 0);
  return {
    titleFontSizePx: clampPx(Number(t.titleFontSizePx), 0, 120),
    titleColor: String(t.titleColor || '').trim(),
    titleFontWeight: String(t.titleFontWeight || '').trim(),
    titleLineHeight: String(t.titleLineHeight || '').trim(),
    titleLetterSpacingPx: clampPx(Number(t.titleLetterSpacingPx), -20, 40),
    titleFontFamily: String(t.titleFontFamily || '').trim(),
    titleTextAlign: String(t.titleTextAlign || '').trim(),
    bodyFontSizePx: clampPx(Number(t.bodyFontSizePx), 0, 48),
    bodyColor: String(t.bodyColor || '').trim(),
    bodyFontWeight: String(t.bodyFontWeight || '').trim(),
    bodyLineHeight: String(t.bodyLineHeight || '').trim(),
    ctaBackgroundColor: String(t.ctaBackgroundColor || '').trim(),
    ctaTextColor: String(t.ctaTextColor || '').trim(),
    ctaBorderColor: String(t.ctaBorderColor || '').trim(),
    ctaFontSizePx: clampPx(Number(t.ctaFontSizePx), 0, 32),
    ctaBorderRadiusPx: clampPx(Number(t.ctaBorderRadiusPx), 0, 48),
    ctaBorderWidthPx: clampPx(Number(t.ctaBorderWidthPx), 0, 8),
  };
}

export function splitHeroCopyTypoFromProps(props) {
  return normalizeSplitHeroCopyTypo(props?.splitHeroCopyTypo);
}

/** Inspector form fields for Style tab (title) + body extras. */
export function splitHeroTypoInspectorFormFields(props, pickPending) {
  const t = splitHeroCopyTypoFromProps(props);
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    fontSizePx: pick('fontSizePx', t.titleFontSizePx > 0 ? t.titleFontSizePx : 48),
    textColor: pick('textColor', t.titleColor || ''),
    fontWeight: pick('fontWeight', t.titleFontWeight || '850'),
    lineHeight: pick('lineHeight', t.titleLineHeight || '1.05'),
    letterSpacingPx: pick('letterSpacingPx', t.titleLetterSpacingPx || 0),
    fontFamily: pick('fontFamily', t.titleFontFamily || ''),
    alignment: pick('alignment', t.titleTextAlign || 'left'),
    splitHeroBodyFontSizePx: pick('splitHeroBodyFontSizePx', t.bodyFontSizePx > 0 ? t.bodyFontSizePx : 17),
    splitHeroBodyColor: pick('splitHeroBodyColor', t.bodyColor || ''),
    splitHeroCtaBackgroundColor: pick('splitHeroCtaBackgroundColor', t.ctaBackgroundColor || ''),
    splitHeroCtaTextColor: pick('splitHeroCtaTextColor', t.ctaTextColor || ''),
    splitHeroCtaBorderColor: pick('splitHeroCtaBorderColor', t.ctaBorderColor || ''),
    splitHeroCtaFontSizePx: pick('splitHeroCtaFontSizePx', t.ctaFontSizePx > 0 ? t.ctaFontSizePx : 14),
    splitHeroCtaBorderRadiusPx: pick('splitHeroCtaBorderRadiusPx', t.ctaBorderRadiusPx > 0 ? t.ctaBorderRadiusPx : 12),
    splitHeroCtaBorderWidthPx: pick('splitHeroCtaBorderWidthPx', t.ctaBorderWidthPx > 0 ? t.ctaBorderWidthPx : 0),
  };
}

export function patchSplitHeroCopyTypoFromStyleKey(key, value, prevProps) {
  const prev = splitHeroCopyTypoFromProps(prevProps);
  const next = { ...prev };

  if (key === 'fontSizePx') {
    next.titleFontSizePx = Math.max(12, Math.min(120, Math.round(Number(value) || 0)));
  } else if (key === 'textColor') {
    next.titleColor = String(value ?? '').trim();
  } else if (key === 'fontWeight') {
    next.titleFontWeight = String(value ?? '').trim();
  } else if (key === 'lineHeight') {
    next.titleLineHeight = String(value ?? '').trim();
  } else if (key === 'letterSpacingPx') {
    next.titleLetterSpacingPx = Math.max(-20, Math.min(40, Math.round(Number(value) || 0)));
  } else if (key === 'fontFamily') {
    next.titleFontFamily = String(value ?? '').trim();
  } else if (key === 'alignment') {
    next.titleTextAlign = String(value ?? '').trim();
  } else if (key === 'splitHeroBodyFontSizePx') {
    next.bodyFontSizePx = Math.max(12, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'splitHeroBodyColor') {
    next.bodyColor = String(value ?? '').trim();
  } else if (key === 'splitHeroCtaBackgroundColor') {
    next.ctaBackgroundColor = String(value ?? '').trim();
  } else if (key === 'splitHeroCtaTextColor') {
    next.ctaTextColor = String(value ?? '').trim();
  } else if (key === 'splitHeroCtaBorderColor') {
    next.ctaBorderColor = String(value ?? '').trim();
  } else if (key === 'splitHeroCtaFontSizePx') {
    next.ctaFontSizePx = Math.max(10, Math.min(32, Math.round(Number(value) || 0)));
  } else if (key === 'splitHeroCtaBorderRadiusPx') {
    next.ctaBorderRadiusPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'splitHeroCtaBorderWidthPx') {
    next.ctaBorderWidthPx = Math.max(0, Math.min(8, Math.round(Number(value) || 0)));
  } else {
    return null;
  }

  return { splitHeroCopyTypo: normalizeSplitHeroCopyTypo(next) };
}

export function splitHeroCopyTypoToCssVars(typo) {
  const t = normalizeSplitHeroCopyTypo(typo);
  const vars = {};
  if (t.titleFontSizePx > 0) vars['--split-hero-title-font-size'] = `${t.titleFontSizePx}px`;
  if (t.titleColor) vars['--split-hero-title-color'] = t.titleColor;
  if (t.titleFontWeight) vars['--split-hero-title-font-weight'] = t.titleFontWeight;
  if (t.titleLineHeight) vars['--split-hero-title-line-height'] = t.titleLineHeight;
  if (t.titleLetterSpacingPx) vars['--split-hero-title-letter-spacing'] = `${t.titleLetterSpacingPx}px`;
  if (t.titleFontFamily) vars['--split-hero-title-font-family'] = t.titleFontFamily;
  if (t.titleTextAlign) vars['--split-hero-title-text-align'] = t.titleTextAlign;
  if (t.bodyFontSizePx > 0) vars['--split-hero-body-font-size'] = `${t.bodyFontSizePx}px`;
  if (t.bodyColor) vars['--split-hero-body-color'] = t.bodyColor;
  if (t.bodyFontWeight) vars['--split-hero-body-font-weight'] = t.bodyFontWeight;
  if (t.bodyLineHeight) vars['--split-hero-body-line-height'] = t.bodyLineHeight;
  if (t.ctaBackgroundColor) vars['--split-hero-cta-bg'] = t.ctaBackgroundColor;
  if (t.ctaTextColor) vars['--split-hero-cta-color'] = t.ctaTextColor;
  if (t.ctaBorderColor) vars['--split-hero-cta-border-color'] = t.ctaBorderColor;
  if (t.ctaFontSizePx > 0) vars['--split-hero-cta-font-size'] = `${t.ctaFontSizePx}px`;
  if (t.ctaBorderRadiusPx > 0) vars['--split-hero-cta-radius'] = `${t.ctaBorderRadiusPx}px`;
  if (t.ctaBorderWidthPx > 0) vars['--split-hero-cta-border-width'] = `${t.ctaBorderWidthPx}px`;
  return vars;
}

/** Preset: white button + blue outline (like reference mockup). */
export function splitHeroCtaOutlinePreset() {
  return normalizeSplitHeroCopyTypo({
    ctaBackgroundColor: '#ffffff',
    ctaTextColor: '#0f172a',
    ctaBorderColor: '#2563eb',
    ctaBorderWidthPx: 1,
    ctaBorderRadiusPx: 12,
    ctaFontSizePx: 14,
  });
}
