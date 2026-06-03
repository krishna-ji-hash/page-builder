'use client';

import FontSizeStepper, { clampFontSizePx } from '@/components/builder/FontSizeStepper';
import TextAlignToolbarGroup from '@/components/builder/TextAlignToolbarGroup';
import InlineRichTextField from '@/components/builder/inspector/InlineRichTextField';
import TextEffectsControls from '@/components/builder/inspector/TextEffectsControls';
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
  const showRichEditor = isRich && (nodeType === 'text' || nodeType === 'paragraph');
  const showTextEffects =
    nodeType === 'text' || nodeType === 'paragraph' || nodeType === 'heading';

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

      {showRichEditor ? (
        <div className="bld-field">
          <label className="bld-label">Rich content</label>
          <InlineRichTextField
            html={form.richTextHtml || ''}
            onChange={onChange}
            placeholder="Select words and use the toolbar, or double-click the canvas"
          />
        </div>
      ) : isRich ? (
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

      {showTextEffects ? <TextEffectsControls form={form} onChange={onChange} /> : null}

      {nodeType === 'button' ? (
        <p className="bld-hint" style={{ marginTop: 8 }}>
          Button label uses plain text above; rich HTML and marquee apply on heading/text blocks.
        </p>
      ) : null}
    </div>
  );
}
