'use client';

import { InspectorSection } from '@/components/builder/inspector/InspectorUi';

/** Tab Hero — panels, default tab, and tab bar alignment. */
export default function TabHeroControls({ selectedNode, form, onChange, canUseMedia = false, onOpenMedia }) {
  const panels = Array.isArray(selectedNode?.props?.panels) ? selectedNode.props.panels : [];
  const activePanelId = String(
    form.tabHeroActiveId || selectedNode?.props?.activePanelId || panels[0]?.id || ''
  );

  return (
    <div className="bld-tab-hero-inspector">
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        Select the <strong>Tab Hero</strong> widget on the canvas (not the section row). Double-click a tab name to
        rename · click heading, paragraph, or CTA to edit. Use fields below for links and background images.
      </p>

      <InspectorSection title="Tabs" defaultOpen keywords="tab default panel">
        <div className="bld-field">
          <span className="bld-label">Default active tab (live)</span>
          <div className="bld-feature-tabs-active-picker" role="radiogroup" aria-label="Default active tab">
            {panels.map((panel) => {
              const panelId = String(panel?.id || '');
              const isActive = panelId === activePanelId;
              return (
                <button
                  key={panelId || String(panel?.label)}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`bld-feature-tabs-active-picker__btn${isActive ? ' is-active' : ''}`}
                  onClick={() => onChange('tabHeroActiveId', panelId)}
                >
                  {String(panel?.label || panel?.id || 'Tab')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bld-field">
          <label className="bld-label">Tab bar alignment</label>
          <select
            className="bld-input"
            value={form.tabHeroTabAlign || 'center'}
            onChange={(e) => onChange('tabHeroTabAlign', e.target.value)}
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="stretch">Full width</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <button type="button" className="bld-chip" onClick={() => onChange('tabHeroAddPanel', '1')}>
            + Add tab
          </button>
          {panels.length > 1 ? (
            <button
              type="button"
              className="bld-chip bld-chip--danger"
              onClick={() => onChange('tabHeroRemovePanel', activePanelId)}
            >
              Remove active tab
            </button>
          ) : null}
        </div>
      </InspectorSection>

      {panels.map((panel, idx) => (
        <details key={String(panel?.id || idx)} className="bld-details" open={panel?.id === activePanelId}>
          <summary className="bld-details__summary">{String(panel?.label || `Tab ${idx + 1}`)}</summary>
          <div className="bld-field">
            <label className="bld-label">Tab label</label>
            <input
              className="bld-input"
              type="text"
              value={String(panel?.label ?? '')}
              onChange={(e) =>
                onChange('tabHeroPatch', { panelId: panel?.id, field: 'label', value: e.target.value })
              }
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">CTA link</label>
            <input
              className="bld-input"
              type="text"
              value={String(panel?.ctaHref ?? '#')}
              onChange={(e) =>
                onChange('tabHeroPatch', { panelId: panel?.id, field: 'ctaHref', value: e.target.value })
              }
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Background image URL</label>
            <input
              className="bld-input"
              type="text"
              value={String(panel?.imageSrc ?? '')}
              onChange={(e) =>
                onChange('tabHeroPatch', { panelId: panel?.id, field: 'imageSrc', value: e.target.value })
              }
            />
            <button
              type="button"
              className="bld-chip"
              style={{ marginTop: 8 }}
              disabled={!canUseMedia}
              title={canUseMedia ? 'Choose from project media library' : 'Save project first'}
              onClick={() => onOpenMedia?.(panel?.id)}
            >
              Choose from Media
            </button>
          </div>
        </details>
      ))}
    </div>
  );
}
