'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';
import { InspectorSection } from '@/components/builder/inspector/InspectorUi';

export default function ColumnHeadingControls({ form, onChange }) {
  return (
    <InspectorSection title="Column / stack heading" defaultOpen keywords="heading description column stack">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Renders above widgets in this column or stack. Use Section title for the whole row.
      </p>
      <label className="bld-check" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={Boolean(form.columnHeadingEnabled)}
          onChange={(e) => onChange('columnHeadingEnabled', e.target.checked)}
        />
        <span>Enable column heading</span>
      </label>
      <div className="bld-field">
        <label className="bld-label">Heading</label>
        <input
          className="bld-input"
          value={form.columnHeadingHeading || ''}
          onChange={(e) => onChange('columnHeadingHeading', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Description</label>
        <textarea
          className="bld-input"
          rows={3}
          value={form.columnHeadingDescription || ''}
          onChange={(e) => onChange('columnHeadingDescription', e.target.value)}
        />
      </div>
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Alignment</label>
          <select
            className="bld-input"
            value={form.columnHeadingAlign || 'left'}
            onChange={(e) => onChange('columnHeadingAlign', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <InspectorNumField
          id="column-heading-spacing"
          label="Spacing below (px)"
          min={0}
          max={120}
          value={form.columnHeadingSpacingBottom ?? 20}
          onChange={inspectorNumStringChange(onChange, 'columnHeadingSpacingBottom')}
        />
      </div>
      <button type="button" className="bld-chip" onClick={() => onChange('columnHeadingReset', '1')}>
        Reset column heading
      </button>
    </InspectorSection>
  );
}
