/**
 * Scroll / click animation triggers: toggles presentation classes only (no layout mutation).
 */

import { scrollTriggerUsesInViewClass } from './nodeInteractionCss.js';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  const scrollRoot = root.closest?.('.bld-canvas-wrap') || null;
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
      threshold: 0.12,
      rootMargin: scrollRoot ? '0px 0px -4% 0px' : '0px 0px -6% 0px',
    }
  );

  let scanTimer = null;
  const scan = () => {
    root.querySelectorAll('.live-node--ix-trigger-on-scroll').forEach((el) => {
      if (observed.has(el)) return;
      observed.add(el);
      observer.observe(el);
      const repeat = el.style.getPropertyValue('--node-anim-iteration');
      if (repeat === '1') el.classList.add('live-node--ix-once');
    });
  };
  const scheduleScan = () => {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scan();
    }, 80);
  };

  scan();
  const mutation = new MutationObserver(scheduleScan);
  mutation.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  return () => {
    if (scanTimer) clearTimeout(scanTimer);
    mutation.disconnect();
    observer.disconnect();
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

/**
 * Builder canvas + live: scroll reveal and click-to-play triggers.
 */
export function bindInteractionObservers(root) {
  const cleanScroll = bindInteractionScrollObservers(root);
  const cleanClick = bindInteractionClickTriggers(root);
  return () => {
    cleanScroll();
    cleanClick();
  };
}

export { scrollTriggerUsesInViewClass };
