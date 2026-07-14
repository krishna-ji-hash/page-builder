/** Scroll to a blog section anchor — works in live page and builder canvas. */

const HEADER_SELECTORS = [
  '.live-header-stack > [data-site-header="true"]',
  '.live-header-stack > header.live-node',
  '.live-header-behavior--fixed',
  '.live-header-behavior--revealOnScroll',
  '.live-header-behavior--mainReveal',
  '[data-site-header="true"]',
  'header.live-node[data-site-header="true"]',
];

/**
 * Nested overflow scroller only (builder canvas). Live site uses the window.
 * @param {Element | null | undefined} fromNode
 */
function findScrollParent(fromNode) {
  const scope = fromNode?.closest?.('.bld-canvas__live-mirror, .bld-canvas__page');
  if (!scope) return null;

  let node = fromNode?.parentElement;
  while (node && node !== scope) {
    const style = getComputedStyle(node);
    const scrollableY = /(auto|scroll)/.test(style.overflowY);
    if (scrollableY && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Sticky/fixed header bottom edge in viewport coords.
 */
export function resolveLiveHeaderScrollOffset(fromNode) {
  const doc = fromNode?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  const win = doc?.defaultView;
  if (!doc || !win) return 80;

  let maxBottom = 0;
  const seen = new Set();

  for (const selector of HEADER_SELECTORS) {
    doc.querySelectorAll(selector).forEach((node) => {
      if (!(node instanceof HTMLElement) || seen.has(node)) return;
      seen.add(node);

      const style = win.getComputedStyle(node);
      const position = style.position;
      if (position !== 'fixed' && position !== 'sticky') return;

      const rect = node.getBoundingClientRect();
      if (rect.height < 8) return;
      if (rect.top > 12 || rect.bottom < 20) return;

      maxBottom = Math.max(maxBottom, rect.bottom);
    });
  }

  if (maxBottom > 0) return Math.ceil(maxBottom);

  const header =
    doc.querySelector('[data-site-header="true"]') ||
    doc.querySelector('.live-header-stack > header') ||
    doc.querySelector('header.live-node');
  if (header instanceof HTMLElement) {
    const h = header.getBoundingClientRect().height;
    if (h > 40) return Math.ceil(h);
  }

  return 80;
}

/** Sync measured header height into blog detail CSS variables. */
export function syncBlogDetailHeaderOffsetVars(root) {
  if (!(root instanceof HTMLElement)) return 0;
  const offset = resolveLiveHeaderScrollOffset(root);
  root.style.setProperty('--live-header-offset', `${offset}px`);
  root.style.setProperty('--blog-detail-scroll-offset', `${offset + 20}px`);
  const liveSite = root.closest('.live-site');
  if (liveSite instanceof HTMLElement) {
    liveSite.style.setProperty('--live-header-offset', `${offset}px`);
  }
  return offset;
}

export function blogDetailSectionId(index) {
  return `blog-section-${Number(index)}`;
}

/** Expand truncated article (if needed) then scroll to a heading after paint. */
export const BLOG_DETAIL_GOTO_SECTION_EVENT = 'blog-detail-goto-section';

/**
 * @param {number} index
 * @param {Event | null} [event]
 */
export function requestBlogDetailSection(index, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(BLOG_DETAIL_GOTO_SECTION_EVENT, {
      detail: { index: Number(index) },
    })
  );
}

function resolveSectionHeading(section) {
  if (!(section instanceof HTMLElement)) return null;
  return section.querySelector('h1, h2, h3') || section;
}

function winScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

/**
 * Align section heading just under sticky header. Prefer `auto` after expand.
 * Retries a few frames so layout (Read more) can't leave the heading off-screen.
 * @param {number} index
 * @param {Event | null} [event]
 * @param {{ behavior?: ScrollBehavior }} [opts]
 */
export function scrollToBlogDetailSection(index, event, opts = {}) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const id = blogDetailSectionId(index);
  const gap = 20;
  const behavior = opts.behavior || 'auto';

  const alignOnce = () => {
    const section = document.getElementById(id);
    if (!section || section.hasAttribute('hidden')) return false;
    const heading = resolveSectionHeading(section);
    if (!heading) return false;

    const offset = resolveLiveHeaderScrollOffset(heading);
    const scrollParent = findScrollParent(section);
    const headingRect = heading.getBoundingClientRect();
    const desiredTop = offset + gap;
    const drift = headingRect.top - desiredTop;

    if (Math.abs(drift) < 2) return true;

    if (scrollParent) {
      scrollParent.scrollTo({
        top: Math.max(0, scrollParent.scrollTop + drift),
        behavior,
      });
    } else {
      window.scrollTo({
        top: Math.max(0, winScrollY() + drift),
        behavior,
      });
    }
    return true;
  };

  const ok = alignOnce();
  if (!ok) return false;

  // Settle after sticky header + expanded blocks reflow.
  window.requestAnimationFrame(() => {
    alignOnce();
    window.requestAnimationFrame(() => {
      alignOnce();
      window.setTimeout(alignOnce, 80);
      window.setTimeout(alignOnce, 200);
    });
  });

  if (typeof window !== 'undefined' && window.history?.replaceState) {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', `${base}#${id}`);
  }

  return true;
}

/**
 * Wait until the section exists, then land on its heading.
 * @param {number} index
 * @param {{ attempts?: number, delayMs?: number, behavior?: ScrollBehavior }} [opts]
 */
export function scrollToBlogDetailSectionWhenReady(index, opts = {}) {
  const attempts = Number(opts.attempts) > 0 ? Number(opts.attempts) : 30;
  const delayMs = Number(opts.delayMs) >= 0 ? Number(opts.delayMs) : 20;
  const behavior = opts.behavior || 'auto';
  let left = attempts;

  const tick = () => {
    const el = document.getElementById(blogDetailSectionId(index));
    const heading = resolveSectionHeading(el);
    if (el && heading && !el.hasAttribute('hidden') && heading.getClientRects().length > 0) {
      scrollToBlogDetailSection(index, null, { behavior });
      return;
    }
    left -= 1;
    if (left <= 0) return;
    window.setTimeout(tick, delayMs);
  };

  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(tick));
}

function headingIsMeasurable(heading) {
  if (!(heading instanceof HTMLElement)) return false;
  if (heading.closest('[hidden]')) return false;
  const rect = heading.getBoundingClientRect();
  return rect.height > 0 || rect.width > 0;
}

/**
 * Which content section is currently “active” under the sticky header.
 * Used only when the user has not clicked a TOC item (click pin wins).
 * @param {number} count
 */
export function resolveActiveBlogSectionIndex(count) {
  const total = Number(count) || 0;
  if (total <= 0 || typeof document === 'undefined') return -1;

  const offset = resolveLiveHeaderScrollOffset(document.body) + 28;
  let best = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < total; i += 1) {
    const heading = resolveSectionHeading(document.getElementById(blogDetailSectionId(i)));
    if (!headingIsMeasurable(heading)) continue;
    const top = heading.getBoundingClientRect().top;
    // Heading past the reading line scores highest when closest from above.
    if (top <= offset + 8) {
      const score = top; // closer to offset (larger top) wins among those above the line
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
  }

  if (best >= 0) return best;

  // Nothing crossed the line yet — pick the next heading below.
  let next = -1;
  let nextTop = Infinity;
  for (let i = 0; i < total; i += 1) {
    const heading = resolveSectionHeading(document.getElementById(blogDetailSectionId(i)));
    if (!headingIsMeasurable(heading)) continue;
    const top = heading.getBoundingClientRect().top;
    if (top >= 0 && top < nextTop) {
      nextTop = top;
      next = i;
    }
  }
  return next;
}
