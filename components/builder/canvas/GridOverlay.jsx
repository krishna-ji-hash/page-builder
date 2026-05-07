'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export default function GridOverlay({ containerSelector = '.live-doc' }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const el = document.querySelector(containerSelector);
    if (!el) return undefined;

    const compute = () => {
      const r = el.getBoundingClientRect();
      setRect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      });
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [containerSelector]);

  const lines = useMemo(() => {
    if (!rect) return [];
    const out = [];
    const cols = 12;
    const w = Math.max(1, rect.width);
    for (let i = 1; i < cols; i += 1) {
      const x = rect.left + (w * i) / cols;
      out.push({ key: `c${i}`, left: x });
    }
    out.push({ key: 'center', left: rect.left + w / 2, isCenter: true });
    return out;
  }, [rect]);

  if (!rect) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="bld-grid-overlay" aria-hidden>
      <div
        className="bld-grid-overlay__bounds"
        style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      />
      {lines.map((l) => (
        <div
          key={l.key}
          className={`bld-grid-overlay__line${l.isCenter ? ' is-center' : ''}`}
          style={{ left: l.left, top: rect.top, height: rect.height }}
        />
      ))}
    </div>,
    document.body
  );
}

