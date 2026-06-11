'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { liveCarouselSlideImageAttrs } from '@/lib/liveCarouselImageAttrs';
import { buildTickerDupSlides, resolveTickerScrollClasses } from '@/lib/carouselTickerShared';
import { resolveDualTickerSlides } from '@/lib/carouselTickerRows';
import { logoHoverZoomPresentation } from '@/lib/carouselLogoHoverZoom';
import { splitHeroCopyTypoFromProps, splitHeroCopyTypoToCssVars } from '@/lib/splitHeroCopyTypography';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeSettings(settings, device) {
  const s = settings && typeof settings === 'object' ? settings : {};
  const perViewRaw = s.perView && typeof s.perView === 'object' ? s.perView : {};
  const perViewVal = Number(perViewRaw?.[device] ?? perViewRaw?.desktop ?? 1);
  const gapPx = Number(s.gapPx ?? 12);
  const speedMs = Number(s.speedMs ?? 420);
  const autoplayMs = Number(s.autoplayMs ?? 0);
  return {
    variant: typeof s.variant === 'string' ? s.variant : 'hero',
    arrows: s.arrows !== false,
    dots: s.dots !== false,
    loop: s.loop !== false,
    autoplay: Boolean(s.autoplay),
    autoplayMs: Number.isFinite(autoplayMs) && autoplayMs > 0 ? autoplayMs : 3800,
    speedMs: Number.isFinite(speedMs) && speedMs >= 0 ? speedMs : 420,
    gapPx: Number.isFinite(gapPx) && gapPx >= 0 ? gapPx : 12,
    perView: Number.isFinite(perViewVal) ? clamp(Math.floor(perViewVal), 1, 6) : 1,
  };
}

function normalizePropsToSettings(props, device) {
  const p = props && typeof props === 'object' ? props : {};
  // New schema (Elementor-style) lives on props:
  // { variant, autoplay, loop, showArrows, showDots, speed, interval, slidesPerView, gap }
  const spv = p.slidesPerView && typeof p.slidesPerView === 'object' ? p.slidesPerView : null;
  const perView = Number(spv?.[device] ?? spv?.desktop ?? p.slidesPerView ?? 1);
  const interval = Number(p.interval ?? p.autoplayMs ?? 0);
  const speed = Number(p.speed ?? p.speedMs ?? 0);
  const gap = Number(p.gap ?? p.gapPx ?? 0);
  const fromProps = {
    variant: typeof p.variant === 'string' ? p.variant : undefined,
    autoplay: typeof p.autoplay === 'boolean' ? p.autoplay : undefined,
    loop: typeof p.loop === 'boolean' ? p.loop : undefined,
    arrows: typeof p.showArrows === 'boolean' ? p.showArrows : undefined,
    dots: typeof p.showDots === 'boolean' ? p.showDots : undefined,
    speedMs: Number.isFinite(speed) && speed >= 0 ? speed : undefined,
    autoplayMs: Number.isFinite(interval) && interval > 0 ? interval : undefined,
    gapPx: Number.isFinite(gap) && gap >= 0 ? gap : undefined,
    perView: Number.isFinite(perView) ? perView : undefined,
    pauseOnHover: typeof p.pauseOnHover === 'boolean' ? p.pauseOnHover : undefined,
  };

  // Back-compat: old nested settings still supported.
  const nested = normalizeSettings(p.settings, device);
  return {
    variant: fromProps.variant ?? nested.variant,
    autoplay: fromProps.autoplay ?? nested.autoplay,
    loop: fromProps.loop ?? nested.loop,
    arrows: fromProps.arrows ?? nested.arrows,
    dots: fromProps.dots ?? nested.dots,
    speedMs: fromProps.speedMs ?? nested.speedMs,
    autoplayMs: fromProps.autoplayMs ?? nested.autoplayMs,
    gapPx: fromProps.gapPx ?? nested.gapPx,
    perView: fromProps.perView ?? nested.perView,
    pauseOnHover: fromProps.pauseOnHover ?? true,
  };
}

function normalizeSlide(slide, index) {
  const s = slide && typeof slide === 'object' ? slide : {};
  const card = s.card && typeof s.card === 'object' ? s.card : {};
  const cta = s.cta && typeof s.cta === 'object' ? s.cta : {};
  const focal = String(s.imageObjectPosition || '').toLowerCase().trim();
  const imageObjectPosition = ['center', 'top', 'bottom', 'left', 'right'].includes(focal) ? focal : '';
  const br = Math.round(Number(s.imageBorderRadiusPx));
  const iw = Math.round(Number(s.imageWidthPx));
  const ih = Math.round(Number(s.imageHeightPx));
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `slide-${index}`,
    badge: typeof s.badge === 'string' ? s.badge : '',
    title: typeof s.title === 'string' ? s.title : `Slide ${index + 1}`,
    subtitle: typeof s.subtitle === 'string' ? s.subtitle : '',
    body: typeof s.body === 'string' ? s.body : '',
    imageSrc:
      typeof s.imageSrc === 'string'
        ? s.imageSrc
        : typeof s.image === 'string'
          ? s.image
          : typeof s.imageUrl === 'string'
            ? s.imageUrl
            : '',
    imageAlt: typeof s.imageAlt === 'string' ? s.imageAlt : '',
    buttonText: typeof s.buttonText === 'string' ? s.buttonText : '',
    buttonUrl: typeof s.buttonUrl === 'string' ? s.buttonUrl : '',
    overlay: typeof s.overlay === 'string' ? s.overlay : 'card',
    imageBorderRadiusPx: Number.isFinite(br) ? clamp(br, 0, 200) : 0,
    imageWidthPx: Number.isFinite(iw) ? clamp(iw, 0, 2400) : 0,
    imageHeightPx: Number.isFinite(ih) ? clamp(ih, 0, 2400) : 0,
    imageObjectPosition,
    card: {
      title: typeof card.title === 'string' ? card.title : '',
      body: typeof card.body === 'string' ? card.body : '',
      align: typeof card.align === 'string' ? card.align : 'left',
      theme: typeof card.theme === 'string' ? card.theme : 'dark',
    },
    cta: {
      label: typeof cta.label === 'string' ? cta.label : '',
      href: typeof cta.href === 'string' ? cta.href : '',
    },
  };
}

function mapObjectPositionCss(raw) {
  const imagePosRaw = String(raw ?? 'center').toLowerCase().trim();
  const objectPositionMap = {
    center: 'center',
    top: 'center top',
    bottom: 'center bottom',
    left: 'left center',
    right: 'right center',
  };
  return objectPositionMap[imagePosRaw] || 'center';
}

/** Hero / image / card slide: radius, optional box size, focal point (with cover). */
function slideImageStyle(slide, imageFit, globalObjectPositionCss) {
  const fit = String(imageFit || 'cover').toLowerCase() === 'contain' ? 'contain' : 'cover';
  const objectPosition = slide?.imageObjectPosition
    ? mapObjectPositionCss(slide.imageObjectPosition)
    : globalObjectPositionCss;

  const radius = Math.max(0, Math.min(200, Math.round(Number(slide?.imageBorderRadiusPx) || 0)));
  const w = Math.max(0, Math.min(2400, Math.round(Number(slide?.imageWidthPx) || 0)));
  const h = Math.max(0, Math.min(2400, Math.round(Number(slide?.imageHeightPx) || 0)));

  const base = {
    objectFit: fit,
    objectPosition,
  };
  if (radius) base.borderRadius = `${radius}px`;

  if (w > 0 || h > 0) {
    return {
      ...base,
      position: 'absolute',
      left: '50%',
      top: '50%',
      right: 'auto',
      bottom: 'auto',
      inset: 'unset',
      transform: 'translate(-50%, -50%)',
      width: w > 0 ? `${w}px` : 'auto',
      height: h > 0 ? `${h}px` : 'auto',
      maxWidth: '100%',
      maxHeight: '100%',
    };
  }

  return base;
}

function splitHeroVisualBoxStyle(slide) {
  const w = Math.max(0, Math.round(Number(slide?.imageWidthPx) || 0));
  const h = Math.max(0, Math.round(Number(slide?.imageHeightPx) || 0));
  if (w <= 0 && h <= 0) return undefined;
  return {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: h > 0 ? `${h}px` : w > 0 ? 'min-content' : undefined,
    height: h > 0 ? `${h}px` : 'auto',
    width: '100%',
  };
}

/** Visual-only nudge: transform on shell (animation runs on .live-carousel__split-visual-media child). */
function splitHeroVisualShellStyle(slide, offsetX, offsetY) {
  const box = splitHeroVisualBoxStyle(slide) || {};
  const ox = Math.round(Number(offsetX) || 0);
  const oy = Math.round(Number(offsetY) || 0);
  const out = { ...box };
  if (ox !== 0 || oy !== 0) {
    out.transform = `translate(${ox}px, ${oy}px)`;
  }
  return Object.keys(out).length ? out : undefined;
}

function normOverlayKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Starter / demo copy — do not paint on the image. */
function isPlaceholderOverlayTitle(raw) {
  const t = normOverlayKey(raw);
  if (!t) return true;
  if (t === 'slide title' || t === 'card title' || t === 'second card') return true;
  if (/^slide \d+$/.test(t)) return true;
  return false;
}

function isPlaceholderOverlayBody(raw) {
  const t = normOverlayKey(raw);
  if (!t) return true;
  if (t === 'slide subtitle') return true;
  if (t === 'overlay card copy' || t === 'more details') return true;
  if (/^carousel content block \d+$/.test(t)) return true;
  return false;
}

/** On-image headline: `card.title` only, excluding template defaults. */
function overlayCardHeadline(slide) {
  const raw = String(slide?.card?.title || '').trim();
  if (isPlaceholderOverlayTitle(raw)) return '';
  return raw;
}

function overlayCardBody(slide) {
  const raw = String(slide?.card?.body || slide?.body || '').trim();
  if (isPlaceholderOverlayBody(raw)) return '';
  return raw;
}

function overlayCtaVisible(slide) {
  const label = String(slide?.cta?.label || '').trim();
  const href = String(slide?.cta?.href || '').trim();
  if (!label || !href) return false;
  if (href === '#' && /^learn more\.?$/.test(normOverlayKey(label))) return false;
  return true;
}

function slideOverlayVisible(slide) {
  return Boolean(overlayCardHeadline(slide) || overlayCardBody(slide) || overlayCtaVisible(slide));
}

/** Ticker text when there is no image: real card title, else non-placeholder slide title. */
function tickerFallbackLabel(slide) {
  const h = overlayCardHeadline(slide);
  if (h) return h;
  const t = String(slide?.title || '').trim();
  if (isPlaceholderOverlayTitle(t)) return '';
  return t;
}

function tickerSlideImgStyle(slide) {
  const radius = Math.max(0, Math.min(48, Math.round(Number(slide?.imageBorderRadiusPx) || 0)));
  const w = Math.max(0, Math.min(400, Math.round(Number(slide?.imageWidthPx) || 0)));
  const h = Math.max(0, Math.min(200, Math.round(Number(slide?.imageHeightPx) || 0)));
  const sty = {};
  if (radius) sty.borderRadius = `${radius}px`;
  if (w) sty.maxWidth = `${Math.min(w, 152)}px`;
  if (h) sty.maxHeight = `${Math.min(h, 72)}px`;
  return sty;
}

function splitHeroBadgeLabel(slide) {
  const badge = String(slide?.badge || '').trim();
  if (badge) return badge;
  const subtitle = String(slide?.subtitle || '').trim();
  if (subtitle && !isPlaceholderOverlayBody(subtitle)) return subtitle;
  return '';
}

function splitHeroTitle(slide) {
  const title = String(slide?.title || '').trim();
  if (!title || isPlaceholderOverlayTitle(title)) return '';
  return title;
}

function splitHeroBody(slide) {
  const body = String(slide?.body || '').trim();
  if (!body || isPlaceholderOverlayBody(body)) return '';
  return body;
}

function splitHeroCta(slide) {
  const label = String(slide?.cta?.label || slide?.buttonText || '').trim();
  const href = String(slide?.cta?.href || slide?.buttonUrl || '#').trim() || '#';
  return { label, href, visible: Boolean(label) };
}

export default function Carousel({
  slides = [],
  style,
  settings,
  device = 'desktop',
  builderPreview = false,
  builderMode = false,
  builderEditable = false,
  onPatchSlide,
  onSlideImageFile,
  ...restProps
}) {
  const safeSlides = useMemo(
    () => (Array.isArray(slides) ? slides : []).filter((s) => s && typeof s === 'object').map(normalizeSlide),
    [slides]
  );
  const cfg = useMemo(() => {
    // Prefer new props schema (restProps) then fallback to old `settings`.
    const merged = normalizePropsToSettings({ ...restProps, settings }, device);
    return merged;
  }, [restProps, settings, device]);
  const variantKey = String(cfg.variant || 'hero').toLowerCase();
  const isTickerVariant = variantKey === 'ticker';
  const isMarqueeVariant = variantKey === 'marquee';
  const isTickerOrMarquee = isTickerVariant || isMarqueeVariant;
  const isLogoVariant = variantKey === 'logo';
  const isSplitHeroVariant = variantKey === 'splithero';
  const splitHeroVisualFrameRaw = String(restProps?.splitHeroVisualFrame ?? 'none')
    .toLowerCase()
    .trim();
  const splitHeroVisualCard = isSplitHeroVariant && splitHeroVisualFrameRaw === 'card';
  const splitHeroShadowRaw = String(restProps?.splitHeroVisualShadow ?? 'none').toLowerCase().trim();
  const splitHeroShadowClass =
    isSplitHeroVariant && (splitHeroShadowRaw === 'light' || splitHeroShadowRaw === 'medium')
      ? `live-carousel--split-shadow-${splitHeroShadowRaw}`
      : 'live-carousel--split-shadow-none';
  const splitHeroBorderNone =
    isSplitHeroVariant && String(restProps?.splitHeroVisualBorder ?? 'show').toLowerCase().trim() === 'none';
  const imageFitRaw = restProps?.imageFit ?? settings?.imageFit ?? 'cover';
  const imageFitBase = String(imageFitRaw || 'cover').toLowerCase() === 'contain' ? 'contain' : 'cover';
  const imageFit = isLogoVariant ? 'contain' : imageFitBase;
  const imagePosRaw = String(restProps?.imageObjectPosition ?? settings?.imageObjectPosition ?? 'center')
    .toLowerCase()
    .trim();
  const imageObjectPosition = mapObjectPositionCss(imagePosRaw);
  const transitionEasingRaw = String(restProps?.transitionEasing ?? settings?.transitionEasing ?? 'ease')
    .toLowerCase()
    .trim();
  const easingCssMap = {
    ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    linear: 'linear',
    'ease-in-out': 'ease-in-out',
    'ease-out': 'ease-out',
  };
  const transitionEasingCss = easingCssMap[transitionEasingRaw] || easingCssMap.ease;
  const logoHoverZoomEnabled = restProps?.logoHoverZoom ?? settings?.logoHoverZoom ?? false;
  const logoHoverZoomScaleRaw = restProps?.logoHoverZoomScale ?? settings?.logoHoverZoomScale;
  const logoHoverZoomClass = logoHoverZoomPresentation(logoHoverZoomEnabled, logoHoverZoomScaleRaw).className;
  const showOverlayRaw = restProps?.showOverlay ?? settings?.showOverlay;
  const variantForOverlay = variantKey || 'hero';
  const overlayDefaultOn =
    variantForOverlay !== 'image' &&
    variantForOverlay !== 'logo' &&
    variantForOverlay !== 'ticker' &&
    variantForOverlay !== 'marquee';
  const showOverlay =
    showOverlayRaw === undefined ? overlayDefaultOn : Boolean(showOverlayRaw);
  const perView = isSplitHeroVariant ? 1 : clamp(cfg.perView, 1, 6);
  const maxIndex = Math.max(0, safeSlides.length - perView);
  const nSlides = safeSlides.length;
  const useSeamlessLoop = Boolean(cfg.loop) && nSlides > 1 && perView === 1 && !isSplitHeroVariant;

  const trackSlides = useMemo(() => {
    if (!useSeamlessLoop) return safeSlides.map((slide) => ({ slide, key: String(slide.id) }));
    const last = safeSlides[nSlides - 1];
    const first = safeSlides[0];
    return [
      { slide: last, key: `${String(last.id)}--infinite-prev` },
      ...safeSlides.map((s) => ({ slide: s, key: String(s.id) })),
      { slide: first, key: `${String(first.id)}--infinite-next` },
    ];
  }, [useSeamlessLoop, safeSlides, nSlides]);

  const [index, setIndex] = useState(0);
  const [instantTransition, setInstantTransition] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const indexRef = useRef(0);
  const splitHeroImageInputRef = useRef(null);
  indexRef.current = index;

  const canvasEditSplitHero = isSplitHeroVariant && builderMode && builderEditable;
  const patchSplitHeroSlide = useCallback(
    (slideId, patch) => {
      if (!slideId || !patch || !onPatchSlide) return;
      onPatchSlide(slideId, patch);
    },
    [onPatchSlide]
  );
  const stopSplitHeroCanvasBubble = builderMode
    ? (event) => {
        event.stopPropagation();
      }
    : undefined;

  const tickerDurationSec = useMemo(() => {
    const raw = Number(restProps?.tickerDurationSec ?? settings?.tickerDurationSec ?? 32);
    return Math.max(8, Math.min(120, Number.isFinite(raw) ? raw : 32));
  }, [restProps?.tickerDurationSec, settings?.tickerDurationSec]);

  const { topSlides, bottomSlides } = useMemo(() => {
    const topProp = restProps?.tickerSlidesTop ?? restProps?.slidesTop;
    const bottomProp = restProps?.tickerSlidesBottom ?? restProps?.slidesBottom;
    if (topProp != null || bottomProp != null) {
      return {
        topSlides: Array.isArray(topProp) ? topProp.map(normalizeSlide) : safeSlides,
        bottomSlides: Array.isArray(bottomProp) ? bottomProp.map(normalizeSlide) : safeSlides,
      };
    }
    const resolved = resolveDualTickerSlides({ slides: safeSlides });
    return {
      topSlides: resolved.topSlides.map((s, i) => normalizeSlide(s, i)),
      bottomSlides: resolved.bottomSlides.map((s, i) => normalizeSlide(s, i)),
    };
  }, [safeSlides, restProps?.tickerSlidesTop, restProps?.tickerSlidesBottom, restProps?.slidesTop, restProps?.slidesBottom]);

  const row1DupSlides = useMemo(() => buildTickerDupSlides(topSlides), [topSlides]);
  const row2DupSlides = useMemo(() => buildTickerDupSlides(bottomSlides), [bottomSlides]);
  const tickerDupSlides = row1DupSlides;

  const carouselScrollDirection = restProps?.scrollDirection ?? settings?.scrollDirection;
  const { row1TrackClass, row2TrackClass } = resolveTickerScrollClasses(variantKey, carouselScrollDirection);

  useEffect(() => {
    if (useSeamlessLoop) {
      setInstantTransition(false);
      setIndex(1);
      return;
    }
    setIndex((cur) => clamp(cur, 0, maxIndex));
  }, [maxIndex, useSeamlessLoop, nSlides]);

  useEffect(() => {
    if (isTickerOrMarquee) return undefined;
    if (!cfg.autoplay || isPaused || safeSlides.length <= 1) return undefined;
    if (useSeamlessLoop) {
      const t = setInterval(() => {
        setIndex((cur) => {
          if (cur < nSlides) return cur + 1;
          if (cur === nSlides) return nSlides + 1;
          return cur;
        });
      }, cfg.autoplayMs);
      return () => clearInterval(t);
    }
    const t = setInterval(() => {
      setIndex((cur) => {
        if (cur >= maxIndex) return cfg.loop ? 0 : cur;
        return cur + 1;
      });
    }, cfg.autoplayMs);
    return () => clearInterval(t);
  }, [
    cfg.autoplay,
    cfg.autoplayMs,
    cfg.loop,
    isPaused,
    maxIndex,
    nSlides,
    safeSlides.length,
    isTickerOrMarquee,
    useSeamlessLoop,
  ]);

  useLayoutEffect(() => {
    if (!instantTransition) return undefined;
    let id2;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setInstantTransition(false));
    });
    return () => {
      cancelAnimationFrame(id1);
      if (id2 != null) cancelAnimationFrame(id2);
    };
  }, [instantTransition, index]);

  if (!safeSlides.length && !row1DupSlides.length && !row2DupSlides.length) return null;

  if (isTickerOrMarquee) {
    const ariaLabel = isMarqueeVariant ? 'Smooth logo marquee' : 'Logo ticker';
    const tickerHoverZoom = logoHoverZoomPresentation(logoHoverZoomEnabled, logoHoverZoomScaleRaw, {
      ...(style || {}),
      '--carousel-gap': `${cfg.gapPx}px`,
      '--ticker-duration': `${tickerDurationSec}s`,
    });
    return (
      <section
        style={tickerHoverZoom.style}
        className={`live-carousel live-carousel--ticker ${isMarqueeVariant ? 'live-carousel--marquee' : ''} ${isPaused ? 'is-paused' : ''} ${cfg.pauseOnHover !== false ? 'live-carousel--pause-hover' : ''} ${tickerHoverZoom.className}`.trim()}
        aria-label={ariaLabel}
        tabIndex={0}
        onMouseEnter={() => (cfg.pauseOnHover ? setIsPaused(true) : null)}
        onMouseLeave={() => (cfg.pauseOnHover ? setIsPaused(false) : null)}
      >
        <div className={`live-carousel__ticker ${isMarqueeVariant ? 'live-carousel__ticker--single' : ''}`.trim()}>
          {row1DupSlides.length ? (
          <div className="live-carousel__ticker-row">
            <div className={`live-carousel__ticker-track ${row1TrackClass}`.trim()}>
              {(isMarqueeVariant ? tickerDupSlides : row1DupSlides).map(({ slide, key }, slideIndex) => (
                <div key={key} className="live-carousel__ticker-card">
                  {slide.imageSrc ? (
                    <img
                      className="live-carousel__ticker-img"
                      src={slide.imageSrc}
                      alt={slide.imageAlt || ''}
                      style={tickerSlideImgStyle(slide)}
                      {...liveCarouselSlideImageAttrs(slide, { slideIndex, isFirstVisible: slideIndex === 0 })}
                    />
                  ) : (
                    <span className="live-carousel__ticker-fallback">{tickerFallbackLabel(slide) || '\u00a0'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          ) : null}
          {!isMarqueeVariant && row2DupSlides.length ? (
            <div className="live-carousel__ticker-row">
              <div className={`live-carousel__ticker-track ${row2TrackClass}`.trim()}>
                {row2DupSlides.map(({ slide, key }, slideIndex) => (
                  <div key={`${key}-b`} className="live-carousel__ticker-card">
                    {slide.imageSrc ? (
                      <img
                        className="live-carousel__ticker-img"
                        src={slide.imageSrc}
                        alt={slide.imageAlt || ''}
                        style={tickerSlideImgStyle(slide)}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="live-carousel__ticker-fallback">{tickerFallbackLabel(slide) || '\u00a0'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const handleTrackTransitionEnd = (e) => {
    if (!useSeamlessLoop || e.propertyName !== 'transform') return;
    const cur = indexRef.current;
    if (cur === nSlides + 1) {
      setInstantTransition(true);
      setIndex(1);
      return;
    }
    if (cur === 0) {
      setInstantTransition(true);
      setIndex(nSlides);
    }
  };

  const prev = () => {
    setIndex((cur) => {
      if (useSeamlessLoop) {
        if (cur > 1) return cur - 1;
        if (cur === 1) return 0;
        return cur;
      }
      if (cur <= 0) return cfg.loop ? maxIndex : 0;
      return cur - 1;
    });
  };
  const next = () => {
    setIndex((cur) => {
      if (useSeamlessLoop) {
        if (cur < nSlides) return cur + 1;
        if (cur === nSlides) return nSlides + 1;
        return cur;
      }
      if (cur >= maxIndex) return cfg.loop ? 0 : maxIndex;
      return cur + 1;
    });
  };

  const pages = useSeamlessLoop ? nSlides : Math.max(1, maxIndex + 1);
  const activeDotIndex = useSeamlessLoop ? ((index - 1 + nSlides) % nSlides + nSlides) % nSlides : index;
  const fitModeClass =
    isLogoVariant ? 'live-carousel--slide-intrinsic' : imageFit === 'contain' ? 'live-carousel--fit-contain' : '';
  const sectionClass = `live-carousel live-carousel--${variantKey} ${fitModeClass} ${logoHoverZoomClass} ${cfg.pauseOnHover !== false ? 'live-carousel--pause-hover' : ''}`.trim();
  const slideModeClass =
    variantKey === 'card'
      ? ''
      : variantKey === 'hero'
        ? 'live-carousel__slide--hero'
        : variantKey === 'logo'
          ? 'live-carousel__slide--logo'
          : 'live-carousel__slide--image';
  const vars = {
    '--carousel-gap': `${cfg.gapPx}px`,
    '--carousel-per-view': String(perView),
    '--carousel-speed': `${cfg.speedMs}ms`,
    '--carousel-image-fit': imageFit,
    '--carousel-easing': transitionEasingCss,
  };
  const onKeyDown = (event) => {
    if (event.defaultPrevented) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setIndex(useSeamlessLoop ? 1 : 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setIndex(useSeamlessLoop ? nSlides : maxIndex);
    }
  };

  if (isSplitHeroVariant) {
    const transitionEffectRaw = String(
      restProps?.transitionEffect ?? settings?.transitionEffect ?? 'slide'
    )
      .toLowerCase()
      .trim();
    const isFade = transitionEffectRaw === 'fade';
    const visualWidthPct = clamp(
      Math.round(Number(restProps?.splitHeroVisualWidthPct) || 48),
      28,
      72
    );
    const visualMinH = Math.round(Number(restProps?.splitHeroVisualMinHeightPx) || 0);
    const visualOffsetX = clamp(Math.round(Number(restProps?.splitHeroVisualOffsetXPx) || 0), -480, 480);
    const visualOffsetY = clamp(Math.round(Number(restProps?.splitHeroVisualOffsetYPx) || 0), -480, 480);
    const navOffsetX = clamp(Math.round(Number(restProps?.splitHeroNavOffsetXPx) || 0), -480, 480);
    const navOffsetY = clamp(Math.round(Number(restProps?.splitHeroNavOffsetYPx) || 0), -480, 480);
    const imageMaxH = Math.round(Number(restProps?.splitHeroImageMaxHeightPx) ?? 300);
    const imageScalePct = clamp(Math.round(Number(restProps?.splitHeroImageScalePct) || 100), 100, 140);
    const sectionMinH = Math.round(Number(restProps?.splitHeroSectionMinHeightPx) || 0);
    const sectionMaxH = Math.round(Number(restProps?.splitHeroSectionMaxHeightPx) || 0);
    const splitVars = {
      '--carousel-gap': `${cfg.gapPx}px`,
      '--carousel-per-view': '1',
      '--carousel-speed': `${cfg.speedMs}ms`,
      '--carousel-easing': transitionEasingCss,
      '--carousel-image-fit': imageFit,
      '--split-hero-grid-columns': `minmax(0, ${100 - visualWidthPct}fr) minmax(0, ${visualWidthPct}fr)`,
    };
    if (visualMinH > 0) splitVars['--split-hero-visual-min-height'] = `${visualMinH}px`;
    splitVars['--split-hero-visual-offset-x'] = `${visualOffsetX}px`;
    splitVars['--split-hero-visual-offset-y'] = `${visualOffsetY}px`;
    splitVars['--split-hero-nav-offset-x'] = `${navOffsetX}px`;
    splitVars['--split-hero-nav-offset-y'] = `${navOffsetY}px`;
    if (imageMaxH > 0) splitVars['--split-hero-image-max-height'] = `${imageMaxH}px`;
    if (imageScalePct > 100) splitVars['--split-hero-image-scale'] = String(imageScalePct / 100);
    Object.assign(splitVars, splitHeroCopyTypoToCssVars(splitHeroCopyTypoFromProps(restProps)));
    const bleedPad = Math.max(0, visualOffsetY, navOffsetY);
    if (bleedPad > 0) splitVars['--split-hero-pad-bottom'] = `${bleedPad + 32}px`;
    if (sectionMinH > 0) splitVars['--split-hero-section-min-height'] = `${sectionMinH}px`;
    if (sectionMaxH > 0) splitVars['--split-hero-section-max-height'] = `${sectionMaxH}px`;
    const visualBg = String(restProps?.splitHeroVisualBgColor || '').trim();
    const visualBorderColor = String(restProps?.splitHeroVisualBorderColor || '').trim();
    const hasCustomVisualBg = /^#[0-9a-f]{3,8}$/i.test(visualBg);
    if (hasCustomVisualBg) splitVars['--split-hero-visual-bg'] = visualBg;
    if (/^#[0-9a-f]{3,8}$/i.test(visualBorderColor)) {
      splitVars['--split-hero-visual-border-color'] = visualBorderColor;
    }
    const splitVisualDataAttrs =
      !splitHeroVisualCard && hasCustomVisualBg ? { 'data-split-hero-custom-bg': 'true' } : {};
    const splitPanelGridStyle = {
      gridTemplateColumns: `minmax(0, ${100 - visualWidthPct}fr) minmax(0, ${visualWidthPct}fr)`,
    };
    const handleSplitHeroImageFile = (slideId, event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !slideId) return;
      onSlideImageFile?.(slideId, file);
    };
    const splitNav =
      (cfg.arrows && safeSlides.length > 1) || (cfg.dots && pages > 1) ? (
        <div className="live-carousel__split-nav" role="group" aria-label="Carousel navigation">
          {cfg.arrows && safeSlides.length > 1 ? (
            <button
              type="button"
              className="live-carousel__split-arrow"
              onClick={(event) => {
                event.stopPropagation();
                prev();
              }}
              aria-label="Previous slide"
            >
              ‹
            </button>
          ) : null}
          {cfg.dots && pages > 1 ? (
            <div className="live-carousel__split-dots" aria-label="Slides">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={String(i)}
                  type="button"
                  className={`live-carousel__split-dot ${i === activeDotIndex ? 'is-active' : ''}`.trim()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIndex(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-pressed={i === activeDotIndex}
                />
              ))}
            </div>
          ) : null}
          {cfg.arrows && safeSlides.length > 1 ? (
            <button
              type="button"
              className="live-carousel__split-arrow"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              aria-label="Next slide"
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null;
    const renderSplitPanel = (slide, slideIndex) => {
      const badge = splitHeroBadgeLabel(slide);
      const title = splitHeroTitle(slide);
      const body = splitHeroBody(slide);
      const cta = splitHeroCta(slide);
      const slideId = String(slide?.id || slideIndex);
      const imgAttrs = liveCarouselSlideImageAttrs(slide, {
        slideIndex,
        isFirstVisible: slideIndex === activeDotIndex,
      });
      const customImgSize =
        Math.round(Number(slide?.imageWidthPx) || 0) > 0 || Math.round(Number(slide?.imageHeightPx) || 0) > 0;
      return (
        <div className="live-carousel__split-panel-inner" style={splitPanelGridStyle}>
          <div
            className={`live-carousel__split-copy${canvasEditSplitHero ? ' live-carousel__split-copy--editable' : ''}`}
            onPointerDown={canvasEditSplitHero ? stopSplitHeroCanvasBubble : undefined}
          >
            {badge || canvasEditSplitHero ? (
              canvasEditSplitHero ? (
                <FeatureTabCanvasField
                  as="span"
                  className="live-carousel__split-badge live-carousel__split-editable"
                  value={badge}
                  onCommit={(next) => patchSplitHeroSlide(slideId, { badge: next })}
                  onPointerDown={stopSplitHeroCanvasBubble}
                />
              ) : (
                <span className="live-carousel__split-badge">{badge}</span>
              )
            ) : null}
            {title || canvasEditSplitHero ? (
              canvasEditSplitHero ? (
                <FeatureTabCanvasField
                  as="h2"
                  className="live-carousel__split-title live-carousel__split-editable"
                  value={title}
                  onCommit={(next) => patchSplitHeroSlide(slideId, { title: next })}
                  onPointerDown={stopSplitHeroCanvasBubble}
                />
              ) : (
                <h2 className="live-carousel__split-title">{title}</h2>
              )
            ) : null}
            {body || canvasEditSplitHero ? (
              canvasEditSplitHero ? (
                <FeatureTabCanvasField
                  as="p"
                  className="live-carousel__split-body live-carousel__split-editable"
                  value={body}
                  multiline
                  onCommit={(next) => patchSplitHeroSlide(slideId, { body: next })}
                  onPointerDown={stopSplitHeroCanvasBubble}
                />
              ) : (
                <p className="live-carousel__split-body">{body}</p>
              )
            ) : null}
            {cta.visible || canvasEditSplitHero ? (
              canvasEditSplitHero ? (
                <FeatureTabCanvasField
                  as="span"
                  className="live-carousel__split-cta live-carousel__split-editable"
                  value={cta.label}
                  onCommit={(next) =>
                    patchSplitHeroSlide(slideId, {
                      cta: { ...(slide?.cta || {}), label: next },
                      buttonText: next,
                    })
                  }
                  onPointerDown={stopSplitHeroCanvasBubble}
                />
              ) : builderPreview ? (
                <span className="live-carousel__split-cta" role="link" tabIndex={-1}>
                  {cta.label}
                </span>
              ) : (
                <a className="live-carousel__split-cta" href={cta.href}>
                  {cta.label}
                </a>
              )
            ) : null}
            {splitNav}
          </div>
          <div
            className={`live-carousel__split-visual${canvasEditSplitHero ? ' live-carousel__split-visual--editable' : ''}${customImgSize ? ' live-carousel__split-visual--custom-size' : ''}`}
            style={splitHeroVisualShellStyle(slide, visualOffsetX, visualOffsetY)}
            {...splitVisualDataAttrs}
            onPointerDown={canvasEditSplitHero ? stopSplitHeroCanvasBubble : undefined}
          >
            <div className="live-carousel__split-visual-media">
              {slide.imageSrc ? (
                <img
                  className={`live-carousel__split-img${customImgSize ? ' live-carousel__split-img--custom-size' : ''}`.trim()}
                  src={slide.imageSrc}
                  alt={slide.imageAlt || ''}
                  style={slideImageStyle(slide, imageFit, imageObjectPosition)}
                  {...imgAttrs}
                />
              ) : (
                <div
                  className={`live-carousel__split-img-placeholder${canvasEditSplitHero ? ' live-carousel__split-img-placeholder--editable' : ''}`}
                  aria-hidden={!canvasEditSplitHero}
                  role={canvasEditSplitHero ? 'button' : undefined}
                  tabIndex={canvasEditSplitHero ? 0 : undefined}
                  onClick={
                    canvasEditSplitHero
                      ? (event) => {
                          event.stopPropagation();
                          splitHeroImageInputRef.current?.click();
                        }
                      : undefined
                  }
                  onKeyDown={
                    canvasEditSplitHero
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            splitHeroImageInputRef.current?.click();
                          }
                        }
                      : undefined
                  }
                >
                  {canvasEditSplitHero ? 'Click here to upload image' : 'Image'}
                </div>
              )}
              {canvasEditSplitHero ? (
                <>
                  <input
                    ref={splitHeroImageInputRef}
                    type="file"
                    accept="image/*"
                    className="live-carousel__split-image-input"
                    aria-hidden
                    tabIndex={-1}
                    onChange={(event) => handleSplitHeroImageFile(slideId, event)}
                  />
                  <button
                    type="button"
                    className="live-carousel__split-image-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      splitHeroImageInputRef.current?.click();
                    }}
                  >
                    Change image
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      );
    };

    const activeSlide = safeSlides[activeDotIndex] ?? safeSlides[0];

    return (
      <section
        style={{ ...(style || {}), ...splitVars }}
        className={`live-carousel live-carousel--splitHero ${isFade ? 'is-fade' : 'is-slide'} ${isPaused ? 'is-paused' : ''} ${splitHeroVisualCard ? 'live-carousel--split-visual-card' : ''} ${splitHeroBorderNone ? 'live-carousel--split-visual-border-none' : ''} ${splitHeroShadowClass} ${canvasEditSplitHero ? 'live-carousel--builder' : ''}`.trim()}
        aria-label="Split hero carousel"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => (cfg.pauseOnHover ? setIsPaused(true) : null)}
        onMouseLeave={() => (cfg.pauseOnHover ? setIsPaused(false) : null)}
      >
        {canvasEditSplitHero ? (
          <p className="live-carousel__split-builder-hint" aria-hidden>
            Click text to edit · Change image button to replace · Content → Right side size
          </p>
        ) : null}
        <div className="live-carousel__split-viewport live-carousel__viewport">
          <article
            key={`split-hero-${activeDotIndex}-${String(activeSlide?.id || activeDotIndex)}`}
            className="live-carousel__split-panel is-active"
            aria-live="polite"
          >
            {renderSplitPanel(activeSlide, activeDotIndex)}
          </article>
        </div>
      </section>
    );
  }

  return (
    <section
      style={logoHoverZoomPresentation(logoHoverZoomEnabled, logoHoverZoomScaleRaw, { ...(style || {}), ...(vars || {}) }).style}
      className={sectionClass}
      aria-label="Carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => (cfg.pauseOnHover ? setIsPaused(true) : null)}
      onMouseLeave={() => (cfg.pauseOnHover ? setIsPaused(false) : null)}
    >
      <div className="live-carousel__viewport">
        <div
          className="live-carousel__track"
          style={{
            transform: `translate3d(calc(${index} * (0px - (100% + var(--carousel-gap)) / var(--carousel-per-view))), 0, 0)`,
            transition: instantTransition ? 'none' : `transform ${cfg.speedMs}ms ${transitionEasingCss}`,
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {trackSlides.map(({ slide, key }, slideIndex) => {
            const imgAttrs = liveCarouselSlideImageAttrs(slide, {
              slideIndex,
              isFirstVisible: slideIndex === (useSeamlessLoop ? 1 : 0),
            });
            return (
            <div key={key} className="live-carousel__item">
              {cfg.variant === 'card' ? (
                <article className="live-carousel__card-slide">
                  {slide.imageSrc ? (
                    <img
                      className="live-carousel__card-img"
                      src={slide.imageSrc}
                      alt={slide.imageAlt || ''}
                      style={slideImageStyle(slide, imageFit, imageObjectPosition)}
                      {...imgAttrs}
                    />
                  ) : null}
                  {slideOverlayVisible(slide) ? (
                    <div className="live-carousel__card-inner">
                      {overlayCardHeadline(slide) ? (
                        <h3 className="live-carousel__title">{overlayCardHeadline(slide)}</h3>
                      ) : null}
                      {overlayCardBody(slide) ? <p className="live-carousel__body">{overlayCardBody(slide)}</p> : null}
                      {overlayCtaVisible(slide) ? (
                        <a className="live-carousel__cta" href={slide.cta.href}>
                          {slide.cta.label}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ) : (
                <article className={`live-carousel__slide ${slideModeClass}`.trim()}>
                  {slide.imageSrc ? (
                    <img
                      className="live-carousel__img"
                      src={slide.imageSrc}
                      alt={slide.imageAlt || ''}
                      style={slideImageStyle(slide, imageFit, imageObjectPosition)}
                      {...imgAttrs}
                    />
                  ) : null}
                  {!showOverlay || !slideOverlayVisible(slide) ? null : (
                    <div className="live-carousel__overlay">
                      <div
                        className={`live-carousel__card live-carousel__card--${slide.card.theme} live-carousel__card--${slide.card.align}`.trim()}
                      >
                        {overlayCardHeadline(slide) ? (
                          <h3 className="live-carousel__title">{overlayCardHeadline(slide)}</h3>
                        ) : null}
                        {overlayCardBody(slide) ? <p className="live-carousel__body">{overlayCardBody(slide)}</p> : null}
                        {overlayCtaVisible(slide) ? (
                          <a className="live-carousel__cta" href={slide.cta.href}>
                            {slide.cta.label}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </article>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {cfg.arrows && safeSlides.length > perView ? (
        <div className="live-carousel__arrows" aria-hidden={false}>
          <button type="button" className="live-carousel__arrow" onClick={prev} aria-label="Previous slide">
            ‹
          </button>
          <button type="button" className="live-carousel__arrow" onClick={next} aria-label="Next slide">
            ›
          </button>
        </div>
      ) : null}

      {cfg.dots && pages > 1 ? (
        <div className="live-carousel__dots" aria-label="Slides">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={String(i)}
              type="button"
              className={`live-carousel__dot ${i === activeDotIndex ? 'is-active' : ''}`.trim()}
              onClick={() => setIndex(useSeamlessLoop ? i + 1 : i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-pressed={i === activeDotIndex}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
