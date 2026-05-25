function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isPlaceholderOverlayTitle(title) {
  const t = String(title || '').trim().toLowerCase();
  return !t || t === 'slide title' || t === 'slide 1' || /^slide \d+$/.test(t);
}

function overlayCardHeadline(slide) {
  const cardTitle = String(slide?.card?.title || '').trim();
  if (cardTitle) return cardTitle;
  const t = String(slide?.title || '').trim();
  if (isPlaceholderOverlayTitle(t)) return '';
  return t;
}

export function normalizeTickerSlide(slide, index) {
  const s = slide && typeof slide === 'object' ? slide : {};
  const br = Math.round(Number(s.imageBorderRadiusPx));
  const iw = Math.round(Number(s.imageWidthPx));
  const ih = Math.round(Number(s.imageHeightPx));
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `slide-${index}`,
    title: typeof s.title === 'string' ? s.title : '',
    imageSrc:
      typeof s.imageSrc === 'string'
        ? s.imageSrc
        : typeof s.image === 'string'
          ? s.image
          : typeof s.imageUrl === 'string'
            ? s.imageUrl
            : '',
    imageAlt: typeof s.imageAlt === 'string' ? s.imageAlt : '',
    imageBorderRadiusPx: Number.isFinite(br) ? clamp(br, 0, 200) : 0,
    imageWidthPx: Number.isFinite(iw) ? clamp(iw, 0, 2400) : 0,
    imageHeightPx: Number.isFinite(ih) ? clamp(ih, 0, 2400) : 0,
    card: s.card && typeof s.card === 'object' ? s.card : {},
  };
}

export function tickerFallbackLabel(slide) {
  const h = overlayCardHeadline(slide);
  if (h) return h;
  const t = String(slide?.title || '').trim();
  if (isPlaceholderOverlayTitle(t)) return '';
  return t;
}

export function tickerSlideImgStyle(slide) {
  const radius = Math.max(0, Math.min(48, Math.round(Number(slide?.imageBorderRadiusPx) || 0)));
  const w = Math.max(0, Math.min(400, Math.round(Number(slide?.imageWidthPx) || 0)));
  const h = Math.max(0, Math.min(200, Math.round(Number(slide?.imageHeightPx) || 0)));
  const sty = {};
  if (radius) sty.borderRadius = `${radius}px`;
  if (w) sty.maxWidth = `${Math.min(w, 152)}px`;
  if (h) sty.maxHeight = `${Math.min(h, 72)}px`;
  return sty;
}

export function buildTickerDupSlides(slides) {
  const safe = (Array.isArray(slides) ? slides : [])
    .filter((s) => s && typeof s === 'object')
    .map(normalizeTickerSlide);
  if (!safe.length) return [];
  const copies = 2;
  const out = [];
  for (let c = 0; c < copies; c += 1) {
    safe.forEach((s) => {
      out.push({ slide: s, key: `${s.id}--t${c}` });
    });
  }
  return out;
}

export function resolveTickerScrollClasses(variantKey, scrollDirectionRaw) {
  const isMarqueeVariant = variantKey === 'marquee';
  const isTickerVariant = variantKey === 'ticker';
  const scrollDirRaw = String(scrollDirectionRaw || '').toLowerCase().trim();
  const scrollDirection =
    scrollDirRaw === 'right' || scrollDirRaw === 'left' || scrollDirRaw === 'opposite'
      ? scrollDirRaw
      : isTickerVariant
        ? 'opposite'
        : isMarqueeVariant
          ? 'right'
          : 'left';
  const effectiveScrollDir = isMarqueeVariant && scrollDirection === 'opposite' ? 'left' : scrollDirection;
  const row1TrackClass =
    effectiveScrollDir === 'right' ? 'live-carousel__ticker-track--rtl' : 'live-carousel__ticker-track--ltr';
  const row2TrackClass =
    effectiveScrollDir === 'opposite'
      ? 'live-carousel__ticker-track--rtl'
      : effectiveScrollDir === 'right'
        ? 'live-carousel__ticker-track--rtl'
        : 'live-carousel__ticker-track--ltr';
  return { isMarqueeVariant, row1TrackClass, row2TrackClass };
}

export function resolveTickerDurationSec(raw) {
  const n = Number(raw ?? 32);
  return Math.max(8, Math.min(120, Number.isFinite(n) ? n : 32));
}

export function resolveTickerGapPx(raw) {
  const n = Number(raw ?? 12);
  return Number.isFinite(n) && n >= 0 ? n : 12;
}
