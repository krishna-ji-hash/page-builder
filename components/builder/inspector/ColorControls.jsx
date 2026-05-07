'use client';

export default function ColorControls({ form, onUpdate, showBackground = true }) {
  return (
    <div className="bld-control-stack">
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Text Color</label>
          <input type="color" className="bld-input" value={form.textColor} onChange={(e) => onUpdate('textColor', e.target.value)} />
        </div>
        {showBackground ? (
          <div className="bld-field">
            <label className="bld-label">Background Color</label>
            <input type="color" className="bld-input" value={form.bgColor} onChange={(e) => onUpdate('bgColor', e.target.value)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
