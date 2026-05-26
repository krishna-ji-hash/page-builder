'use client';

import {
  DEFAULT_SECTION_LAYOUTS,
  normalizeSectionLayout,
  SECTION_LAYOUT_ALIGNS,
  SECTION_LAYOUT_DIRECTIONS,
  SECTION_LAYOUT_GAPS,
} from '@/lib/sectionLayout';

function Field({ label, children }) {
  return (
    <div className="bld-field">
      <label className="bld-label">{label}</label>
      {children}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object|null} props.sectionRow
 * @param {(layout: object) => void|Promise<void>} props.onApplyLayout
 */
export default function SectionLayoutControls({ sectionRow, onApplyLayout }) {
  const templateId = sectionRow?.props?.meta?.sectionTemplate;
  const layout = normalizeSectionLayout(sectionRow?.props?.meta?.sectionLayout, templateId);
  const hasColumnLayout = Boolean(sectionRow?.props?.meta?.sectionColumnLayout);
  const isComparison = templateId === 'comparisonTable';

  const patch = (partial) => {
    const next = normalizeSectionLayout({ ...layout, ...partial }, templateId);
    void onApplyLayout(next);
  };

  if (!templateId) return null;

  return (
    <div className="bld-section-layout-controls">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Controls the main <strong>cards / items / logos / team</strong> row in this section. Updates preview
        immediately and saves with the page.
        {hasColumnLayout ? ' This section also uses a two-column (map + text) split.' : null}
        {isComparison ? ' Table scrolls horizontally on small screens; use Spacing for wrapper padding.' : null}
      </p>
      <Field label="Layout direction">
        <select
          className="bld-input"
          value={layout.direction}
          onChange={(e) => patch({ direction: e.target.value })}
        >
          {SECTION_LAYOUT_DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d === 'auto' ? 'Auto' : d === 'vertical' ? 'Vertical' : 'Horizontal'}
            </option>
          ))}
        </select>
      </Field>
      {!isComparison ? (
        <Field label="Columns">
          <select
            className="bld-input"
            value={String(layout.columns)}
            onChange={(e) => patch({ columns: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Gap">
        <select className="bld-input" value={layout.gap} onChange={(e) => patch({ gap: e.target.value })}>
          {SECTION_LAYOUT_GAPS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Align">
        <select className="bld-input" value={layout.align} onChange={(e) => patch({ align: e.target.value })}>
          {SECTION_LAYOUT_ALIGNS.map((a) => (
            <option key={a} value={a}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      <div className="bld-field bld-field--checkbox">
        <label className="bld-checkbox">
          <input
            type="checkbox"
            checked={layout.mobileStack}
            onChange={(e) => patch({ mobileStack: e.target.checked })}
          />
          <span>Stack on mobile / tablet</span>
        </label>
      </div>
      <div className="bld-field bld-field--checkbox">
        <label className="bld-checkbox">
          <input type="checkbox" checked={layout.reverse} onChange={(e) => patch({ reverse: e.target.checked })} />
          <span>Reverse order</span>
        </label>
      </div>
      {DEFAULT_SECTION_LAYOUTS[templateId] ? (
        <button
          type="button"
          className="bld-btn bld-btn--ghost"
          style={{ marginTop: 8, width: '100%' }}
          onClick={() => patch({ ...DEFAULT_SECTION_LAYOUTS[templateId] })}
        >
          Reset to template default
        </button>
      ) : null}
    </div>
  );
}
