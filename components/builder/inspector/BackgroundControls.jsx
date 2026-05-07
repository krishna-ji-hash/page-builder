'use client';

export default function BackgroundControls({ form, onUpdate }) {
  return (
    <div className="bld-control-stack">
      <div className="bld-field">
        <label className="bld-label">Background Color</label>
        <input
          type="color"
          className="bld-input"
          value={form.bgColor || '#ffffff'}
          onChange={(e) => onUpdate('bgColor', e.target.value)}
        />
      </div>
    </div>
  );
}

