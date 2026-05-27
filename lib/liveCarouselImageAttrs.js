import { liveImageIntrinsicAttrs, pickImageLoadingPolicy } from './liveImagePerf.js';

/**
 * @param {object} slide
 * @param {{ slideIndex?: number, isFirstVisible?: boolean }} [ctx]
 */
export function liveCarouselSlideImageAttrs(slide, ctx = {}) {
  const slideIndex = Number(ctx.slideIndex) || 0;
  const isFirst = ctx.isFirstVisible === true || slideIndex === 0;
  const policy = pickImageLoadingPolicy(isFirst ? 0 : slideIndex + 1);
  const ih = Math.round(Number(slide?.imageHeightPx) || 0);
  const iw = Math.round(Number(slide?.imageWidthPx) || 0);
  const intrinsic = liveImageIntrinsicAttrs({
    imageHeightPx: ih,
    widthPx: iw > 0 ? iw : null,
  });
  return { ...policy, ...intrinsic };
}
