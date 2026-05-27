'use client';

import { InspectorNumField } from '@/components/builder/inspector/InspectorNumeric';

const PRESETS = [
  { id: 'comfortable', label: 'Comfortable', labelGapPx: 10, inputAfterGapPx: 22, beforeSubmitGapPx: 24 },
  { id: 'balanced', label: 'Balanced', labelGapPx: 8, inputAfterGapPx: 16, beforeSubmitGapPx: 20 },
  { id: 'compact', label: 'Compact', labelGapPx: 6, inputAfterGapPx: 12, beforeSubmitGapPx: 16 },
];

function readLayout(layout) {
  const l = layout && typeof layout === 'object' ? layout : {};
  let inputAfterGapPx = 16;
  if (l.inputAfterGapPx != null && l.inputAfterGapPx !== '') {
    const n = Number(l.inputAfterGapPx);
    if (Number.isFinite(n) && n >= 0) inputAfterGapPx = n;
  } else if (l.fieldGapPx != null && l.fieldGapPx !== '') {
    const legacy = Number(l.fieldGapPx);
    if (Number.isFinite(legacy) && legacy > 0) inputAfterGapPx = legacy;
  }
  return {
    labelGapPx: Number.isFinite(Number(l.labelGapPx)) ? Number(l.labelGapPx) : 8,
    inputAfterGapPx,
    beforeSubmitGapPx: Number.isFinite(Number(l.beforeSubmitGapPx)) ? Number(l.beforeSubmitGapPx) : 20,
  };
}

export default function FormSpacingControls({ selectedNode, onChange }) {
  const { labelGapPx, inputAfterGapPx, beforeSubmitGapPx } = readLayout(selectedNode?.props?.layout);

  const applyPreset = (preset) => {
    onChange?.('formSetLayout', {
      labelGapPx: preset.labelGapPx,
      inputAfterGapPx: preset.inputAfterGapPx,
      beforeSubmitGapPx: preset.beforeSubmitGapPx,
    });
  };

  return (
    <>
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 10 }}>
        <strong>Label → input</strong> = naam ke neeche box. <strong>Input ke niche</strong> = box ke baad khali
        jagah (agli field se pehle). <strong>Submit ke upar</strong> = button se pehle gap.
      </p>
      <div className="bld-field-grid" style={{ marginBottom: 10 }}>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="bld-chip" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <InspectorNumField
        id="form-label-gap"
        label="Label → input (px)"
        min={0}
        max={48}
        value={labelGapPx}
        onChange={(n) => onChange?.('formSetLayout', { labelGapPx: n ?? 0 })}
      />
      <div className="bld-field">
        <InspectorNumField
          id="form-input-after-gap"
          label="Input ke niche (px)"
          min={0}
          max={80}
          value={inputAfterGapPx}
          onChange={(n) => onChange?.('formSetLayout', { inputAfterGapPx: n ?? 0 })}
          className="bld-field"
        />
        <p className="bld-field-note">Har input / dropdown ke <strong>neeche</strong> — yahi aapko chahiye tha.</p>
      </div>
      <InspectorNumField
        id="form-before-submit-gap"
        label="Submit ke upar (px)"
        min={0}
        max={80}
        value={beforeSubmitGapPx}
        onChange={(n) => onChange?.('formSetLayout', { beforeSubmitGapPx: n ?? 0 })}
      />
    </>
  );
}
