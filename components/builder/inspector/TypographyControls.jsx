'use client';

const FONT_FAMILIES = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Arial', 'Georgia'];
const FONT_WEIGHTS = ['400', '500', '600', '700'];

export default function TypographyControls({ form, onUpdate }) {
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
    </div>
  );
}
