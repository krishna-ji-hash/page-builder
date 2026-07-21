import {
  heroCarouselDefaultIntrinsic,
  splitHeroCarouselSizes,
  splitHeroDefaultIntrinsic,
  trackCarouselSizes,
} from './liveCarouselImage.js';
import { liveImageIntrinsicAttrs, pickImageLoadingPolicy } from './liveImagePerf.js';

/**
 * @param {object} slide
 * @param {{
 *   slideIndex?: number,
 *   isFirstVisible?: boolean,
 *   variant?: string,
 *   splitHeroImageMaxHeightPx?: number,
 *   splitHeroVisualWidthPct?: number,
 *   perView?: number,
 * }} [ctx]
 */
export function liveCarouselSlideImageAttrs(slide, ctx = {}) {
  const slideIndex = Number(ctx.slideIndex) || 0;
  const isFirst = ctx.isFirstVisible === true || slideIndex === 0;
  const policy = pickImageLoadingPolicy(isFirst ? 0 : slideIndex + 1);
  const ih = Math.round(Number(slide?.imageHeightPx) || 0);
  const iw = Math.round(Number(slide?.imageWidthPx) || 0);
  const variant = String(ctx.variant || '').toLowerCase();

  let intrinsic = liveImageIntrinsicAttrs({
    imageHeightPx: ih,
    widthPx: iw > 0 ? iw : null,
  });

  let sizes;

  if (variant === 'splithero') {
    if (!intrinsic.width && !intrinsic.height) {
      intrinsic = splitHeroDefaultIntrinsic({
        splitHeroImageMaxHeightPx: ctx.splitHeroImageMaxHeightPx,
        visualWidthPct: ctx.splitHeroVisualWidthPct,
      });
    }
    sizes = splitHeroCarouselSizes(ctx.splitHeroVisualWidthPct);
  } else if (variant === 'hero' || variant === 'image' || variant === 'card') {
    if (!intrinsic.width && !intrinsic.height) {
      intrinsic = heroCarouselDefaultIntrinsic();
    }
    sizes = trackCarouselSizes(ctx.perView);
  }

  return { ...policy, ...intrinsic, sizes, priority: isFirst };
}

/**
 * Native <img>-safe attrs only (no next/image `priority` boolean — React warns on DOM).
 * @param {object} slide
 * @param {Parameters<typeof liveCarouselSlideImageAttrs>[1]} [ctx]
 */
export function liveCarouselNativeImgAttrs(slide, ctx = {}) {
  const { priority: _priority, ...rest } = liveCarouselSlideImageAttrs(slide, ctx);
  return rest;
}
