/** FAQ accordion chrome — props.chrome + CSS variables on .live-faq-accordion */

export function normalizeFaqAccordionChrome(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const clampPx = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : 0);
  return {
    headerBackgroundColor: String(c.headerBackgroundColor || '').trim(),
    activeAccentColor: String(c.activeAccentColor || '').trim(),
    borderColor: String(c.borderColor || '').trim(),
    borderWidthPx: clampPx(Number(c.borderWidthPx), 0, 8),
    borderRadiusPx: clampPx(Number(c.borderRadiusPx), 0, 48),
  };
}

export function faqAccordionChromeFromProps(props) {
  return normalizeFaqAccordionChrome(props?.chrome);
}

export function faqAccordionChromeToCssVars(chrome) {
  const c = normalizeFaqAccordionChrome(chrome);
  const vars = {};
  if (c.headerBackgroundColor) vars['--faq-item-bg'] = c.headerBackgroundColor;
  if (c.activeAccentColor) vars['--faq-active-accent'] = c.activeAccentColor;
  if (c.borderColor && c.borderWidthPx > 0) {
    vars['--faq-item-border-color'] = c.borderColor;
    vars['--faq-item-border-width'] = `${c.borderWidthPx}px`;
  }
  if (c.borderRadiusPx > 0) vars['--faq-item-radius'] = `${c.borderRadiusPx}px`;
  return vars;
}

export function faqAccordionChromeInspectorFields(props, pickPending) {
  const c = faqAccordionChromeFromProps(props);
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    faqAccordionHeaderBg: pick('faqAccordionHeaderBg', c.headerBackgroundColor),
    faqAccordionActiveColor: pick('faqAccordionActiveColor', c.activeAccentColor),
    faqAccordionBorderColor: pick('faqAccordionBorderColor', c.borderColor),
    faqAccordionBorderWidthPx: pick('faqAccordionBorderWidthPx', c.borderWidthPx > 0 ? c.borderWidthPx : 0),
    faqAccordionRadiusPx: pick('faqAccordionRadiusPx', c.borderRadiusPx > 0 ? c.borderRadiusPx : 0),
  };
}

const CHROME_KEYS = new Set([
  'faqAccordionHeaderBg',
  'faqAccordionActiveColor',
  'faqAccordionBorderColor',
  'faqAccordionBorderWidthPx',
  'faqAccordionRadiusPx',
  'faqAccordionChromeReset',
]);

export function isFaqAccordionChromeKey(key) {
  return CHROME_KEYS.has(key);
}

export function patchFaqAccordionChromeFromKey(key, value, prevChrome) {
  const prev = normalizeFaqAccordionChrome(prevChrome);
  const next = { ...prev };
  if (key === 'faqAccordionHeaderBg') next.headerBackgroundColor = String(value ?? '').trim();
  else if (key === 'faqAccordionActiveColor') next.activeAccentColor = String(value ?? '').trim();
  else if (key === 'faqAccordionBorderColor') next.borderColor = String(value ?? '').trim();
  else if (key === 'faqAccordionBorderWidthPx') {
    next.borderWidthPx = Math.max(0, Math.min(8, Math.round(Number(value) || 0)));
  } else if (key === 'faqAccordionRadiusPx') {
    next.borderRadiusPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else return null;
  return normalizeFaqAccordionChrome(next);
}
