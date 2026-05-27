'use client';

import { useState } from 'react';
import { dataSourceRegistry, listResourceIds } from '@/lib/runtime/dataSourceRegistry';
import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bld-style-section">
      <button type="button" className="bld-style-section__head" onClick={() => setOpen((p) => !p)}>
        <span className="bld-style-section__title">{title}</span>
        <span className="bld-style-section__toggle" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open ? <div className="bld-style-section__body">{children}</div> : null}
    </div>
  );
}

export default function AdvancedPanel({
  selectedNode,
  form,
  onAdvancedChange,
  onContentChange,
  jsonErrors = {},
}) {
  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  const isButton = selectedNode.nodeType === 'button';
  const isTable = selectedNode.nodeType === 'table';
  const isForm = selectedNode.nodeType === 'form';
  const isRichText = selectedNode.nodeType === 'rich_text';
  const resources = listResourceIds();

  return (
    <div className="bld-panel">
      <div className="bld-panel__head">Advanced</div>
      <Section title="Position" defaultOpen={false}>
        <div className="bld-field">
          <label className="bld-label">Position</label>
          <select className="bld-input" value={form.position || 'static'} onChange={(e) => onAdvancedChange('position', e.target.value)}>
            <option value="static">static</option>
            <option value="relative">relative</option>
            <option value="sticky">sticky</option>
            <option value="absolute">absolute</option>
            <option value="fixed">fixed</option>
          </select>
        </div>
        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Left</label>
            <input className="bld-input" value={String(form.left ?? '')} onChange={(e) => onAdvancedChange('left', e.target.value)} placeholder="e.g. 0px" />
          </div>
          <div className="bld-field">
            <label className="bld-label">Top</label>
            <input className="bld-input" value={String(form.top ?? '')} onChange={(e) => onAdvancedChange('top', e.target.value)} placeholder="e.g. 0px" />
          </div>
          <div className="bld-field">
            <label className="bld-label">Right</label>
            <input className="bld-input" value={String(form.right ?? '')} onChange={(e) => onAdvancedChange('right', e.target.value)} placeholder="e.g. auto" />
          </div>
          <div className="bld-field">
            <label className="bld-label">Bottom</label>
            <input className="bld-input" value={String(form.bottom ?? '')} onChange={(e) => onAdvancedChange('bottom', e.target.value)} placeholder="e.g. auto" />
          </div>
        </div>
        <div className="bld-field">
          <label className="bld-label">z-index</label>
          <input className="bld-input" value={String(form.zIndex ?? '')} onChange={(e) => onAdvancedChange('zIndex', e.target.value)} placeholder="e.g. 10" />
        </div>
      </Section>

      {isRichText ? (
        <Section title="Animation" defaultOpen={false}>
          <div className="bld-field">
            <label className="bld-label">Motion</label>
            <select className="bld-input" value={form.animationPreset || 'none'} onChange={(e) => onContentChange('animationPreset', e.target.value)}>
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="scale">Scale</option>
            </select>
          </div>
          <InspectorNumField
            id="adv-anim-duration"
            label="Duration (sec)"
            min={0}
            max={60}
            step={0.1}
            value={form.animationDuration ?? 0.6}
            onChange={inspectorNumStringChange(onContentChange, 'animationDuration')}
          />
          <InspectorNumField
            id="adv-anim-delay"
            label="Delay (sec)"
            min={0}
            max={60}
            step={0.1}
            value={form.animationDelay ?? 0}
            onChange={inspectorNumStringChange(onContentChange, 'animationDelay')}
          />
        </Section>
      ) : null}

      <Section title="Responsive visibility" defaultOpen={false}>
        <p className="bld-field-note">
          Use the <strong>Style</strong> tab → <strong>Visibility by breakpoint</strong> to show or hide this layer on
          desktop, tablet, and mobile independently.
        </p>
      </Section>

      {isTable || isForm || isButton ? (
        <Section title="Data / Actions" defaultOpen={false}>
          {isTable || isForm ? (
            <div className="bld-field">
              <label className="bld-label">Data Source</label>
              <select
                className="bld-input"
                value={form.dataSourceResource || 'users'}
                onChange={(e) => onContentChange('dataSourceResource', e.target.value)}
              >
                {resources.map((resourceId) => (
                  <option key={resourceId} value={resourceId}>
                    {dataSourceRegistry[resourceId]?.label || resourceId}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {isButton ? (
            <>
              <div className="bld-field">
                <label className="bld-label">Action Type</label>
                <select className="bld-input" value={form.actionType || 'none'} onChange={(e) => onContentChange('actionType', e.target.value)}>
                  <option value="none">none</option>
                  <option value="navigate">navigate</option>
                  <option value="apiCall">apiCall</option>
                  <option value="showToast">showToast</option>
                  <option value="refreshPage">refreshPage</option>
                </select>
              </div>
              <div className="bld-field">
                <label className="bld-label">actions_json</label>
                <textarea
                  className="bld-input"
                  rows={6}
                  value={form.actionJson || '{}'}
                  onChange={(e) => onContentChange('actionJson', e.target.value)}
                />
                {jsonErrors.actionJson ? <p className="bld-field-error">{jsonErrors.actionJson}</p> : null}
              </div>
            </>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
