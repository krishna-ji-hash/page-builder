'use client';

import InspectorColorInput from '@/components/builder/inspector/InspectorColorInput';

export default function ColorControls({ form, onUpdate, showBackground = true }) {
  return (
    <div className="bld-control-stack">
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Text Color</label>
          <InspectorColorInput value={form.textColor} fallback="#0f172a" onChange={(hex) => onUpdate('textColor', hex)} />
        </div>
        {showBackground ? (
          <div className="bld-field">
            <label className="bld-label">Background Color</label>
            <InspectorColorInput value={form.bgColor} fallback="#ffffff" onChange={(hex) => onUpdate('bgColor', hex)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
