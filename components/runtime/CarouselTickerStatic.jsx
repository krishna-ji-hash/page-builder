import {
  buildTickerDupSlides,
  resolveTickerDurationSec,
  resolveTickerGapPx,
  resolveTickerScrollClasses,
  tickerFallbackLabel,
  tickerSlideImgStyle,
} from '@/lib/carouselTickerShared';
import { liveCarouselSlideImageAttrs } from '@/lib/liveCarouselImageAttrs';

/**
 * Server-rendered logo ticker / marquee (CSS animation only).
 * Used on the public live site so large base64 slide images are not re-sent to the client bundle.
 */
export default function CarouselTickerStatic({
  slides = [],
  variant = 'marquee',
  style,
  gap,
  tickerDurationSec,
  scrollDirection,
}) {
  const variantKey = String(variant || 'marquee').toLowerCase();
  const { isMarqueeVariant, row1TrackClass, row2TrackClass } = resolveTickerScrollClasses(
    variantKey,
    scrollDirection
  );
  const tickerDupSlides = buildTickerDupSlides(slides);
  if (!tickerDupSlides.length) return null;

  const gapPx = resolveTickerGapPx(gap);
  const durationSec = resolveTickerDurationSec(tickerDurationSec);
  const ariaLabel = isMarqueeVariant ? 'Smooth logo marquee' : 'Logo ticker';

  return (
    <section
      suppressHydrationWarning
      style={{
        ...(style || {}),
        '--carousel-gap': `${gapPx}px`,
        '--ticker-duration': `${durationSec}s`,
      }}
      className={`live-carousel live-carousel--ticker ${isMarqueeVariant ? 'live-carousel--marquee' : ''}`.trim()}
      aria-label={ariaLabel}
    >
      <div className={`live-carousel__ticker ${isMarqueeVariant ? 'live-carousel__ticker--single' : ''}`.trim()}>
        <div className="live-carousel__ticker-row">
          <div className={`live-carousel__ticker-track ${row1TrackClass}`.trim()}>
            {tickerDupSlides.map(({ slide, key }) => (
              <div key={key} className="live-carousel__ticker-card">
                {slide.imageSrc ? (
                  <img
                    className="live-carousel__ticker-img"
                    src={slide.imageSrc}
                    alt={slide.imageAlt || ''}
                    style={tickerSlideImgStyle(slide)}
                  />
                ) : (
                  <span className="live-carousel__ticker-fallback">{tickerFallbackLabel(slide) || '\u00a0'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {!isMarqueeVariant ? (
          <div className="live-carousel__ticker-row">
            <div className={`live-carousel__ticker-track ${row2TrackClass}`.trim()}>
              {tickerDupSlides.map(({ slide, key }, slideIndex) => (
                <div key={`${key}-b`} className="live-carousel__ticker-card">
                  {slide.imageSrc ? (
                    <img
                      className="live-carousel__ticker-img"
                      src={slide.imageSrc}
                      alt={slide.imageAlt || ''}
                      style={tickerSlideImgStyle(slide)}
                      {...liveCarouselSlideImageAttrs(slide, {
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
      </div>
    </section>
  );
}
