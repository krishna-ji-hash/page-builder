/**
 * Scroll / click animation triggers: toggles presentation classes only (no layout mutation).
 */

import { scrollTriggerUsesInViewClass } from './nodeInteractionCss.js';
import { bindInteractionParallax } from './interactionParallaxRuntime.js';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Builder canvas scroll container; live site returns null (viewport/window scroll). */
export function resolveScrollRoot(root) {
  const wrap = root?.closest?.('.bld-canvas-wrap');
  if (wrap) return wrap;
  return null;
}

/** Fallback when IO has not fired yet — avoids elements stuck at opacity:0 above the fold. */
function elementVisibleInRoot(el, scrollRoot) {
  if (!el?.getBoundingClientRect) return false;
  const rect = el.getBoundingClientRect();
  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect();
    return rect.bottom > rootRect.top + 2 && rect.top < rootRect.bottom - 2;
  }
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  return rect.bottom > 2 && rect.top < vh - 2;
}

export function bindInteractionScrollObservers(root) {
  if (typeof window === 'undefined' || !root) return () => {};
  if (prefersReducedMotion()) {
    root.querySelectorAll('.live-node--ix-trigger-on-scroll').forEach((el) => {
      el.classList.add('live-node--ix-inview');
    });
    return () => {};
  }

  const observed = new WeakSet();
  const scrollRoot = resolveScrollRoot(root);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('live-node--ix-inview');
        } else if (!el.classList.contains('live-node--ix-once')) {
          el.classList.remove('live-node--ix-inview');
        }
      }
    },
    {
      root: scrollRoot,
      threshold: [0, 0.05, 0.12, 0.25],
      rootMargin: scrollRoot ? '0px 0px 0px 0px' : '0px 0px -4% 0px',
    }
  );

  let scanTimer = null;
  let rafInitial = 0;
  const scan = () => {
    root.querySelectorAll('.live-node--ix-trigger-on-scroll').forEach((el) => {
      if (observed.has(el)) {
        if (elementVisibleInRoot(el, scrollRoot)) el.classList.add('live-node--ix-inview');
        return;
      }
      observed.add(el);
      observer.observe(el);
      const repeat = el.style.getPropertyValue('--node-anim-iteration');
      if (repeat === '1') el.classList.add('live-node--ix-once');
      if (elementVisibleInRoot(el, scrollRoot)) el.classList.add('live-node--ix-inview');
    });
  };
  const scheduleScan = () => {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scan();
    }, 50);
  };

  scan();
  rafInitial = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(scan);
  });

  const mutation = new MutationObserver(scheduleScan);
  mutation.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  const scrollTarget = scrollRoot || window;
  const onScroll = () => scheduleScan();
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    if (scanTimer) clearTimeout(scanTimer);
    if (rafInitial) window.cancelAnimationFrame(rafInitial);
    mutation.disconnect();
    observer.disconnect();
    scrollTarget.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

function bindInteractionClickTriggers(root) {
  if (typeof window === 'undefined' || !root || prefersReducedMotion()) return () => {};

  const onClick = (event) => {
    const target = event.target?.closest?.('.live-node--ix-trigger-on-click');
    if (!target || !root.contains(target)) return;
    target.classList.add('live-node--ix-activated');
  };

  root.addEventListener('click', onClick, true);
  return () => root.removeEventListener('click', onClick, true);
}

/** Builder canvas + live: scroll reveal and click-to-play triggers. */
export function bindInteractionObservers(root) {
  const cleanScroll = bindInteractionScrollObservers(root);
  const cleanClick = bindInteractionClickTriggers(root);
  const cleanParallax = bindInteractionParallax(root);
  return () => {
    cleanScroll();
    cleanClick();
    cleanParallax();
  };
}

export { scrollTriggerUsesInViewClass };
