'use client';

import { InspectorNumInput, numInputDisplayValue } from '@/components/builder/inspector/InspectorNumeric';

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
          value={numInputDisplayValue(form.menuGapPx, 12)}
          onChange={(event) => onUpdate('menuGapPx', event.target.value)}
        />
        <InspectorNumInput
          min={0}
          max={80}
          value={form.menuGapPx ?? 12}
          onChange={(n) => onUpdate('menuGapPx', n == null ? '' : String(n))}
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

      <details className="bld-acc" style={{ marginTop: 10 }}>
        <summary>Dropdown</summary>
        <div className="bld-field-grid" style={{ marginTop: 10 }}>
          <div className="bld-field">
            <label className="bld-label">Item font size (px)</label>
            <InspectorNumInput
              min={0}
              max={64}
              value={form.menuDdItemFontSizePx ?? 0}
              onChange={(n) => onUpdate('menuDdItemFontSizePx', n == null ? '' : String(n))}
            />
            <p className="bld-field-note">0 = inherit</p>
          </div>
          <div className="bld-field">
            <label className="bld-label">Item gap (px)</label>
            <InspectorNumInput
              min={0}
              max={40}
              value={form.menuDdItemGapPx ?? 0}
              onChange={(n) => onUpdate('menuDdItemGapPx', n == null ? '' : String(n))}
            />
          </div>
        </div>

        <div className="bld-field">
          <label className="bld-label">Item padding</label>
          <input
            className="bld-input"
            value={form.menuDdItemPadding || ''}
            onChange={(event) => onUpdate('menuDdItemPadding', event.target.value)}
            placeholder="10px 12px"
          />
        </div>

        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Width</label>
            <input className="bld-input" value={form.menuDdWidth || ''} onChange={(e) => onUpdate('menuDdWidth', e.target.value)} placeholder="auto / 320px" />
          </div>
          <div className="bld-field">
            <label className="bld-label">Min width</label>
            <input className="bld-input" value={form.menuDdMinWidth || ''} onChange={(e) => onUpdate('menuDdMinWidth', e.target.value)} placeholder="220px" />
          </div>
          <div className="bld-field">
            <label className="bld-label">Max width</label>
            <input className="bld-input" value={form.menuDdMaxWidth || ''} onChange={(e) => onUpdate('menuDdMaxWidth', e.target.value)} placeholder="min(88vw, 720px)" />
          </div>
        </div>

        <div className="bld-field">
          <label className="bld-label">Overflow</label>
          <select className="bld-input" value={form.menuDdOverflow || 'visible'} onChange={(e) => onUpdate('menuDdOverflow', e.target.value)}>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="bld-field">
          <label className="bld-label">Dropdown arrow type</label>
          <select
            className="bld-input"
            value={form.menuDdChevronVariant || 'chevron'}
            onChange={(e) => onUpdate('menuDdChevronVariant', e.target.value)}
          >
            <option value="caret">Caret (▾)</option>
            <option value="chevron">Chevron (⌄)</option>
            <option value="triangle">Triangle (▼)</option>
            <option value="plus">Plus (+)</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Arrow size (px)</label>
            <InspectorNumInput
              min={0}
              max={40}
              value={form.menuDdChevronSizePx ?? 0}
              onChange={(n) => onUpdate('menuDdChevronSizePx', n == null ? '' : String(n))}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Arrow spacing (px)</label>
            <InspectorNumInput
              min={0}
              max={40}
              value={form.menuDdChevronGapPx ?? 0}
              onChange={(n) => onUpdate('menuDdChevronGapPx', n == null ? '' : String(n))}
            />
          </div>
        </div>

        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Border radius (px)</label>
            <InspectorNumInput
              min={0}
              max={40}
              value={form.menuDdBorderRadiusPx ?? 0}
              onChange={(n) => onUpdate('menuDdBorderRadiusPx', n == null ? '' : String(n))}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Shadow</label>
            <input
              className="bld-input"
              value={form.menuDdShadow || ''}
              onChange={(e) => onUpdate('menuDdShadow', e.target.value)}
              placeholder="0 18px 48px rgba(15,23,42,0.18)"
            />
          </div>
        </div>

        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Submenu offset X (px)</label>
            <InspectorNumInput
              min={-200}
              max={200}
              value={form.menuDdOffsetXPx ?? 0}
              onChange={(n) => onUpdate('menuDdOffsetXPx', n == null ? '' : String(n))}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Submenu offset Y (px)</label>
            <InspectorNumInput
              min={-200}
              max={200}
              value={form.menuDdOffsetYPx ?? 0}
              onChange={(n) => onUpdate('menuDdOffsetYPx', n == null ? '' : String(n))}
            />
          </div>
        </div>

        <div className="bld-field" style={{ marginTop: 10 }}>
          <label className="bld-label">Nested submenu behavior</label>
          <select
            className="bld-input"
            value={form.menuDdNestedMode || 'toggle'}
            onChange={(e) => onUpdate('menuDdNestedMode', e.target.value)}
          >
            <option value="toggle">Collapsible (shows arrow, click to expand)</option>
            <option value="always">Always expanded</option>
          </select>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              id="menu-dd-nested-default-open"
              type="checkbox"
              checked={Boolean(form.menuDdNestedDefaultOpen)}
              onChange={(e) => onUpdate('menuDdNestedDefaultOpen', e.target.checked)}
              disabled={String(form.menuDdNestedMode || 'toggle') !== 'toggle'}
            />
            <label className="bld-label" htmlFor="menu-dd-nested-default-open" style={{ margin: 0 }}>
              Default open (collapsible mode)
            </label>
          </div>
        </div>

        <div className="bld-field-grid" style={{ marginTop: 10 }}>
          <div className="bld-field">
            <label className="bld-label">Child indent (px)</label>
            <InspectorNumInput
              min={0}
              max={60}
              value={form.menuDdNestedIndentPx ?? 0}
              onChange={(n) => onUpdate('menuDdNestedIndentPx', n == null ? '' : String(n))}
            />
            <p className="bld-field-note">Left spacing for child menus</p>
          </div>
          <div className="bld-field">
            <label className="bld-label">Child gap (px)</label>
            <InspectorNumInput
              min={0}
              max={40}
              value={form.menuDdNestedGapPx ?? 0}
              onChange={(n) => onUpdate('menuDdNestedGapPx', n == null ? '' : String(n))}
            />
            <p className="bld-field-note">Space between child items</p>
          </div>
        </div>
      </details>
    </>
  );
}
