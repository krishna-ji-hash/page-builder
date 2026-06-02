'use client';

import { useLayoutEffect, useRef } from 'react';
import { marqueeTextAlignFromStyle } from '@/lib/marqueeTextStyles';

/**
 * Fixed full-width viewport (blue bar stays put). Only the inner track moves.
 * Center/right alignment anchors scroll to that position.
 */
export default function RichTextMarquee({
  children,
  marquee,
  className = '',
  style,
  direction = 'left',
  textAlign: textAlignProp,
}) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const textAlign = marqueeTextAlignFromStyle(
    textAlignProp ? { textAlign: textAlignProp } : style,
  );
  const alignClass =
    textAlign === 'center'
      ? 'bld-rich-text-marquee--align-center'
      : textAlign === 'right'
        ? 'bld-rich-text-marquee--align-right'
        : '';

  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return undefined;

    const measure = () => {
      const containerW = root.clientWidth;
      if (containerW < 2) return;

      const contentW = Math.max(track.scrollWidth, 1);
      const overflow = Math.max(0, contentW - containerW);
      const gap = Math.max(0, Number(marquee?.gapPx) || 0);
      const isCenter = textAlign === 'center';
      const isRight = textAlign === 'right';

      let start;
      let end;

      if (isCenter) {
        const centerBase = (containerW - contentW) / 2;
        const travel = overflow > 0 ? overflow + gap : 0;
        if (direction === 'right') {
          start = centerBase - travel;
          end = centerBase;
        } else {
          start = centerBase;
          end = centerBase - travel;
        }
      } else if (isRight) {
        const rightBase = containerW - contentW;
        const travel = overflow > 0 ? overflow + gap : 0;
        if (direction === 'right') {
          start = rightBase - travel;
          end = rightBase;
        } else {
          start = rightBase;
          end = rightBase - travel;
        }
      } else {
        const travel = overflow > 0 ? overflow + gap : contentW + gap;
        if (direction === 'right') {
          start = -travel;
          end = 0;
        } else {
          start = 0;
          end = -travel;
        }
      }

      track.style.setProperty('--bld-marquee-start', `${start}px`);
      track.style.setProperty('--bld-marquee-end', `${end}px`);
      track.style.animation = '';
      track.style.transform = '';
    };

    measure();
    const raf = requestAnimationFrame(() => measure());
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    ro.observe(track);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [
    children,
    direction,
    textAlign,
    marquee?.gapPx,
    marquee?.duration,
    marquee?.speed,
  ]);

  return (
    <div
      ref={rootRef}
      className={[className, alignClass, 'bld-rich-text-marquee--scroll'].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="bld-rich-text-marquee-viewport">
        <div ref={trackRef} className="bld-rich-text-marquee-track">
          <div className="bld-rich-text-marquee-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
