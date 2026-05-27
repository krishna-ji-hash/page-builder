'use client';

function safeHexForColorInput(value, fallback = '#000000') {
  const s = String(value ?? '').trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return s;
  return fallback;
}

export default function ColorControls({ form, onUpdate, showBackground = true }) {
  const textHex = safeHexForColorInput(form.textColor, '#0f172a');
  const bgHex = safeHexForColorInput(form.bgColor, '#ffffff');

  return (
    <div className="bld-control-stack">
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Text Color</label>
          <input type="color" className="bld-input" value={textHex} onChange={(e) => onUpdate('textColor', e.target.value)} />
        </div>
        {showBackground ? (
          <div className="bld-field">
            <label className="bld-label">Background Color</label>
            <input type="color" className="bld-input" value={bgHex} onChange={(e) => onUpdate('bgColor', e.target.value)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
