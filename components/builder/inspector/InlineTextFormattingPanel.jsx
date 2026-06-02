'use client';

import FontSizeStepper, { clampFontSizePx } from '@/components/builder/FontSizeStepper';
import TextAlignToolbarGroup from '@/components/builder/TextAlignToolbarGroup';
import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

const FONT_WEIGHTS = ['400', '500', '600', '700'];
const SIZE_PRESETS = [
  { label: 'XS', px: 11 },
  { label: 'S', px: 13 },
  { label: 'M', px: 15 },
  { label: 'L', px: 17 },
  { label: 'XL', px: 20 },
  { label: '2XL', px: 24 },
  { label: '3XL', px: 30 },
];

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="bld-check-row">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/**
 * Rich text mode, typography, marquee, and block icon controls for heading/text.
 */
export default function InlineTextFormattingPanel({ form, onChange, nodeType }) {
  const isRich = form.inlineTextMode === 'rich';
  const marqueeOn = Boolean(form.marqueeEnabled);
  const iconOn = Boolean(form.textBlockIconEnabled);

  return (
    <div className="bld-inline-text-format">
      <div className="bld-panel__subhead">Text size & style</div>
      <div className="bld-field">
        <label className="bld-label">Base font size (px)</label>
        <FontSizeStepper
          value={form.fontSizePx ?? 16}
          onDelta={(delta) => {
            const next = clampFontSizePx(Number(form.fontSizePx || 16) + delta);
            onChange('fontSizePx', String(next));
          }}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Quick sizes</label>
        <div className="bld-layout-mini-panel__row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {SIZE_PRESETS.map(({ label, px }) => (
            <button
              key={px}
              type="button"
              className={`bld-layout-mini-btn ${Number(form.fontSizePx) === px ? 'is-active' : ''}`}
              onClick={() => onChange('fontSizePx', String(px))}
            >
              {label} {px}
            </button>
          ))}
        </div>
        <p className="bld-hint" style={{ marginTop: 6 }}>
          Alag words alag size: <strong>Rich text</strong> + canvas par double-click → word select → toolbar size
          +/- .
        </p>
      </div>
      <div className="bld-field">
        <label className="bld-label">Alignment</label>
        <TextAlignToolbarGroup
          variant="inspector"
          value={form.alignment || form.textAlign || 'left'}
          onChange={(side) => onChange('alignment', side)}
        />
      </div>
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Weight</label>
          <select className="bld-input" value={form.fontWeight || '400'} onChange={(e) => onChange('fontWeight', e.target.value)}>
            {FONT_WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
        <div className="bld-field">
          <label className="bld-label">Text color</label>
          <input
            type="color"
            className="bld-input"
            value={form.textColor || '#0f172a'}
            onChange={(e) => onChange('textColor', e.target.value)}
          />
        </div>
      </div>
      <InspectorNumField
        id="inline-letter-spacing"
        label="Letter spacing (px)"
        min={-4}
        max={24}
        value={form.letterSpacingPx ?? 0}
        onChange={inspectorNumStringChange(onChange, 'letterSpacingPx')}
      />
      <div className="bld-field">
        <label className="bld-label">Line height</label>
        <input
          className="bld-range"
          type="range"
          min="1"
          max="2.5"
          step="0.05"
          value={form.lineHeight ?? 1.4}
          onChange={(e) => onChange('lineHeight', e.target.value)}
        />
      </div>

      <div className="bld-field" style={{ marginTop: 8 }}>
        <label className="bld-label">Text mode</label>
        <select
          className="bld-input"
          value={form.inlineTextMode || 'plain'}
          onChange={(e) => onChange('inlineTextMode', e.target.value)}
        >
          <option value="plain">Plain text</option>
          <option value="rich">Rich text</option>
        </select>
      </div>

      {isRich ? (
        <div className="bld-field">
          <label className="bld-label">Rich HTML</label>
          <textarea
            className="bld-input bld-textarea"
            rows={5}
            value={form.richTextHtml || ''}
            onChange={(e) => onChange('richTextHtml', e.target.value)}
            placeholder="Bold, color, links — or use canvas toolbar on selected words"
          />
        </div>
      ) : null}

      <div className="bld-panel__subhead" style={{ marginTop: 12 }}>
        Marquee / scroll
      </div>
      <ToggleRow label="Enable marquee" checked={marqueeOn} onChange={(v) => onChange('marqueeEnabled', v)} />
      {marqueeOn ? (
        <p className="bld-hint" style={{ marginBottom: 8 }}>
          Background blue band → parent <strong>Row</strong> (Style → Background). Marquee runs at any quick size (XS–3XL).
        </p>
      ) : null}
      {marqueeOn ? (
        <>
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
          <div className="bld-field">
            <label className="bld-label">Speed</label>
            <select
              className="bld-input"
              value={form.marqueeSpeed || 'normal'}
              onChange={(e) => onChange('marqueeSpeed', e.target.value)}
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
              <option value="custom">Custom (seconds)</option>
            </select>
          </div>
          {form.marqueeSpeed === 'custom' ? (
            <InspectorNumField
              id="marquee-duration"
              label="Duration (seconds)"
              min={4}
              max={120}
              value={form.marqueeDuration ?? 18}
              onChange={inspectorNumStringChange(onChange, 'marqueeDuration')}
            />
          ) : null}
          <InspectorNumField
            id="marquee-gap"
            label="Gap after text (px)"
            min={0}
            max={240}
            value={form.marqueeGapPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'marqueeGapPx')}
          />
          <p className="bld-hint" style={{ marginTop: 4, marginBottom: 8 }}>
            Works at any font size (XS–3XL or custom px). Toggle marquee off to center static text.
          </p>
          <ToggleRow
            label="Pause on hover"
            checked={form.marqueePauseOnHover !== false}
            onChange={(v) => onChange('marqueePauseOnHover', v)}
          />
          <ToggleRow label="Loop" checked={form.marqueeLoop !== false} onChange={(v) => onChange('marqueeLoop', v)} />
          <ToggleRow
            label="Enable on mobile"
            checked={form.marqueeMobileEnabled !== false}
            onChange={(v) => onChange('marqueeMobileEnabled', v)}
          />
        </>
      ) : null}

      <div className="bld-panel__subhead" style={{ marginTop: 12 }}>
        Icon
      </div>
      <ToggleRow label="Show icon" checked={iconOn} onChange={(v) => onChange('textBlockIconEnabled', v)} />
      {iconOn ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Icon symbol</label>
            <input
              className="bld-input"
              value={form.textBlockIconName || '★'}
              onChange={(e) => onChange('textBlockIconName', e.target.value)}
            />
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

      {nodeType === 'button' ? (
        <p className="bld-hint" style={{ marginTop: 8 }}>
          Button label uses plain text above; rich HTML and marquee apply on heading/text blocks.
        </p>
      ) : null}
    </div>
  );
}
