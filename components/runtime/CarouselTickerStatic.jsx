import {
  buildTickerDupSlides,
  resolveTickerDurationSec,
  resolveTickerGapPx,
  resolveTickerScrollClasses,
  tickerFallbackLabel,
  tickerSlideImgStyle,
} from '@/lib/carouselTickerShared';
import { resolveDualTickerSlides } from '@/lib/carouselTickerRows';
import { logoHoverZoomPresentation } from '@/lib/carouselLogoHoverZoom';
import { liveCarouselNativeImgAttrs } from '@/lib/liveCarouselImageAttrs';

/**
 * Server-rendered logo ticker / marquee (CSS animation only).
 * Used on the public live site so large base64 slide images are not re-sent to the client bundle.
 */
export default function CarouselTickerStatic({
  slides = [],
  slidesTop,
  slidesBottom,
  variant = 'marquee',
  style,
  gap,
  tickerDurationSec,
  scrollDirection,
  pauseOnHover = true,
  logoHoverZoom = false,
  logoHoverZoomScale,
}) {
  const variantKey = String(variant || 'marquee').toLowerCase();
  const { isMarqueeVariant, row1TrackClass, row2TrackClass } = resolveTickerScrollClasses(
    variantKey,
    scrollDirection
  );
  const { topSlides, bottomSlides } =
    slidesTop != null || slidesBottom != null
      ? {
          topSlides: Array.isArray(slidesTop) ? slidesTop : slides,
          bottomSlides: Array.isArray(slidesBottom) ? slidesBottom : slides,
        }
      : resolveDualTickerSlides({ slides });
  const row1DupSlides = buildTickerDupSlides(topSlides);
  const row2DupSlides = buildTickerDupSlides(bottomSlides);
  const tickerDupSlides = isMarqueeVariant ? row1DupSlides : row1DupSlides;
  if (!row1DupSlides.length && !row2DupSlides.length) return null;

  const gapPx = resolveTickerGapPx(gap);
  const durationSec = resolveTickerDurationSec(tickerDurationSec);
  const ariaLabel = isMarqueeVariant ? 'Smooth logo marquee' : 'Logo ticker';
  const hoverZoom = logoHoverZoomPresentation(logoHoverZoom, logoHoverZoomScale, {
    ...(style || {}),
    '--carousel-gap': `${gapPx}px`,
    '--ticker-duration': `${durationSec}s`,
  });

  return (
    <section
      suppressHydrationWarning
      style={hoverZoom.style}
      className={`live-carousel live-carousel--ticker ${isMarqueeVariant ? 'live-carousel--marquee' : ''} ${pauseOnHover !== false ? 'live-carousel--pause-hover' : ''} ${hoverZoom.className}`.trim()}
      aria-label={ariaLabel}
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
                    {...liveCarouselNativeImgAttrs(slide, {
                      slideIndex,
                      isFirstVisible: slideIndex === 0,
                    })}
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
                      {...liveCarouselNativeImgAttrs(slide, {
                        slideIndex,
                        isFirstVisible: false,
                      })}
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
