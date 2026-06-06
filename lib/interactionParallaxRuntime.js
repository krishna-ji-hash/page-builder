/**
 * Parallax scroll runtime — passive scroll + rAF, transform via CSS variables only.
 * Shared by builder canvas and published live (.live-doc).
 */

import { computeParallaxTranslate } from './interactionParallax.js';
import { resolveScrollRoot } from './interactionScrollRuntime.js';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readParallaxConfig(el) {
  const speedRaw = el.style.getPropertyValue('--node-parallax-speed').trim();
  const speed = Number(speedRaw);
  const directionClass = [...el.classList].find((c) => c.startsWith('live-node--ix-parallax-'));
  const direction = directionClass?.replace('live-node--ix-parallax-', '') || 'vertical-up';
  if (!Number.isFinite(speed) || speed <= 0) return null;
  return { speed, direction };
}

function parallaxBlockedByEntrance(el) {
  if (!el.classList.contains('live-node--ix-trigger-on-scroll')) return false;
  return !el.classList.contains('live-node--ix-inview');
}

export function bindInteractionParallax(root) {
  if (typeof window === 'undefined' || !root || prefersReducedMotion()) return () => {};

  const scrollRoot = resolveScrollRoot(root);
  const scrollTarget = scrollRoot || window;
  const active = new Set();
  let rafId = 0;
  let pending = false;

  const refreshActive = () => {
    active.clear();
    root.querySelectorAll('.live-node--ix-parallax').forEach((el) => {
      if (readParallaxConfig(el)) active.add(el);
    });
  };

  const applyFrame = () => {
    pending = false;
    if (!active.size) return;
    const viewHeight = scrollRoot ? scrollRoot.clientHeight : window.innerHeight;
    for (const el of active) {
      if (!root.contains(el)) {
        active.delete(el);
        continue;
      }
      const cfg = readParallaxConfig(el);
      if (!cfg) continue;
      if (parallaxBlockedByEntrance(el)) {
        el.style.setProperty('--node-parallax-x', '0px');
        el.style.setProperty('--node-parallax-y', '0px');
        continue;
      }
      const rect = el.getBoundingClientRect();
      const { x, y } = computeParallaxTranslate(rect, viewHeight, cfg);
      el.style.setProperty('--node-parallax-x', `${x.toFixed(2)}px`);
      el.style.setProperty('--node-parallax-y', `${y.toFixed(2)}px`);
    }
  };

  const scheduleFrame = () => {
    if (pending) return;
    pending = true;
    rafId = window.requestAnimationFrame(applyFrame);
  };

  const onScroll = () => scheduleFrame();
  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const observer = new IntersectionObserver(
    () => scheduleFrame(),
    { root: scrollRoot, threshold: [0, 0.12, 0.5, 1] }
  );

  let scanTimer = null;
  const scan = () => {
    refreshActive();
    root.querySelectorAll('.live-node--ix-parallax').forEach((el) => observer.observe(el));
    scheduleFrame();
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
    if (rafId) window.cancelAnimationFrame(rafId);
    mutation.disconnect();
    observer.disconnect();
    scrollTarget.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    root.querySelectorAll('.live-node--ix-parallax').forEach((el) => {
      el.style.removeProperty('--node-parallax-x');
      el.style.removeProperty('--node-parallax-y');
    });
  };
}
