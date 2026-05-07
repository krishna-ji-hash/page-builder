'use client';

export default function SizeControls({ selectedNode, form, onUpdate }) {
  return (
    <div className="bld-control-stack">
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Width</label>
          <select className="bld-input" value={form.widthMode || 'auto'} onChange={(e) => onUpdate('widthMode', e.target.value)}>
            <option value="auto">auto</option>
            <option value="full">100%</option>
            <option value="px">px</option>
          </select>
        </div>
        {form.widthMode === 'px' ? (
          <div className="bld-field">
            <label className="bld-label">Width px</label>
            <input className="bld-input" type="number" min="0" value={form.widthPx ?? 0} onChange={(e) => onUpdate('widthPx', e.target.value)} />
          </div>
        ) : (
          <div className="bld-field">
            <label className="bld-label">Height px</label>
            <input className="bld-input" type="number" min="0" value={form.heightPx ?? 0} onChange={(e) => onUpdate('heightPx', e.target.value)} />
          </div>
        )}
      </div>
      {form.widthMode === 'px' ? (
        <div className="bld-field">
          <label className="bld-label">Height px</label>
          <input className="bld-input" type="number" min="0" value={form.heightPx ?? 0} onChange={(e) => onUpdate('heightPx', e.target.value)} />
        </div>
      ) : null}
    </div>
  );
}

