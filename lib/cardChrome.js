/** Card-style advanced elements — props.chrome on pricing/content/testimonial cards. */

export const CARD_CHROME_NODE_TYPES = new Set(['pricing_card', 'content_card', 'testimonial_card']);

export function normalizeCardChrome(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const clampPx = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : 0);
  return {
    backgroundColor: String(c.backgroundColor || '').trim(),
    paddingPx: clampPx(Number(c.paddingPx), 0, 64),
    borderColor: String(c.borderColor || '').trim(),
    borderWidthPx: clampPx(Number(c.borderWidthPx), 0, 8),
    borderRadiusPx: clampPx(Number(c.borderRadiusPx), 0, 48),
    shadow: String(c.shadow || '').trim(),
  };
}

export function cardChromeFromProps(props) {
  return normalizeCardChrome(props?.chrome);
}

export function cardChromeToCssVars(chrome) {
  const c = normalizeCardChrome(chrome);
  const vars = {};
  if (c.backgroundColor) vars['--card-bg'] = c.backgroundColor;
  if (c.paddingPx > 0) vars['--card-padding'] = `${c.paddingPx}px`;
  if (c.borderColor && c.borderWidthPx > 0) {
    vars['--card-border-color'] = c.borderColor;
    vars['--card-border-width'] = `${c.borderWidthPx}px`;
  }
  if (c.borderRadiusPx > 0) vars['--card-radius'] = `${c.borderRadiusPx}px`;
  if (c.shadow) vars['--card-shadow'] = c.shadow;
  return vars;
}

export function cardChromeInspectorFields(props, pickPending) {
  const c = cardChromeFromProps(props);
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    cardChromeBg: pick('cardChromeBg', c.backgroundColor),
    cardChromePaddingPx: pick('cardChromePaddingPx', c.paddingPx > 0 ? c.paddingPx : 0),
    cardChromeBorderColor: pick('cardChromeBorderColor', c.borderColor),
    cardChromeBorderWidthPx: pick('cardChromeBorderWidthPx', c.borderWidthPx > 0 ? c.borderWidthPx : 0),
    cardChromeRadiusPx: pick('cardChromeRadiusPx', c.borderRadiusPx > 0 ? c.borderRadiusPx : 0),
    cardChromeShadow: pick('cardChromeShadow', c.shadow),
  };
}

const CHROME_KEYS = new Set([
  'cardChromeBg',
  'cardChromePaddingPx',
  'cardChromeBorderColor',
  'cardChromeBorderWidthPx',
  'cardChromeRadiusPx',
  'cardChromeShadow',
  'cardChromeReset',
]);

export function isCardChromeKey(key) {
  return CHROME_KEYS.has(key);
}

export function patchCardChromeFromKey(key, value, prevChrome) {
  const prev = normalizeCardChrome(prevChrome);
  const next = { ...prev };
  if (key === 'cardChromeBg') next.backgroundColor = String(value ?? '').trim();
  else if (key === 'cardChromePaddingPx') {
    next.paddingPx = Math.max(0, Math.min(64, Math.round(Number(value) || 0)));
  } else if (key === 'cardChromeBorderColor') next.borderColor = String(value ?? '').trim();
  else if (key === 'cardChromeBorderWidthPx') {
    next.borderWidthPx = Math.max(0, Math.min(8, Math.round(Number(value) || 0)));
  } else if (key === 'cardChromeRadiusPx') {
    next.borderRadiusPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'cardChromeShadow') next.shadow = String(value ?? '').trim();
  else return null;
  return normalizeCardChrome(next);
}
