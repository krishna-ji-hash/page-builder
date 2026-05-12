'use client';

import { useMemo, useState } from 'react';

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
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Section (row) par yahan <strong>box shadow</strong> aur neeche <strong>Background</strong> se poora section
          paint ho sakta hai — live preview ke saath save hota hai.
        </p>
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
        <p className="bld-field-note">Poora CSS value; &quot;none&quot; se hata do.</p>
      </div>
      <div className="bld-field">
        <label className="bld-label">Shadow builder</label>
        <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <span className="bld-label" style={{ fontSize: 12 }}>
              X (px)
            </span>
            <input className="bld-input" type="number" value={bx} onChange={(e) => setBx(Number(e.target.value) || 0)} />
          </div>
          <div>
            <span className="bld-label" style={{ fontSize: 12 }}>
              Y (px)
            </span>
            <input className="bld-input" type="number" value={by} onChange={(e) => setBy(Number(e.target.value) || 0)} />
          </div>
          <div>
            <span className="bld-label" style={{ fontSize: 12 }}>
              Blur
            </span>
            <input className="bld-input" type="number" min={0} value={blur} onChange={(e) => setBlur(Number(e.target.value) || 0)} />
          </div>
          <div>
            <span className="bld-label" style={{ fontSize: 12 }}>
              Spread
            </span>
            <input className="bld-input" type="number" value={spread} onChange={(e) => setSpread(Number(e.target.value) || 0)} />
          </div>
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
          onChange={(e) => onUpdate('opacity', String((Number(e.target.value) || 0) / 100))}
        />
        <input
          className="bld-input"
          type="number"
          min={0}
          max={100}
          step={1}
          value={opacityPct}
          onChange={(e) => onUpdate('opacity', String((Number(e.target.value) || 0) / 100))}
        />
      </div>
    </div>
  );
}
