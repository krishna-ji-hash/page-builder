'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';
import { InspectorSection } from '@/components/builder/inspector/InspectorUi';
import { FONT_WEIGHT_OPTIONS } from '@/components/builder/inspector/TypographyControls';

export default function SectionHeadingControls({ form, onChange }) {
  return (
    <InspectorSection title="Section title block" defaultOpen keywords="heading eyebrow description section">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Renders above this section&apos;s columns on canvas and live site. Does not replace widgets inside the
        section.
      </p>
      <label className="bld-check" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={Boolean(form.sectionHeadingEnabled)}
          onChange={(e) => onChange('sectionHeadingEnabled', e.target.checked)}
        />
        <span>Enable section heading</span>
      </label>
      <div className="bld-field">
        <label className="bld-label">Eyebrow</label>
        <input
          className="bld-input"
          value={form.sectionHeadingEyebrow || ''}
          onChange={(e) => onChange('sectionHeadingEyebrow', e.target.value)}
          placeholder="Optional label above title"
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Main heading</label>
        <input
          className="bld-input"
          value={form.sectionHeadingHeading || ''}
          onChange={(e) => onChange('sectionHeadingHeading', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Description</label>
        <textarea
          className="bld-input"
          rows={3}
          value={form.sectionHeadingDescription || ''}
          onChange={(e) => onChange('sectionHeadingDescription', e.target.value)}
        />
      </div>
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Alignment</label>
          <select
            className="bld-input"
            value={form.sectionHeadingAlign || 'center'}
            onChange={(e) => onChange('sectionHeadingAlign', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="bld-field">
          <label className="bld-label">Heading tag</label>
          <select
            className="bld-input"
            value={form.sectionHeadingTag || 'h2'}
            onChange={(e) => onChange('sectionHeadingTag', e.target.value)}
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
        </div>
        <InspectorNumField
          id="section-heading-max-w"
          label="Max width (px)"
          min={240}
          max={1400}
          value={form.sectionHeadingMaxWidth ?? 760}
          onChange={inspectorNumStringChange(onChange, 'sectionHeadingMaxWidth')}
        />
        <InspectorNumField
          id="section-heading-spacing"
          label="Spacing below (px)"
          min={0}
          max={120}
          value={form.sectionHeadingSpacingBottom ?? 32}
          onChange={inspectorNumStringChange(onChange, 'sectionHeadingSpacingBottom')}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label" htmlFor="section-heading-font-weight">
          Title font weight
        </label>
        <select
          id="section-heading-font-weight"
          className="bld-input"
          value={String(form.sectionHeadingFontWeight || '800')}
          onChange={(e) => onChange('sectionHeadingFontWeight', e.target.value)}
        >
          {FONT_WEIGHT_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="bld-chip" onClick={() => onChange('sectionHeadingReset', '1')}>
        Reset section heading
      </button>
    </InspectorSection>
  );
}
