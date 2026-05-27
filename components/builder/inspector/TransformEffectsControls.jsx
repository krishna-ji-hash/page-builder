'use client';

import { InspectorField, InspectorSection } from './InspectorUi';

export default function TransformEffectsControls({ form, onUpdate, disabled }) {
  return (
    <InspectorSection title="Transform & filters" keywords="rotate scale skew blur brightness">
      <div className="bld-field-grid">
        <InspectorField label="Rotate (deg)" disabled={disabled}>
          <input
            className="bld-input"
            type="number"
            value={form.transformRotate ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate('transformRotate', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Scale" disabled={disabled}>
          <input
            className="bld-input"
            value={form.transformScale ?? ''}
            disabled={disabled}
            placeholder="1"
            onChange={(e) => onUpdate('transformScale', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Translate X" disabled={disabled}>
          <input
            className="bld-input"
            value={form.transformTranslateX ?? ''}
            disabled={disabled}
            placeholder="0px"
            onChange={(e) => onUpdate('transformTranslateX', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Translate Y" disabled={disabled}>
          <input
            className="bld-input"
            value={form.transformTranslateY ?? ''}
            disabled={disabled}
            placeholder="0px"
            onChange={(e) => onUpdate('transformTranslateY', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Skew X" disabled={disabled}>
          <input
            className="bld-input"
            value={form.transformSkewX ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate('transformSkewX', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Skew Y" disabled={disabled}>
          <input
            className="bld-input"
            value={form.transformSkewY ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate('transformSkewY', e.target.value)}
          />
        </InspectorField>
      </div>
      <div className="bld-field-grid">
        <InspectorField label="Blur" disabled={disabled}>
          <input
            className="bld-input"
            value={form.effectBlur ?? ''}
            disabled={disabled}
            placeholder="0px"
            onChange={(e) => onUpdate('effectBlur', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Backdrop blur" disabled={disabled}>
          <input
            className="bld-input"
            value={form.effectBackdropBlur ?? ''}
            disabled={disabled}
            placeholder="0px"
            onChange={(e) => onUpdate('effectBackdropBlur', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Brightness" disabled={disabled}>
          <input
            className="bld-input"
            value={form.effectBrightness ?? ''}
            disabled={disabled}
            placeholder="100%"
            onChange={(e) => onUpdate('effectBrightness', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Contrast" disabled={disabled}>
          <input
            className="bld-input"
            value={form.effectContrast ?? ''}
            disabled={disabled}
            placeholder="100%"
            onChange={(e) => onUpdate('effectContrast', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Saturation" disabled={disabled}>
          <input
            className="bld-input"
            value={form.effectSaturation ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate('effectSaturation', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Grayscale" disabled={disabled}>
          <input
            className="bld-input"
            value={form.effectGrayscale ?? ''}
            disabled={disabled}
            onChange={(e) => onUpdate('effectGrayscale', e.target.value)}
          />
        </InspectorField>
      </div>
      <InspectorField label="Blend mode" disabled={disabled}>
        <select className="bld-input" value={form.effectBlendMode || ''} disabled={disabled} onChange={(e) => onUpdate('effectBlendMode', e.target.value)}>
          <option value="">normal</option>
          <option value="multiply">multiply</option>
          <option value="screen">screen</option>
          <option value="overlay">overlay</option>
          <option value="darken">darken</option>
          <option value="lighten">lighten</option>
        </select>
      </InspectorField>
      <InspectorField label="Text shadow" disabled={disabled}>
        <input
          className="bld-input"
          value={form.textShadow ?? ''}
          disabled={disabled}
          placeholder="0 1px 2px rgba(0,0,0,0.2)"
          onChange={(e) => onUpdate('textShadow', e.target.value)}
        />
      </InspectorField>
    </InspectorSection>
  );
}
