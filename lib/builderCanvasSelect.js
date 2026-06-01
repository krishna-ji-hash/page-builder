/** Builder canvas: resolve which node should receive a click (nested widgets). */

const CAROUSEL_NAV_SELECTOR =
  '.live-carousel__split-nav, .live-carousel__split-arrow, .live-carousel__split-dot, .live-carousel__arrow, .live-carousel__dot';

const SPLIT_HERO_CONTENT_SELECTOR =
  '.live-carousel--splitHero, .live-carousel__split-copy, .live-carousel__split-visual, .live-carousel__split-title, .live-carousel__split-body, .live-carousel__split-badge, .live-carousel__split-cta, .live-carousel__split-img';

/**
 * @param {unknown} value
 * @returns {value is { closest: (sel: string) => unknown }}
 */
function isDomLike(value) {
  return Boolean(value && typeof value === 'object' && typeof value.closest === 'function');
}

/**
 * @param {Element} splitHeroRoot
 * @returns {string|null}
 */
export function splitHeroCarouselNodeIdFromDom(splitHeroRoot) {
  if (!isDomLike(splitHeroRoot)) return null;
  const shell = splitHeroRoot.closest('[data-bld-node]');
  const nestedId = shell?.getAttribute('data-bld-node');
  return nestedId ? String(nestedId) : null;
}

/**
 * @param {Event} event
 * @param {string|number} currentNodeId
 * @returns {'nav'|number|string} — `'nav'` = carousel nav only; otherwise node id to select
 */
export function resolveBuilderCanvasSelectTarget(event, currentNodeId) {
  const target = event?.target;
  if (!isDomLike(target)) return currentNodeId;

  if (target.closest(CAROUSEL_NAV_SELECTOR)) {
    return 'nav';
  }

  const splitHero = target.closest(SPLIT_HERO_CONTENT_SELECTOR)?.closest('.live-carousel--splitHero') ||
    target.closest('.live-carousel--splitHero');
  if (splitHero) {
    const nestedId = splitHeroCarouselNodeIdFromDom(splitHero);
    if (nestedId && String(nestedId) !== String(currentNodeId)) {
      return nestedId;
    }
  }

  return currentNodeId;
}

export function isSplitHeroCarouselNode(node) {
  if (!node || node.nodeType !== 'carousel') return false;
  const v = String(node.props?.variant || node.props?.settings?.variant || '')
    .trim()
    .toLowerCase();
  return v === 'splithero';
}
