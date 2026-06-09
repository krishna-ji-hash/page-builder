'use client';

/** Stats Counter — edit values and labels in the inspector. */
export default function StatsCounterControls({ selectedNode, onChange }) {
  const items = Array.isArray(selectedNode?.props?.items) ? selectedNode.props.items : [];
  const animate = selectedNode?.props?.animate !== false;
  const gapPx = Number.isFinite(Number(selectedNode?.props?.gapPx))
    ? Number(selectedNode.props.gapPx)
    : 32;

  return (
    <div className="bld-stats-counter-inspector">
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        Click numbers and labels on the canvas to edit inline, or use the fields below. Numbers count up when the
        section enters the viewport on preview and live pages. To add a title above stats, select the{' '}
        <strong>Section</strong> row → <strong>Content</strong> → enable <strong>Section title block</strong>, or click{' '}
        <strong>Heading</strong> in Elements while the section is selected.
      </p>

      <div className="bld-field">
        <label className="bld-label">Gap between stats (px)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="bld-chip"
            onClick={() => onChange('statsCounterGapPx', Math.max(0, gapPx - 8))}
          >
            −
          </button>
          <input
            className="bld-input"
            type="number"
            min={0}
            max={200}
            value={gapPx}
            onChange={(e) => onChange('statsCounterGapPx', Math.max(0, Number(e.target.value) || 0))}
            style={{ width: 72, textAlign: 'center' }}
          />
          <button
            type="button"
            className="bld-chip"
            onClick={() => onChange('statsCounterGapPx', Math.min(200, gapPx + 8))}
          >
            +
          </button>
        </div>
      </div>

      <div className="bld-field">
        <label className="bld-label">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => onChange('statsCounterAnimate', e.target.checked)}
          />{' '}
          Animate count-up
        </label>
      </div>

      {items.map((item, idx) => (
        <details key={String(item?.id || idx)} className="bld-details" open={idx === 0}>
          <summary className="bld-details__summary">{String(item?.label || `Stat ${idx + 1}`)}</summary>
          <div className="bld-field">
            <label className="bld-label">Value</label>
            <input
              className="bld-input"
              type="text"
              value={String(item?.value ?? '')}
              onChange={(e) => onChange('statsCounterPatch', { index: idx, field: 'value', value: e.target.value })}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Suffix</label>
            <input
              className="bld-input"
              type="text"
              value={String(item?.suffix ?? '')}
              onChange={(e) => onChange('statsCounterPatch', { index: idx, field: 'suffix', value: e.target.value })}
              placeholder="+"
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Label</label>
            <input
              className="bld-input"
              type="text"
              value={String(item?.label ?? '')}
              onChange={(e) => onChange('statsCounterPatch', { index: idx, field: 'label', value: e.target.value })}
            />
          </div>
        </details>
      ))}

      <div className="bld-field" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="bld-chip" onClick={() => onChange('statsCounterAddItem', true)}>
          + Add stat
        </button>
        {items.length > 1 ? (
          <button
            type="button"
            className="bld-chip bld-chip--danger"
            onClick={() => onChange('statsCounterRemoveItem', items.length - 1)}
          >
            Remove last
          </button>
        ) : null}
      </div>
    </div>
  );
}
