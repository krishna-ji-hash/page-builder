'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

function px(n) {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return x;
}

function readComputedBox(el) {
  if (!el) return null;
  const cs = window.getComputedStyle(el);
  return {
    paddingTop: px(cs.paddingTop?.replace('px', '')),
    paddingRight: px(cs.paddingRight?.replace('px', '')),
    paddingBottom: px(cs.paddingBottom?.replace('px', '')),
    paddingLeft: px(cs.paddingLeft?.replace('px', '')),
    marginTop: px(cs.marginTop?.replace('px', '')),
    marginRight: px(cs.marginRight?.replace('px', '')),
    marginBottom: px(cs.marginBottom?.replace('px', '')),
    marginLeft: px(cs.marginLeft?.replace('px', '')),
  };
}

function lineStyle(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const w = Math.max(1, Math.abs(x2 - x1));
  const h = Math.max(1, Math.abs(y2 - y1));
  return { left, top, width: w, height: h };
}

export default function SpacingGuidesOverlay({ targetElement, edit }) {
  const [rect, setRect] = useState(null);
  const [box, setBox] = useState(null);

  const kind = String(edit?.kind || 'padding');
  const side = String(edit?.side || 'all');

  useEffect(() => {
    if (!targetElement) return undefined;

    const compute = () => {
      const r = targetElement.getBoundingClientRect();
      setRect({
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      });
      setBox(readComputedBox(targetElement));
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(targetElement);
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [targetElement]);

  const guides = useMemo(() => {
    if (!rect || !box) return [];
    const color = kind === 'margin' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(99, 102, 241, 0.95)';
    const items = [];

    const addH = (y, x1, x2, labelX, labelY, label) => {
      items.push({
        key: `${kind}-h-${y}-${x1}-${x2}`,
        style: lineStyle(x1, y, x2, y),
        color,
        label: { x: labelX, y: labelY, text: label },
      });
    };
    const addV = (x, y1, y2, labelX, labelY, label) => {
      items.push({
        key: `${kind}-v-${x}-${y1}-${y2}`,
        style: lineStyle(x, y1, x, y2),
        color,
        label: { x: labelX, y: labelY, text: label },
      });
    };

    const inset = kind === 'padding';
    const t = inset ? box.paddingTop : box.marginTop;
    const r = inset ? box.paddingRight : box.marginRight;
    const b = inset ? box.paddingBottom : box.marginBottom;
    const l = inset ? box.paddingLeft : box.marginLeft;

    if (side === 'all' || side === 'top') {
      const y1 = rect.top;
      const y2 = inset ? rect.top + t : rect.top - t;
      addV(rect.left + rect.width / 2, y1, y2, rect.left + rect.width / 2 + 8, Math.min(y1, y2) + 6, `${Math.round(t)}px`);
    }
    if (side === 'all' || side === 'bottom') {
      const y1 = rect.bottom;
      const y2 = inset ? rect.bottom - b : rect.bottom + b;
      addV(rect.left + rect.width / 2, y1, y2, rect.left + rect.width / 2 + 8, Math.min(y1, y2) + 6, `${Math.round(b)}px`);
    }
    if (side === 'all' || side === 'left') {
      const x1 = rect.left;
      const x2 = inset ? rect.left + l : rect.left - l;
      addH(rect.top + rect.height / 2, x1, x2, Math.min(x1, x2) + 6, rect.top + rect.height / 2 + 8, `${Math.round(l)}px`);
    }
    if (side === 'all' || side === 'right') {
      const x1 = rect.right;
      const x2 = inset ? rect.right - r : rect.right + r;
      addH(rect.top + rect.height / 2, x1, x2, Math.min(x1, x2) + 6, rect.top + rect.height / 2 + 8, `${Math.round(r)}px`);
    }

    return items;
  }, [rect, box, kind, side]);

  if (!rect || !box) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="bld-spacing-guides" aria-hidden>
      <div
        className="bld-spacing-guides__bounds"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }}
      />
      {guides.map((g) => (
        <div key={g.key} className="bld-spacing-guides__item">
          <div className="bld-spacing-guides__line" style={{ ...g.style, background: g.color }} />
          <div className="bld-spacing-guides__label" style={{ left: g.label.x, top: g.label.y }}>
            {g.label.text}
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}

