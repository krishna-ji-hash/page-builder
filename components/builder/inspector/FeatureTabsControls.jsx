'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';
import { InspectorSection } from '@/components/builder/inspector/InspectorUi';

/**
 * Feature tabs — content, tabs, bullets, and chrome styling.
 * Text/images: canvas. Sidebar: layout + colors + add tab/bullet.
 */
export default function FeatureTabsControls({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  editingViaParent = false,
  onFocusFeatureTabs = null,
}) {
  const featureTabsList = Array.isArray(selectedNode?.props?.tabs) ? selectedNode.props.tabs : [];
  const activeTabId = String(
    form.featureTabsActiveId || selectedNode?.props?.activeTabId || featureTabsList[0]?.id || ''
  );
  const activeIdx = featureTabsList.findIndex((t) => String(t?.id) === activeTabId);
  const activeLabel =
    activeIdx >= 0 ? String(featureTabsList[activeIdx]?.label || 'Tab') : 'active tab';

  return (
    <div className="bld-feature-tabs-inspector">
      {editingViaParent ? (
        <div className="bld-field" style={{ marginBottom: 12 }}>
          <p className="bld-field-note" style={{ marginTop: 0 }}>
            You selected a <strong>parent</strong> (section / stack). Feature tabs controls apply to the widget
            inside.
          </p>
          {typeof onFocusFeatureTabs === 'function' ? (
            <button type="button" className="bld-btn bld-btn--primary" onClick={onFocusFeatureTabs}>
              Select Feature tabs widget
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Canvas:</strong> click tab to switch · double-click tab name · click heading/body/bullets/image to
        edit. <strong>Cannot</strong> drag widgets inside this block — use buttons below to add tabs/bullets.
      </p>

      <InspectorSection title="Tabs & bullets" defaultOpen keywords="add tab bullet">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <button type="button" className="bld-chip" onClick={() => onChange('featureTabsAddTab', '1')}>
            + Add tab
          </button>
          <button
            type="button"
            className="bld-chip"
            disabled={featureTabsList.length <= 1}
            onClick={() => onChange('featureTabsRemoveActiveTab', activeTabId)}
          >
            Remove active tab
          </button>
          <button type="button" className="bld-chip" onClick={() => onChange('featureTabsAddBullet', activeTabId)}>
            + Bullet on {activeLabel}
          </button>
        </div>

        <div className="bld-field">
          <span className="bld-label">Default active tab</span>
          <div className="bld-feature-tabs-active-picker" role="radiogroup" aria-label="Default active tab">
            {featureTabsList.map((tab) => {
              const tabId = String(tab?.id || '');
              const isActive = tabId === activeTabId;
              return (
                <button
                  key={tabId || String(tab?.label)}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`bld-feature-tabs-active-picker__btn${isActive ? ' is-active' : ''}`}
                  onClick={() => onChange('featureTabsActiveId', tabId)}
                >
                  {String(tab?.label || tab?.id || 'Tab')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bld-field">
          <label className="bld-label">Tab bar alignment</label>
          <select
            className="bld-input"
            value={form.featureTabsTabAlign || 'center'}
            onChange={(e) => onChange('featureTabsTabAlign', e.target.value)}
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="stretch">Full width (spread)</option>
          </select>
        </div>

        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Image fit (all tabs)</label>
            <select
              className="bld-input"
              value={form.featureTabsImageFit || 'cover'}
              onChange={(e) => onChange('featureTabsImageFit', e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <InspectorNumField
            id="feature-tabs-img-h"
            label="Image height (px)"
            min={120}
            max={800}
            step={10}
            value={form.featureTabsImageHeightPx ?? ''}
            onChange={inspectorNumStringChange(onChange, 'featureTabsImageHeightPx')}
          />
        </div>
      </InspectorSection>

      <InspectorSection title="Colors & shape" defaultOpen keywords="color border radius width background">
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Block width, borders, and tab colors. For outer margin/padding use <strong>Style</strong> tab → Spacing.
        </p>
        <div className="bld-field-grid">
          <InspectorNumField
            id="feature-tabs-block-width"
            label="Block width (% viewport)"
            min={50}
            max={100}
            value={form.featureTabsBlockMaxWidthPct ?? 100}
            onChange={inspectorNumStringChange(onChange, 'featureTabsBlockMaxWidthPct')}
          />
          <div className="bld-field">
            <label className="bld-label" htmlFor="feature-tabs-bar-bg">
              Tab bar background
            </label>
            <input
              id="feature-tabs-bar-bg"
              type="color"
              className="bld-input"
              value={
                /^#[0-9a-f]{6}$/i.test(String(form.featureTabsBarBg || ''))
                  ? form.featureTabsBarBg
                  : '#ffffff'
              }
              onChange={(e) => onChange('featureTabsBarBg', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label" htmlFor="feature-tabs-active-color">
              Active tab text
            </label>
            <input
              id="feature-tabs-active-color"
              type="color"
              className="bld-input"
              value={
                /^#[0-9a-f]{6}$/i.test(String(form.featureTabsActiveTabColor || ''))
                  ? form.featureTabsActiveTabColor
                  : '#0f172a'
              }
              onChange={(e) => onChange('featureTabsActiveTabColor', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label" htmlFor="feature-tabs-active-line">
              Active tab underline
            </label>
            <input
              id="feature-tabs-active-line"
              type="color"
              className="bld-input"
              value={
                /^#[0-9a-f]{6}$/i.test(String(form.featureTabsActiveTabUnderline || ''))
                  ? form.featureTabsActiveTabUnderline
                  : '#2563eb'
              }
              onChange={(e) => onChange('featureTabsActiveTabUnderline', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label" htmlFor="feature-tabs-panel-bg">
              Panel background
            </label>
            <input
              id="feature-tabs-panel-bg"
              type="color"
              className="bld-input"
              value={
                /^#[0-9a-f]{6}$/i.test(String(form.featureTabsPanelBg || ''))
                  ? form.featureTabsPanelBg
                  : '#ffffff'
              }
              onChange={(e) => onChange('featureTabsPanelBg', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label" htmlFor="feature-tabs-panel-border">
              Panel border color
            </label>
            <input
              id="feature-tabs-panel-border"
              type="color"
              className="bld-input"
              value={
                /^#[0-9a-f]{6}$/i.test(String(form.featureTabsPanelBorderColor || ''))
                  ? form.featureTabsPanelBorderColor
                  : '#e2e8f0'
              }
              onChange={(e) => onChange('featureTabsPanelBorderColor', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <InspectorNumField
            id="feature-tabs-panel-border-w"
            label="Panel border (px)"
            min={0}
            max={8}
            value={form.featureTabsPanelBorderWidthPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'featureTabsPanelBorderWidthPx')}
          />
          <InspectorNumField
            id="feature-tabs-panel-radius"
            label="Panel corner radius (px)"
            min={0}
            max={48}
            value={form.featureTabsPanelRadiusPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'featureTabsPanelRadiusPx')}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="bld-chip"
            onClick={() => onChange('featureTabsChromeReset', '1')}
          >
            Reset chrome
          </button>
        </div>
      </InspectorSection>

      <details className="bld-details">
        <summary className="bld-details__summary">Advanced: Tabs JSON</summary>
        <div className="bld-field">
          <textarea
            className="bld-input"
            rows={8}
            value={form.featureTabsJson || '[]'}
            onChange={(e) => onChange('featureTabsJson', e.target.value)}
          />
          {jsonErrors.featureTabsJson ? <p className="bld-field-error">{jsonErrors.featureTabsJson}</p> : null}
        </div>
      </details>
    </div>
  );
}
