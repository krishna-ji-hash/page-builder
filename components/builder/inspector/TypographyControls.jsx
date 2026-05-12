'use client';

const FONT_FAMILIES = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Arial', 'Georgia'];
const FONT_WEIGHTS = ['400', '500', '600', '700'];
const WHITE_SPACE_OPTIONS = [
  { value: 'pre-wrap', label: 'pre-wrap — line breaks (Enter / new lines)' },
  { value: 'normal', label: 'normal — flowing paragraph' },
  { value: 'nowrap', label: 'nowrap — no wrap' },
];

export default function TypographyControls({ form, onUpdate, selectedNodeType = '' }) {
  const showWhitespace = selectedNodeType === 'text' || selectedNodeType === 'heading' || selectedNodeType === 'rich_text';

  return (
    <div className="bld-control-stack">
      <div className="bld-field">
        <label className="bld-label">Font Family</label>
        <select className="bld-input" value={form.fontFamily} onChange={(e) => onUpdate('fontFamily', e.target.value)}>
          {FONT_FAMILIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Font Size (px)</label>
          <input className="bld-range" type="range" min="8" max="120" value={form.fontSizePx} onChange={(e) => onUpdate('fontSizePx', e.target.value)} />
          <input className="bld-input" value={form.fontSizePx} onChange={(e) => onUpdate('fontSizePx', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Font Weight</label>
          <select className="bld-input" value={form.fontWeight} onChange={(e) => onUpdate('fontWeight', e.target.value)}>
            {FONT_WEIGHTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Line Height</label>
          <input className="bld-range" type="range" min="1" max="3" step="0.1" value={form.lineHeight} onChange={(e) => onUpdate('lineHeight', e.target.value)} />
          <input className="bld-input" value={form.lineHeight} onChange={(e) => onUpdate('lineHeight', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Letter Spacing (px)</label>
          <input
            className="bld-range"
            type="range"
            min="-5"
            max="20"
            step="1"
            value={form.letterSpacingPx}
            onChange={(e) => onUpdate('letterSpacingPx', e.target.value)}
          />
          <input className="bld-input" value={form.letterSpacingPx} onChange={(e) => onUpdate('letterSpacingPx', e.target.value)} />
        </div>
      </div>
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Text Transform</label>
          <select className="bld-input" value={form.textTransform} onChange={(e) => onUpdate('textTransform', e.target.value)}>
            <option value="none">none</option>
            <option value="uppercase">uppercase</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">capitalize</option>
          </select>
        </div>
        <div className="bld-field">
          <label className="bld-label">Text Decoration</label>
          <select className="bld-input" value={form.textDecoration} onChange={(e) => onUpdate('textDecoration', e.target.value)}>
            <option value="none">none</option>
            <option value="underline">underline</option>
          </select>
        </div>
      </div>
      {showWhitespace ? (
        <div className="bld-field">
          <label className="bld-label">White space / line breaks</label>
          <select
            className="bld-input"
            value={form.whiteSpace || (selectedNodeType === 'text' ? 'pre-wrap' : 'normal')}
            onChange={(e) => onUpdate('whiteSpace', e.target.value)}
          >
            {WHITE_SPACE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="bld-field-note" style={{ marginTop: 6 }}>
            Rich text: use <strong>Enter</strong> or toolbar <strong>¶</strong> for new paragraphs. Padding / margin:{' '}
            <strong>Style → Spacing</strong> (values commit when the field blurs).
          </p>
        </div>
      ) : null}
    </div>
  );
}
