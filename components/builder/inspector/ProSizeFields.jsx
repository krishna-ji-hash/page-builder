'use client';

import { InspectorField } from './InspectorUi';

export default function ProSizeFields({ form, onUpdate, onResetLayoutKeys, selectedNode, disabled }) {
  const isRow = selectedNode?.nodeType === 'row';
  const resetSize = (keys) => () => onResetLayoutKeys?.(keys);

  return (
    <>
      <div className="bld-field-grid">
        <InspectorField label="Width" keywords="width size" disabled={disabled}>
          {isRow ? (
            <input className="bld-input" value="100%" disabled readOnly />
          ) : (
            <select className="bld-input" value={form.widthMode || 'auto'} disabled={disabled} onChange={(e) => onUpdate('widthMode', e.target.value)}>
              <option value="auto">auto</option>
              <option value="full">100%</option>
              <option value="px">px</option>
            </select>
          )}
        </InspectorField>
        <InspectorField label="Height (px)" keywords="height min max" disabled={disabled}>
          <input
            className="bld-input"
            type="number"
            min="0"
            value={form.heightPx ?? ''}
            placeholder="auto"
            disabled={disabled}
            onChange={(e) => onUpdate('heightPx', e.target.value)}
          />
        </InspectorField>
      </div>

      {form.widthMode === 'px' && !isRow ? (
        <InspectorField label="Width (px)" disabled={disabled}>
          <input className="bld-input" type="number" min="0" value={form.widthPx ?? 0} disabled={disabled} onChange={(e) => onUpdate('widthPx', e.target.value)} />
        </InspectorField>
      ) : null}

      <div className="bld-field-grid">
        <InspectorField label="Min width" keywords="min width" resetKey="minWidth" onReset={resetSize(['minWidth'])} disabled={disabled}>
          <input className="bld-input" value={form.sizeMinWidth ?? ''} disabled={disabled} placeholder="—" onChange={(e) => onUpdate('sizeMinWidth', e.target.value)} />
        </InspectorField>
        <InspectorField label="Max width" keywords="max width" resetKey="maxWidth" onReset={resetSize(['maxWidth'])} disabled={disabled}>
          <input className="bld-input" value={form.sizeMaxWidth ?? ''} disabled={disabled} placeholder="—" onChange={(e) => onUpdate('sizeMaxWidth', e.target.value)} />
        </InspectorField>
        <InspectorField label="Min height" keywords="min height" resetKey="minHeight" onReset={resetSize(['minHeight'])} disabled={disabled}>
          <input className="bld-input" value={form.sizeMinHeight ?? ''} disabled={disabled} placeholder="—" onChange={(e) => onUpdate('sizeMinHeight', e.target.value)} />
        </InspectorField>
        <InspectorField label="Max height" keywords="max height" resetKey="maxHeight" onReset={resetSize(['maxHeight'])} disabled={disabled}>
          <input className="bld-input" value={form.sizeMaxHeight ?? ''} disabled={disabled} placeholder="—" onChange={(e) => onUpdate('sizeMaxHeight', e.target.value)} />
        </InspectorField>
      </div>
    </>
  );
}
