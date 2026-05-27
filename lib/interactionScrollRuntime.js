/**
 * Scroll-into-view animation trigger: toggles `live-node--ix-inview` on observed nodes.
 */

export function bindInteractionScrollObservers(root) {
  if (typeof window === 'undefined' || !root) return () => {};

  const observed = new WeakSet();

  const scrollRoot = root.closest?.('.bld-canvas-wrap') || null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('live-node--ix-inview');
        } else {
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
  mutation.observe(root, { childList: true, subtree: true });

  return () => {
    if (scanTimer) clearTimeout(scanTimer);
    mutation.disconnect();
    observer.disconnect();
  };
}
