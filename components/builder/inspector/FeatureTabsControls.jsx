'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

/**
 * Feature tabs — sidebar layout controls only. Text, images, and tab names are edited on the canvas.
 */
export default function FeatureTabsControls({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
}) {
  const featureTabsList = Array.isArray(selectedNode?.props?.tabs) ? selectedNode.props.tabs : [];
  const activeTabId = String(
    form.featureTabsActiveId || selectedNode?.props?.activeTabId || featureTabsList[0]?.id || ''
  );

  return (
    <div className="bld-feature-tabs-inspector">
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        Edit tab names, headings, paragraphs, and images directly on the canvas. Use the controls below for
        layout only.
      </p>

      <div className="bld-field">
        <span className="bld-label">Default active tab</span>
        <p className="bld-field-note" style={{ marginTop: 4, marginBottom: 8 }}>
          Opens first on your live site. Visitors can still switch tabs by clicking.
        </p>
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
