'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

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
        <InspectorNumField
          id="size-height-px"
          label="Height (px)"
          min={0}
          max={9999}
          value={form.heightPx ?? ''}
          placeholder="0 = auto"
          onChange={inspectorNumStringChange(onUpdate, 'heightPx')}
        />
      </div>

      {form.widthMode === 'px' && !isRow ? (
        <InspectorNumField
          id="size-width-px"
          label="Width (px)"
          min={0}
          max={9999}
          value={form.widthPx ?? 0}
          onChange={inspectorNumStringChange(onUpdate, 'widthPx')}
        />
      ) : null}

      {(isColumn || isStack) && Number(form.heightPx) > 0 ? (
        <p className="bld-field-note">
          Fixed height on {isColumn ? 'columns' : 'stacks'} can clip content — prefer padding on the parent section.
        </p>
      ) : null}
    </div>
  );
}
