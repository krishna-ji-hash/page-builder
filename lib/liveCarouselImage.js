/**
 * Carousel image helpers: next/image compatibility, responsive sizes, dev diagnostics.
 */

import { isMeaningfulImageSrc } from './liveImagePerf.js';

/** Hostnames allowed via next.config remotePatterns (keep in sync). */
const NEXT_IMAGE_REMOTE_HOSTS = new Set([
  'images.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
  'picsum.photos',
]);

/**
 * @param {unknown} src
 * @returns {boolean}
 */
export function canOptimizeCarouselImageWithNext(src) {
  const s = String(src || '').trim();
  if (!isMeaningfulImageSrc(s)) return false;
  if (s.startsWith('/')) return true;
  if (s.startsWith('blob:') || s.startsWith('data:')) return false;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    return NEXT_IMAGE_REMOTE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Responsive sizes for split-hero visual column (right-side mockup).
 * @param {number} visualWidthPct — 28–72
 */
export function splitHeroCarouselSizes(visualWidthPct = 48) {
  const pct = Math.max(28, Math.min(72, Math.round(Number(visualWidthPct) || 48)));
  return `(max-width: 768px) 100vw, ${pct}vw`;
}

/**
 * Default intrinsic box for split-hero images when slide has no custom px size.
 * @param {{ splitHeroImageMaxHeightPx?: number, visualWidthPct?: number }} [opts]
 */
export function splitHeroDefaultIntrinsic(opts = {}) {
  const maxH = Math.max(120, Math.round(Number(opts.splitHeroImageMaxHeightPx) || 300));
  const pct = Math.max(28, Math.min(72, Math.round(Number(opts.visualWidthPct) || 48)));
  const width = Math.max(240, Math.round((1200 * pct) / 100));
  return { width, height: maxH };
}

/**
 * Hero/image carousel slide sizes (full viewport width per slide).
 * @param {number} perView
 */
export function trackCarouselSizes(perView = 1) {
  const pv = Math.max(1, Math.min(6, Math.round(Number(perView) || 1)));
  if (pv <= 1) return '(max-width: 768px) 100vw, 100vw';
  return `(max-width: 768px) 100vw, ${Math.round(100 / pv)}vw`;
}

/** Default hero slide intrinsic (16:9 @ 720p band). */
export function heroCarouselDefaultIntrinsic() {
  return { width: 1280, height: 720 };
}

/**
 * Dev-only: log first priority carousel image (no PII).
 * @param {{ src?: string, priority?: boolean, variant?: string, slideIndex?: number }} info
 */
export function logCarouselLcpDiagnostic(info = {}) {
  if (process.env.NODE_ENV !== 'development') return;
  const src = String(info.src || '').trim();
  if (!src) return;
  let host = 'unknown';
  try {
    host = src.startsWith('/') ? 'same-origin' : new URL(src).hostname;
  } catch {
    host = 'invalid-url';
  }
  // eslint-disable-next-line no-console
  console.info(
    `[carousel-lcp] slide=${info.slideIndex ?? 0} priority=${Boolean(info.priority)} variant=${info.variant || 'unknown'} host=${host}`
  );
}

/**
 * Whether the first meaningful image in document order is a carousel slide.
 * When true, skip document-level preload (LiveCarouselImage priority handles LCP).
 * @param {object[]} nodes
 */
export function isFirstLcpFromCarousel(nodes) {
  if (!Array.isArray(nodes)) return false;
  /** @type {boolean|null} */
  let result = null;

  const walk = (list) => {
    for (const n of list) {
      if (result !== null || !n) continue;
      if (n.nodeType === 'image' && isMeaningfulImageSrc(n.props?.src)) {
        result = false;
        return;
      }
      if (n.nodeType === 'carousel') {
        const slides = Array.isArray(n.props?.slides) ? n.props.slides : [];
        for (const slide of slides) {
          const src = slide?.imageSrc || slide?.image || slide?.imageUrl || '';
          if (isMeaningfulImageSrc(src)) {
            result = true;
            return;
          }
        }
      }
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  };

  walk(nodes);
  return result === true;
}
