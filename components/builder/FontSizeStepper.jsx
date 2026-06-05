'use client';

import { useEffect, useState } from 'react';

export const FONT_SIZE_MIN_PX = 8;
export const FONT_SIZE_MAX_PX = 120;
export const FONT_SIZE_STEP_PX = 1;

export function clampFontSizePx(value, fallback = 16) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(FONT_SIZE_MIN_PX, Math.min(FONT_SIZE_MAX_PX, n));
}

export default function FontSizeStepper({
  value,
  onDelta,
  onSetPx,
  onBeforeDelta,
  className = '',
  title = 'Font size',
}) {
  const px = clampFontSizePx(value);
  const [draft, setDraft] = useState(String(px));

  useEffect(() => {
    setDraft(String(px));
  }, [px]);

  const handlePointerDown = (event) => {
    onBeforeDelta?.(event);
    event.preventDefault();
  };

  const commitDraft = () => {
    const next = clampFontSizePx(draft, px);
    setDraft(String(next));
    if (next !== px) onSetPx?.(next);
  };

  return (
    <div className={`bld-font-size-stepper${className ? ` ${className}` : ''}`} role="group" aria-label={title}>
      <button
        type="button"
        className="bld-font-size-stepper__btn"
        title="Decrease font size"
        aria-label="Decrease font size"
        onPointerDown={handlePointerDown}
        onClick={() => onDelta?.(-FONT_SIZE_STEP_PX)}
      >
        −
      </button>
      <input
        type="number"
        className="bld-font-size-stepper__input"
        min={FONT_SIZE_MIN_PX}
        max={FONT_SIZE_MAX_PX}
        step={1}
        value={draft}
        title="Font size (px)"
        aria-label="Font size in pixels"
        onPointerDown={handlePointerDown}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') {
            event.preventDefault();
            commitDraft();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(String(px));
            event.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        className="bld-font-size-stepper__btn"
        title="Increase font size"
        aria-label="Increase font size"
        onPointerDown={handlePointerDown}
        onClick={() => onDelta?.(FONT_SIZE_STEP_PX)}
      >
        +
      </button>
    </div>
  );
}
