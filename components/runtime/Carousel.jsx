'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `slide-${index}`,
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

export default function Carousel({ slides = [], style, settings, device = 'desktop', ...restProps }) {
  const safeSlides = useMemo(
    () => (Array.isArray(slides) ? slides : []).filter((s) => s && typeof s === 'object').map(normalizeSlide),
    [slides]
  );
  const cfg = useMemo(() => {
    // Prefer new props schema (restProps) then fallback to old `settings`.
    const merged = normalizePropsToSettings({ ...restProps, settings }, device);
    return merged;
  }, [restProps, settings, device]);
  const imageFitRaw = restProps?.imageFit ?? settings?.imageFit ?? 'cover';
  const imageFit = String(imageFitRaw || 'cover').toLowerCase() === 'contain' ? 'contain' : 'cover';
  const showOverlayRaw = restProps?.showOverlay ?? settings?.showOverlay;
  const showOverlay = showOverlayRaw === undefined ? true : Boolean(showOverlayRaw);
  const perView = clamp(cfg.perView, 1, 6);
  const maxIndex = Math.max(0, safeSlides.length - perView);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const indexRef = useRef(0);
  indexRef.current = index;

  useEffect(() => {
    setIndex((cur) => clamp(cur, 0, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!cfg.autoplay || isPaused || safeSlides.length <= 1) return undefined;
    const t = setInterval(() => {
      setIndex((cur) => {
        if (cur >= maxIndex) return cfg.loop ? 0 : cur;
        return cur + 1;
      });
    }, cfg.autoplayMs);
    return () => clearInterval(t);
  }, [cfg.autoplay, cfg.autoplayMs, cfg.loop, isPaused, maxIndex, safeSlides.length]);

  if (!safeSlides.length) return null;

  const prev = () => {
    setIndex((cur) => {
      if (cur <= 0) return cfg.loop ? maxIndex : 0;
      return cur - 1;
    });
  };
  const next = () => {
    setIndex((cur) => {
      if (cur >= maxIndex) return cfg.loop ? 0 : maxIndex;
      return cur + 1;
    });
  };

  const pages = Math.max(1, maxIndex + 1);
  const sectionClass = `live-carousel live-carousel--${cfg.variant || 'hero'} ${imageFit === 'contain' ? 'live-carousel--fit-contain' : ''}`.trim();
  const vars = {
    '--carousel-gap': `${cfg.gapPx}px`,
    '--carousel-per-view': String(perView),
    '--carousel-speed': `${cfg.speedMs}ms`,
    '--carousel-image-fit': imageFit,
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
      setIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setIndex(maxIndex);
    }
  };

  return (
    <section
      style={{ ...(style || {}), ...(vars || {}) }}
      className={sectionClass}
      aria-label="Carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => (cfg.pauseOnHover ? setIsPaused(true) : null)}
      onMouseLeave={() => (cfg.pauseOnHover ? setIsPaused(false) : null)}
      onFocus={() => (cfg.pauseOnHover ? setIsPaused(true) : null)}
      onBlur={() => (cfg.pauseOnHover ? setIsPaused(false) : null)}
    >
      <div className="live-carousel__viewport">
        <div
          className="live-carousel__track"
          style={{
            transform: `translateX(calc(${index} * (0px - (100% + var(--carousel-gap)) / var(--carousel-per-view))))`,
            transitionDuration: `${cfg.speedMs}ms`,
          }}
        >
          {safeSlides.map((slide) => (
            <div key={slide.id} className="live-carousel__item">
              {cfg.variant === 'card' ? (
                <article className="live-carousel__card-slide">
                  {slide.imageSrc ? (
                    <img
                      className="live-carousel__card-img"
                      src={slide.imageSrc}
                      alt={slide.imageAlt || slide.title}
                      style={{ objectFit: imageFit }}
                    />
                  ) : null}
                  <div className="live-carousel__card-inner">
                    <h3 className="live-carousel__title">{slide.card.title || slide.title}</h3>
                    {slide.card.body || slide.body ? <p className="live-carousel__body">{slide.card.body || slide.body}</p> : null}
                    {slide.cta?.label && slide.cta?.href ? (
                      <a className="live-carousel__cta" href={slide.cta.href}>
                        {slide.cta.label}
                      </a>
                    ) : null}
                  </div>
                </article>
              ) : (
                <article className="live-carousel__slide">
                  {slide.imageSrc ? (
                    <img
                      className="live-carousel__img"
                      src={slide.imageSrc}
                      alt={slide.imageAlt || slide.title}
                      style={{ objectFit: imageFit }}
                    />
                  ) : null}
                  {!showOverlay ? null : (
                    <div className="live-carousel__overlay">
                      <div
                        className={`live-carousel__card live-carousel__card--${slide.card.theme} live-carousel__card--${slide.card.align}`.trim()}
                      >
                        <h3 className="live-carousel__title">{slide.card.title || slide.title}</h3>
                        {slide.card.body || slide.body ? <p className="live-carousel__body">{slide.card.body || slide.body}</p> : null}
                        {slide.cta?.label && slide.cta?.href ? (
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
          ))}
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
              className={`live-carousel__dot ${i === index ? 'is-active' : ''}`.trim()}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-pressed={i === index}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
