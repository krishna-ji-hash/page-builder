'use client';

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
  const previewTabId = String(form.featureTabsActiveId || featureTabsList[0]?.id || '');

  return (
    <div className="bld-feature-tabs-inspector">
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Edit on canvas:</strong> click heading, paragraph, bullets, and tab names directly in the preview.
        Click <strong>Change image</strong> on the photo. Use fields below only for alignment and image size. Width,
        padding, and colors are in the <strong>Style</strong> tab.
      </p>

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

      <div className="bld-field">
        <label className="bld-label">Preview tab (canvas)</label>
        <select
          className="bld-input"
          value={previewTabId}
          onChange={(e) => onChange('featureTabsActiveId', e.target.value)}
        >
          {featureTabsList.map((tab) => (
            <option key={String(tab?.id || tab?.label)} value={String(tab?.id || '')}>
              {String(tab?.label || tab?.id || 'Tab')}
            </option>
          ))}
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
        <div className="bld-field">
          <label className="bld-label">Image height (px)</label>
          <input
            className="bld-input"
            type="number"
            min={120}
            max={800}
            step={10}
            value={form.featureTabsImageHeightPx ?? ''}
            onChange={(e) => onChange('featureTabsImageHeightPx', e.target.value)}
          />
        </div>
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
