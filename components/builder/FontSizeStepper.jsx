'use client';

export const FONT_SIZE_MIN_PX = 8;
export const FONT_SIZE_MAX_PX = 120;
export const FONT_SIZE_STEP_PX = 2;

export function clampFontSizePx(value, fallback = 16) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(FONT_SIZE_MIN_PX, Math.min(FONT_SIZE_MAX_PX, n));
}

export default function FontSizeStepper({ value, onDelta, className = '', title = 'Font size' }) {
  const px = clampFontSizePx(value);

  return (
    <div className={`bld-font-size-stepper${className ? ` ${className}` : ''}`} role="group" aria-label={title}>
      <button
        type="button"
        className="bld-font-size-stepper__btn"
        title="Decrease font size"
        aria-label="Decrease font size"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onDelta?.(-FONT_SIZE_STEP_PX)}
      >
        −
      </button>
      <span className="bld-font-size-stepper__value" aria-hidden>
        {px}
      </span>
      <button
        type="button"
        className="bld-font-size-stepper__btn"
        title="Increase font size"
        aria-label="Increase font size"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onDelta?.(FONT_SIZE_STEP_PX)}
      >
        +
      </button>
    </div>
  );
}
