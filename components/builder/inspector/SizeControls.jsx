'use client';

export default function SizeControls({ selectedNode, form, onUpdate }) {
  const isRow = selectedNode?.nodeType === 'row';
  const isColumn = selectedNode?.nodeType === 'column';
  const isStack = selectedNode?.nodeType === 'stack';

  return (
    <div className="bld-control-stack">
      {isRow ? (
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          <strong>Bottom gap?</strong> Use <strong>Spacing → Padding → Bottom</strong> (not Height). Height sets a fixed
          section minimum; padding adds space inside the blue band.
        </p>
      ) : null}

      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Width</label>
          {isRow ? (
            <input className="bld-input" value="100%" disabled readOnly title="Root sections span full width" />
          ) : (
            <select
              className="bld-input"
              value={form.widthMode || 'auto'}
              onChange={(e) => onUpdate('widthMode', e.target.value)}
            >
              <option value="auto">auto</option>
              <option value="full">100%</option>
              <option value="px">px</option>
            </select>
          )}
        </div>
        <div className="bld-field">
          <label className="bld-label">Height (px)</label>
          <input
            className="bld-input"
            type="number"
            min="0"
            step="1"
            value={form.heightPx ?? ''}
            placeholder="0 = auto"
            onChange={(e) => onUpdate('heightPx', e.target.value)}
          />
        </div>
      </div>

      {form.widthMode === 'px' && !isRow ? (
        <div className="bld-field">
          <label className="bld-label">Width (px)</label>
          <input
            className="bld-input"
            type="number"
            min="0"
            value={form.widthPx ?? 0}
            onChange={(e) => onUpdate('widthPx', e.target.value)}
          />
        </div>
      ) : null}

      {(isColumn || isStack) && Number(form.heightPx) > 0 ? (
        <p className="bld-field-note">
          Fixed height on {isColumn ? 'columns' : 'stacks'} can clip content — prefer padding on the parent section.
        </p>
      ) : null}
    </div>
  );
}
