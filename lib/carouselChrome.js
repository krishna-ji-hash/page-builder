/** Carousel chrome — props.chrome for nav/slide shell (gap/imageFit stay on props root). */

export function normalizeCarouselChrome(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const clampPx = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : 0);
  return {
    cardRadiusPx: clampPx(Number(c.cardRadiusPx), 0, 48),
    arrowColor: String(c.arrowColor || '').trim(),
    dotColor: String(c.dotColor || '').trim(),
    dotActiveColor: String(c.dotActiveColor || '').trim(),
  };
}

export function carouselChromeFromProps(props) {
  return normalizeCarouselChrome(props?.chrome);
}

export function carouselChromeToCssVars(chrome) {
  const c = normalizeCarouselChrome(chrome);
  const vars = {};
  if (c.cardRadiusPx > 0) vars['--carousel-card-radius'] = `${c.cardRadiusPx}px`;
  if (c.arrowColor) vars['--carousel-arrow-color'] = c.arrowColor;
  if (c.dotColor) vars['--carousel-dot-color'] = c.dotColor;
  if (c.dotActiveColor) vars['--carousel-dot-active-color'] = c.dotActiveColor;
  return vars;
}

export function carouselChromeInspectorFields(props, pickPending) {
  const c = carouselChromeFromProps(props);
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    carouselCardRadiusPx: pick('carouselCardRadiusPx', c.cardRadiusPx > 0 ? c.cardRadiusPx : 0),
    carouselArrowColor: pick('carouselArrowColor', c.arrowColor),
    carouselDotColor: pick('carouselDotColor', c.dotColor),
    carouselDotActiveColor: pick('carouselDotActiveColor', c.dotActiveColor),
  };
}

const CHROME_KEYS = new Set([
  'carouselCardRadiusPx',
  'carouselArrowColor',
  'carouselDotColor',
  'carouselDotActiveColor',
  'carouselChromeReset',
]);

export function isCarouselChromeKey(key) {
  return CHROME_KEYS.has(key);
}

export function patchCarouselChromeFromKey(key, value, prevChrome) {
  const prev = normalizeCarouselChrome(prevChrome);
  const next = { ...prev };
  if (key === 'carouselCardRadiusPx') {
    next.cardRadiusPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'carouselArrowColor') next.arrowColor = String(value ?? '').trim();
  else if (key === 'carouselDotColor') next.dotColor = String(value ?? '').trim();
  else if (key === 'carouselDotActiveColor') next.dotActiveColor = String(value ?? '').trim();
  else return null;
  return normalizeCarouselChrome(next);
}
