'use client';

import { useEffect, useState } from 'react';
import { STACK_ACCENT_DEFAULTS } from '@/lib/stackAccentLine';
import { InspectorNumField } from '@/components/builder/inspector/InspectorNumeric';
import { InspectorSection } from '@/components/builder/inspector/InspectorUi';

export default function LineToolsPanel({
  onInsertHorizontal,
  onApplyVerticalAccent,
  onRemoveVerticalAccent,
  accentLine = null,
  disabled = false,
  busy = false,
  hint = '',
}) {
  const [color, setColor] = useState(STACK_ACCENT_DEFAULTS.color);
  const [thicknessPx, setThicknessPx] = useState(STACK_ACCENT_DEFAULTS.thicknessPx);
  const [gapPx, setGapPx] = useState(STACK_ACCENT_DEFAULTS.gapPx);

  useEffect(() => {
    if (!accentLine) return;
    setColor(accentLine.color || STACK_ACCENT_DEFAULTS.color);
    setThicknessPx(accentLine.thicknessPx ?? STACK_ACCENT_DEFAULTS.thicknessPx);
    setGapPx(accentLine.gapPx ?? STACK_ACCENT_DEFAULTS.gapPx);
  }, [accentLine?.color, accentLine?.thicknessPx, accentLine?.gapPx]);

  const accentOptions = () => ({
    color,
    thicknessPx: Number(thicknessPx) || STACK_ACCENT_DEFAULTS.thicknessPx,
    gapPx: Number(gapPx) || STACK_ACCENT_DEFAULTS.gapPx,
    side: 'left',
  });

  return (
    <div className="bld-line-tools" role="group" aria-label="Line tools">
      <InspectorSection title="Lines" defaultOpen={false} keywords="horizontal h line divider">
        <div className="bld-line-tools__row">
          <button
            type="button"
            className="bld-line-tools__btn"
            disabled={disabled || busy}
            onClick={() => onInsertHorizontal?.('inside')}
            title="Add horizontal line inside the selected stack"
          >
            <span className="bld-line-tools__icon" aria-hidden>
              ―
            </span>
            H Line
          </button>
        </div>
      </InspectorSection>

      <InspectorSection
        title="V Line — card accent"
        defaultOpen={false}
        keywords="vertical accent bar card border color thickness gap"
      >
        <p className="bld-line-tools__desc">
          Full-height blue bar on the left of heading + paragraphs (like a card border).
        </p>
        <div className="bld-line-tools__fields">
          <div className="bld-field">
            <label className="bld-label">Accent color</label>
            <input
              type="color"
              className="bld-input"
              value={color}
              disabled={disabled || busy}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <InspectorNumField
            id="accent-thickness"
            label="Thickness (px)"
            min={1}
            max={16}
            value={thicknessPx}
            disabled={disabled || busy}
            onChange={(n) => setThicknessPx(n ?? STACK_ACCENT_DEFAULTS.thicknessPx)}
          />
          <InspectorNumField
            id="accent-gap"
            label="Gap from text (px)"
            min={0}
            max={64}
            value={gapPx}
            disabled={disabled || busy}
            onChange={(n) => setGapPx(n ?? STACK_ACCENT_DEFAULTS.gapPx)}
          />
        </div>
        <div className="bld-line-tools__actions">
          <button
            type="button"
            className="bld-line-tools__btn bld-line-tools__btn--accent"
            disabled={disabled || busy}
            onClick={() => onApplyVerticalAccent?.(accentOptions())}
            title="Apply left accent on the content stack"
          >
            <span className="bld-line-tools__icon" aria-hidden>
              |
            </span>
            {accentLine ? 'Update V Line' : 'Add V Line'}
          </button>
          {accentLine ? (
            <button
              type="button"
              className="bld-line-tools__btn bld-line-tools__btn--ghost"
              disabled={disabled || busy}
              onClick={() => onRemoveVerticalAccent?.()}
            >
              Remove
            </button>
          ) : null}
        </div>
      </InspectorSection>

      {hint ? <p className="bld-line-tools__hint">{hint}</p> : null}
    </div>
  );
}
