/**
 * Parallax config for style_json.interactions.parallax (transform-only, no layout).
 */

export const PARALLAX_DIRECTIONS = Object.freeze([
  { id: 'vertical-up', label: 'Vertical up' },
  { id: 'vertical-down', label: 'Vertical down' },
  { id: 'horizontal-left', label: 'Horizontal left' },
  { id: 'horizontal-right', label: 'Horizontal right' },
]);

export const PARALLAX_NODE_TYPES = new Set(['row', 'column', 'stack', 'image']);

const DIRECTION_IDS = new Set(PARALLAX_DIRECTIONS.map((d) => d.id));

/** @param {string} nodeType */
export function nodeSupportsParallax(nodeType) {
  return PARALLAX_NODE_TYPES.has(String(nodeType || '').trim());
}

export function normalizeParallaxDirection(direction) {
  const raw = String(direction || 'vertical-up').trim();
  return DIRECTION_IDS.has(raw) ? raw : 'vertical-up';
}

export function normalizeParallaxSpeed(speed) {
  const n = Number(speed);
  if (!Number.isFinite(n)) return 0.35;
  return Math.min(1, Math.max(0.05, Math.round(n * 100) / 100));
}

/** @returns {{ enabled: true, speed: number, direction: string } | null} */
export function cleanParallax(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.enabled !== true) return null;
  return {
    enabled: true,
    speed: normalizeParallaxSpeed(raw.speed),
    direction: normalizeParallaxDirection(raw.direction),
  };
}

export function parallaxPresentationClass(parallax) {
  const cfg = cleanParallax(parallax);
  if (!cfg) return '';
  const dir = cfg.direction.replace(/[^a-z0-9-]/gi, '');
  return `live-node--ix-parallax live-node--ix-parallax-${dir}`;
}

export function parallaxInlineStyleVars(parallax) {
  const cfg = cleanParallax(parallax);
  if (!cfg) return {};
  return {
    '--node-parallax-speed': String(cfg.speed),
    '--node-parallax-x': '0px',
    '--node-parallax-y': '0px',
  };
}

/**
 * Compute translate offset from viewport position (transform-only, no reads that force layout beyond getBoundingClientRect in rAF).
 * @param {DOMRect} rect
 * @param {number} viewHeight
 * @param {{ speed: number, direction: string }} cfg
 */
export function computeParallaxTranslate(rect, viewHeight, cfg) {
  const vh = Math.max(viewHeight, 1);
  const centerY = rect.top + rect.height / 2;
  const delta = (centerY - vh / 2) / vh;
  const magnitude = delta * cfg.speed * 72;

  switch (cfg.direction) {
    case 'vertical-down':
      return { x: 0, y: magnitude };
    case 'horizontal-left':
      return { x: -magnitude, y: 0 };
    case 'horizontal-right':
      return { x: magnitude, y: 0 };
    case 'vertical-up':
    default:
      return { x: 0, y: -magnitude };
  }
}
