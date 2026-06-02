/**
 * Anchor + viewport clamp for the floating inline text toolbar (caret / click / block).
 */

/**
 * @param {DOMRect|{ left: number, top: number, right: number, bottom: number, width?: number, height?: number }} rect
 */
function rectCenterX(rect) {
  return rect.left + (rect.width || 0) / 2;
}

/**
 * Reject collapsed carets at (0,0) and other rects that are not near the editable block.
 * @param {{ left: number, top: number, bottom?: number, width?: number, height?: number }} anchorRect
 * @param {{ left: number, top: number, bottom: number, width: number, height: number }|null} [wrapRect]
 */
export function isPlausibleToolbarAnchor(anchorRect, wrapRect = null) {
  if (!anchorRect) return false;
  const { left, top, bottom = top, width = 0, height = 0 } = anchorRect;
  if (!Number.isFinite(left) || !Number.isFinite(top)) return false;
  if (left <= 1 && top <= 1 && width <= 2 && height <= 2) return false;
  if (wrapRect && Number.isFinite(wrapRect.top) && Number.isFinite(wrapRect.bottom)) {
    const slack = 96;
    const anchorMid = top + (bottom - top) / 2;
    const wrapMid = wrapRect.top + wrapRect.height / 2;
    if (anchorMid < wrapRect.top - slack || anchorMid > wrapRect.bottom + slack) {
      if (Math.abs(anchorMid - wrapMid) > wrapRect.height + slack) return false;
    }
  }
  return true;
}

/**
 * @param {{ wrapRef: { current: HTMLElement|null }, clickPoint?: { x: number, y: number }|null }} opts
 * @returns {{ left: number, top: number, bottom: number, width: number, height: number }|null}
 */
export function resolveFloatingToolbarAnchorRect({ wrapRef, clickPoint = null }) {
  if (typeof window === 'undefined') return null;

  const wrap = wrapRef?.current;
  const root =
    wrap?.querySelector?.('[contenteditable="true"], [contenteditable=""]') || wrap;
  const sel = window.getSelection();

  const wrapRect = wrap ? wrap.getBoundingClientRect() : null;

  if (root && sel?.rangeCount) {
    const anchorNode = sel.anchorNode;
    if (anchorNode && root.contains(anchorNode)) {
      const range = sel.getRangeAt(0);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const r = rects[rects.length - 1];
        if (r.width > 0 || r.height > 0) {
          const candidate = { left: r.left, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
          if (isPlausibleToolbarAnchor(candidate, wrapRect)) return candidate;
        }
      }
      const box = range.getBoundingClientRect();
      if (Number.isFinite(box.top) && (box.width > 0 || box.height > 0 || !range.collapsed)) {
        const candidate = {
          left: box.left,
          top: box.top,
          bottom: box.bottom,
          width: box.width,
          height: box.height,
        };
        if (isPlausibleToolbarAnchor(candidate, wrapRect)) return candidate;
      }
      if (range.collapsed && rects.length === 0) {
        const caret = range.getBoundingClientRect();
        if (Number.isFinite(caret.left)) {
          const candidate = {
            left: caret.left,
            top: caret.top,
            bottom: caret.bottom,
            width: Math.max(caret.width, 2),
            height: Math.max(caret.height, 16),
          };
          if (isPlausibleToolbarAnchor(candidate, wrapRect)) return candidate;
        }
      }
    }
  }

  if (
    clickPoint &&
    Number.isFinite(clickPoint.x) &&
    Number.isFinite(clickPoint.y)
  ) {
    return {
      left: clickPoint.x,
      top: clickPoint.y,
      bottom: clickPoint.y,
      width: 0,
      height: 0,
    };
  }

  if (wrapRect && wrapRect.width >= 0) {
    return {
      left: wrapRect.left,
      top: wrapRect.top,
      bottom: wrapRect.bottom,
      width: wrapRect.width,
      height: wrapRect.height,
    };
  }

  return null;
}

/**
 * @param {{ left: number, top: number, bottom: number, width?: number }} anchorRect
 * @param {{ width: number, height: number }} toolbarSize
 * @param {{ margin?: number, gap?: number, vw?: number, vh?: number }} [opts]
 * @returns {{ top: number, left: number, transform: string, placement: 'above'|'below' }}
 */
export function computeFloatingToolbarPosition(
  anchorRect,
  toolbarSize,
  opts = {},
) {
  const margin = opts.margin ?? 8;
  const gap = opts.gap ?? 6;
  const vw = opts.vw ?? (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const vh = opts.vh ?? (typeof window !== 'undefined' ? window.innerHeight : 800);
  const tw = Math.max(120, toolbarSize?.width || 280);
  const th = Math.max(32, toolbarSize?.height || 48);

  const anchorX = rectCenterX(anchorRect);
  const anchorTop = anchorRect.top;
  const anchorBottom = anchorRect.bottom ?? anchorRect.top;

  const spaceAbove = anchorTop - margin;
  const spaceBelow = vh - anchorBottom - margin;
  const placeBelow = spaceAbove < th + gap && spaceBelow > spaceAbove;

  let top;
  let transform;
  if (placeBelow) {
    top = anchorBottom + gap;
    transform = 'translate(-50%, 0)';
  } else {
    top = anchorTop - gap;
    transform = 'translate(-50%, -100%)';
  }

  let left = anchorX;
  const half = tw / 2 + margin;
  left = Math.max(half, Math.min(left, vw - half));

  if (placeBelow) {
    top = Math.min(top, vh - th - margin);
  } else {
    top = Math.max(th + margin, top);
  }

  return {
    top,
    left,
    transform,
    placement: placeBelow ? 'below' : 'above',
  };
}

/**
 * Dock beside (or below) a selected image/logo so controls do not cover the asset.
 * @param {{ left: number, top: number, right?: number, bottom?: number, width?: number, height?: number }} anchorRect
 * @param {{ width: number, height: number }} toolbarSize
 * @param {{ margin?: number, gap?: number, vw?: number, vh?: number, preferBelow?: boolean }} [opts]
 * @returns {{ top: number, left: number, transform: string, placement: 'right'|'left'|'below' }}
 */
export function computeFloatingToolbarBesidePosition(anchorRect, toolbarSize, opts = {}) {
  const margin = opts.margin ?? 8;
  const gap = opts.gap ?? 10;
  const vw = opts.vw ?? (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const vh = opts.vh ?? (typeof window !== 'undefined' ? window.innerHeight : 800);
  const tw = Math.max(160, toolbarSize?.width || 188);
  const th = Math.max(88, toolbarSize?.height || 118);

  const top = anchorRect.top;
  const bottom = anchorRect.bottom ?? top + (anchorRect.height || 0);
  const left = anchorRect.left;
  const right = anchorRect.right ?? left + (anchorRect.width || 0);

  const spaceRight = vw - right - margin;
  const spaceBelow = vh - bottom - margin;
  const preferBelow =
    Boolean(opts.preferBelow) || (spaceRight < tw + gap && spaceBelow >= th + gap);

  if (preferBelow) {
    let belowTop = bottom + gap;
    let belowLeft = left;
    belowLeft = Math.max(margin, Math.min(belowLeft, vw - tw - margin));
    belowTop = Math.min(belowTop, vh - th - margin);
    return {
      top: belowTop,
      left: belowLeft,
      transform: 'none',
      placement: 'below',
    };
  }

  const placeRight = spaceRight >= tw + gap;
  let posTop = top;
  posTop = Math.max(margin, Math.min(posTop, vh - th - margin));

  if (placeRight) {
    return {
      top: posTop,
      left: right + gap,
      transform: 'none',
      placement: 'right',
    };
  }

  return {
    top: posTop,
    left: left - gap,
    transform: 'translate(-100%, 0)',
    placement: 'left',
  };
}
