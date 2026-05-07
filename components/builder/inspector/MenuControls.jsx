'use client';

export default function MenuControls({ form, onUpdate }) {
  return (
    <>
      <div className="bld-field">
        <label className="bld-label">Text Color</label>
        <input
          type="color"
          className="bld-input"
          value={form.menuTextColor || '#0f172a'}
          onChange={(event) => onUpdate('menuTextColor', event.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Item Gap (px)</label>
        <input
          type="range"
          min="0"
          max="80"
          className="bld-range"
          value={Number(form.menuGapPx ?? 12)}
          onChange={(event) => onUpdate('menuGapPx', event.target.value)}
        />
        <input
          type="number"
          min="0"
          className="bld-input"
          value={Number(form.menuGapPx ?? 12)}
          onChange={(event) => onUpdate('menuGapPx', event.target.value)}
        />
      </div>

      <div className="bld-field">
        <label className="bld-label">Item Padding</label>
        <input
          className="bld-input"
          value={form.menuItemPadding || '6px 12px'}
          onChange={(event) => onUpdate('menuItemPadding', event.target.value)}
          placeholder="6px 12px"
        />
      </div>

      <div className="bld-field">
        <label className="bld-label">Item Border Radius</label>
        <input
          className="bld-input"
          value={form.menuBorderRadius || '20px'}
          onChange={(event) => onUpdate('menuBorderRadius', event.target.value)}
          placeholder="20px"
        />
      </div>

      <div className="bld-field">
        <label className="bld-label">Hover Text Color</label>
        <input
          type="color"
          className="bld-input"
          value={form.menuHoverColor || '#6366f1'}
          onChange={(event) => onUpdate('menuHoverColor', event.target.value)}
        />
      </div>

      <div className="bld-field">
        <label className="bld-label">Hover Background</label>
        <input
          type="color"
          className="bld-input"
          value={form.menuHoverBg || '#f1f5ff'}
          onChange={(event) => onUpdate('menuHoverBg', event.target.value)}
        />
      </div>
    </>
  );
}
