'use client';

import { useMemo, useState } from 'react';
import InspectorTipChips from '@/components/builder/inspector/InspectorTipChips';
import { InspectorNumInput } from '@/components/builder/inspector/InspectorNumeric';
import { numInputDisplayValue } from '@/lib/inspectorNumeric';

const SHADOW_PRESETS = [
  { id: 'none', label: 'None', value: 'none' },
  { id: 'soft', label: 'Soft', value: '0 4px 14px rgba(15, 23, 42, 0.08)' },
  { id: 'card', label: 'Card', value: '0 10px 28px rgba(15, 23, 42, 0.12)' },
  { id: 'lift', label: 'Lifted', value: '0 18px 42px rgba(15, 23, 42, 0.14)' },
  { id: 'deep', label: 'Deep', value: '0 24px 48px rgba(0, 0, 0, 0.22)' },
  { id: 'glow', label: 'Glow', value: '0 0 24px rgba(99, 102, 241, 0.35)' },
  { id: 'inset', label: 'Inset', value: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' },
];

function clamp01(n) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

function composeBoxShadow({ x, y, blur, spread, color, inset }) {
  const ix = inset ? 'inset ' : '';
  return `${ix}${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

function ShadowNumCell({ label, value, onChange, min = -240, max = 240 }) {
  return (
    <div>
      <span className="bld-label" style={{ fontSize: 12 }}>
        {label}
      </span>
      <InspectorNumInput value={value} min={min} max={max} onChange={(n) => onChange(n ?? 0)} />
    </div>
  );
}

export default function EffectsControls({ form, onUpdate, selectedNode = null }) {
  const isSection = selectedNode?.nodeType === 'row';
  const [bx, setBx] = useState(0);
  const [by, setBy] = useState(8);
  const [blur, setBlur] = useState(20);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState('rgba(15, 23, 42, 0.12)');
  const [inset, setInset] = useState(false);

  const opacityPct = useMemo(() => {
    const n = parseFloat(String(form.opacity ?? '1'));
    return Math.round(clamp01(Number.isFinite(n) ? n : 1) * 100);
  }, [form.opacity]);

  const applyBuilt = () => {
    onUpdate('boxShadow', composeBoxShadow({ x: bx, y: by, blur, spread, color, inset }));
  };

  return (
    <div className="bld-control-stack">
      {isSection ? (
        <InspectorTipChips
          style={{ marginTop: 0, marginBottom: 8 }}
          chips={['Shadow on row', 'Plus Background', 'Full section paint', 'Live preview save']}
        />
      ) : null}
      <div className="bld-field">
        <label className="bld-label">Box shadow presets</label>
        <div className="bld-field-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
          {SHADOW_PRESETS.map((p) => (
            <button key={p.id} type="button" className="bld-chip" onClick={() => onUpdate('boxShadow', p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bld-field">
        <label className="bld-label">Custom box-shadow (CSS)</label>
        <textarea
          className="bld-input"
          rows={2}
          value={form.boxShadow === 'none' ? 'none' : form.boxShadow || ''}
          onChange={(e) => onUpdate('boxShadow', e.target.value)}
          placeholder="e.g. 0 8px 24px rgba(0,0,0,0.15)"
        />
        <p className="bld-field-note">Full CSS value; use <code>none</code> to clear.</p>
      </div>
      <div className="bld-field">
        <label className="bld-label">Shadow builder</label>
        <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ShadowNumCell label="X (px)" value={bx} onChange={setBx} />
          <ShadowNumCell label="Y (px)" value={by} onChange={setBy} />
          <ShadowNumCell label="Blur" value={blur} onChange={setBlur} min={0} max={240} />
          <ShadowNumCell label="Spread" value={spread} onChange={setSpread} />
        </div>
        <div className="bld-field" style={{ marginTop: 8 }}>
          <label className="bld-label">Shadow color</label>
          <input className="bld-input" type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="rgba(0,0,0,0.2)" />
        </div>
        <label className="bld-field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={inset} onChange={(e) => setInset(e.target.checked)} />
          <span>Inset shadow</span>
        </label>
        <button type="button" className="bld-chip" style={{ marginTop: 8 }} onClick={applyBuilt}>
          Apply built shadow
        </button>
      </div>
      <div className="bld-field">
        <label className="bld-label">Opacity ({opacityPct}%)</label>
        <input
          className="bld-range"
          type="range"
          min={0}
          max={100}
          value={opacityPct}
          onChange={(e) => onUpdate('opacity', String((numInputDisplayValue(e.target.value, 0) || 0) / 100))}
        />
        <InspectorNumInput
          min={0}
          max={100}
          step={1}
          value={opacityPct}
          onChange={(n) => onUpdate('opacity', String((n ?? 0) / 100))}
        />
      </div>
    </div>
  );
}
