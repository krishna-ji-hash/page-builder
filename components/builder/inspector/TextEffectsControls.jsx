'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

const ICON_PRESETS = ['🚚', '📦', '☎', '⚡', '✓', '★'];

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="bld-check-row">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/**
 * Icon + marquee controls for text / paragraph / rich_text / heading announcement copy.
 */
export default function TextEffectsControls({ form, onChange }) {
  const marqueeOn = Boolean(form.marqueeEnabled);
  const iconOn = Boolean(form.textBlockIconEnabled);

  return (
    <>
      <div className="bld-panel__subhead" style={{ marginTop: 12 }}>
        Icon
      </div>
      <ToggleRow label="Enable icon" checked={iconOn} onChange={(v) => onChange('textBlockIconEnabled', v)} />
      {iconOn ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Icon symbol</label>
            <input
              className="bld-input"
              value={form.textBlockIconName || '★'}
              onChange={(e) => onChange('textBlockIconName', e.target.value)}
              placeholder="e.g. 🚚 or ☎"
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Quick icons</label>
            <div className="bld-layout-mini-panel__row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {ICON_PRESETS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  className={`bld-layout-mini-btn ${form.textBlockIconName === sym ? 'is-active' : ''}`}
                  onClick={() => onChange('textBlockIconName', sym)}
                  title={`Use ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
          <div className="bld-field">
            <label className="bld-label">Position</label>
            <select
              className="bld-input"
              value={form.textBlockIconPosition || 'before'}
              onChange={(e) => onChange('textBlockIconPosition', e.target.value)}
            >
              <option value="before">Before text</option>
              <option value="after">After text</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Icon color</label>
            <input
              type="color"
              className="bld-input"
              value={form.textBlockIconColor || '#2563eb'}
              onChange={(e) => onChange('textBlockIconColor', e.target.value)}
            />
          </div>
          <InspectorNumField
            id="text-icon-size"
            label="Icon size (px)"
            min={10}
            max={96}
            value={form.textBlockIconSize ?? 16}
            onChange={inspectorNumStringChange(onChange, 'textBlockIconSize')}
          />
          <InspectorNumField
            id="text-icon-spacing"
            label="Spacing (px)"
            min={0}
            max={64}
            value={form.textBlockIconSpacing ?? 8}
            onChange={inspectorNumStringChange(onChange, 'textBlockIconSpacing')}
          />
        </>
      ) : null}

      <div className="bld-panel__subhead" style={{ marginTop: 12 }}>
        Marquee
      </div>
      <ToggleRow label="Enable marquee" checked={marqueeOn} onChange={(v) => onChange('marqueeEnabled', v)} />
      {marqueeOn ? (
        <>
          <p className="bld-hint" style={{ marginBottom: 8 }}>
            CSS scroll (no HTML marquee tag). Works with rich text and header promo strips.
          </p>
          <div className="bld-field">
            <label className="bld-label">Direction</label>
            <select
              className="bld-input"
              value={form.marqueeDirection || 'left'}
              onChange={(e) => onChange('marqueeDirection', e.target.value)}
            >
              <option value="left">Scroll left</option>
              <option value="right">Scroll right</option>
            </select>
          </div>
          <InspectorNumField
            id="marquee-duration"
            label="Duration (seconds)"
            min={4}
            max={120}
            value={form.marqueeDuration ?? 18}
            onChange={inspectorNumStringChange(onChange, 'marqueeDuration')}
          />
          <InspectorNumField
            id="marquee-gap"
            label="Gap / spacing (px)"
            min={0}
            max={240}
            value={form.marqueeGapPx ?? 40}
            onChange={inspectorNumStringChange(onChange, 'marqueeGapPx')}
          />
          <ToggleRow
            label="Pause on hover"
            checked={form.marqueePauseOnHover !== false}
            onChange={(v) => onChange('marqueePauseOnHover', v)}
          />
          <ToggleRow
            label="Enable on mobile"
            checked={form.marqueeMobileEnabled !== false}
            onChange={(v) => onChange('marqueeMobileEnabled', v)}
          />
        </>
      ) : null}
    </>
  );
}
