/**
 * Client scroll listener for header reveal / shadow / shrink behaviors.
 * Safe for builder mirror + published live (passive listener, no hydration writes).
 */

function parseRevealAfter(el) {
  const raw = el.getAttribute('data-header-reveal-after');
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 120;
}

function syncHeaderScrollState(siteEl, scrollY) {
  const headers = siteEl.querySelectorAll(
    '[data-site-header="true"][data-header-behavior-type]:not([data-header-behavior-type="normal"])'
  );
  headers.forEach((el) => {
    const type = String(el.getAttribute('data-header-behavior-type') || '').toLowerCase();
    const revealAfter = parseRevealAfter(el);
    const scrolled = scrollY > revealAfter;
    const atTop = scrollY <= 4;

    el.classList.toggle('is-header-scrolled', scrolled);
    el.classList.toggle('is-header-at-top', atTop);

    const role = String(el.getAttribute('data-header-behavior-role') || '').toLowerCase();

    if (type === 'revealonscroll' || (type === 'mainreveal' && role === 'reveal')) {
      el.classList.toggle('is-header-reveal-visible', scrolled);
    }

    if (type === 'mainreveal' && role === 'main') {
      el.classList.toggle('is-header-main-hidden', scrolled);
    }

    if (type === 'mainreveal' && !role) {
      el.classList.toggle('is-header-reveal-visible', scrolled);
    }
  });
}

/**
 * @param {HTMLElement} root — .live-doc or .live-site
 * @returns {() => void}
 */
export function bindHeaderBehaviorScroll(root) {
  if (!root || typeof window === 'undefined') return () => {};
  const siteEl = root.classList?.contains('live-site') ? root : root.closest('.live-site') || root;
  let raf = 0;

  const tick = () => {
    raf = 0;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    syncHeaderScrollState(siteEl, y);
  };

  const onScroll = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(tick);
  };

  tick();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    if (raf) window.cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
  };
}
