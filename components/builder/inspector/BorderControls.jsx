'use client';

import { useState } from 'react';

export default function BorderControls({ form, onUpdate }) {
  const [isLinkedRadius, setIsLinkedRadius] = useState(true);

  const radiusValue = Number(form.borderRadiusPx || 0);

  return (
    <div className="bld-control-stack">
      <div className="bld-field-grid">
        <div className="bld-field">
          <label className="bld-label">Border Radius (px)</label>
          <div className="bld-radius-mode">
            <button
              type="button"
              className={`bld-radius-mode__btn ${isLinkedRadius ? 'is-active' : ''}`}
              onClick={() => setIsLinkedRadius(true)}
            >
              Linked
            </button>
            <button
              type="button"
              className={`bld-radius-mode__btn ${!isLinkedRadius ? 'is-active' : ''}`}
              onClick={() => setIsLinkedRadius(false)}
            >
              Per-corner
            </button>
          </div>
          <input className="bld-range" type="range" min="0" max="100" value={radiusValue} onChange={(e) => onUpdate('borderRadiusPx', e.target.value)} />
          {isLinkedRadius ? (
            <input className="bld-input" value={radiusValue} onChange={(e) => onUpdate('borderRadiusPx', e.target.value)} />
          ) : (
            <div className="bld-radius-grid">
              <input className="bld-input" value={radiusValue} onChange={(e) => onUpdate('borderRadiusPx', e.target.value)} placeholder="Top" />
              <input className="bld-input" value={radiusValue} onChange={(e) => onUpdate('borderRadiusPx', e.target.value)} placeholder="Right" />
              <input className="bld-input" value={radiusValue} onChange={(e) => onUpdate('borderRadiusPx', e.target.value)} placeholder="Bottom" />
              <input className="bld-input" value={radiusValue} onChange={(e) => onUpdate('borderRadiusPx', e.target.value)} placeholder="Left" />
            </div>
          )}
        </div>
        <div className="bld-field">
          <label className="bld-label">Border Width (px)</label>
          <input className="bld-input" value={form.borderWidthPx} onChange={(e) => onUpdate('borderWidthPx', e.target.value)} />
        </div>
      </div>
      <div className="bld-field">
        <label className="bld-label">Border Color</label>
        <input type="color" className="bld-input" value={form.borderColor} onChange={(e) => onUpdate('borderColor', e.target.value)} />
      </div>
    </div>
  );
}
