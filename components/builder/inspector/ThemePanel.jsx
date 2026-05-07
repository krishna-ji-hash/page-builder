'use client';

import { useBuilderTheme } from '@/context/BuilderThemeContext';

function Section({ title, children }) {
  return (
    <div className="bld-panel__section" style={{ marginBottom: 10 }}>
      <div className="bld-panel__subhead">{title}</div>
      {children}
    </div>
  );
}

function ColorRow({ fieldId, label, value, onChange }) {
  const hex = String(value || '').trim();
  const safe = /^#[0-9a-fA-F]{6}$/i.test(hex) ? hex : '#000000';
  return (
    <div className="bld-control-row">
      <span className="bld-control-label">{label}</span>
      <input
        id={fieldId}
        type="color"
        className="bld-input"
        aria-label={label}
        style={{ width: 52, height: 32, padding: 2, cursor: 'pointer' }}
        value={safe}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextRow({ fieldId, label, value, onChange, placeholder }) {
  return (
    <div className="bld-field">
      <label className="bld-label" htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        type="text"
        className="bld-input"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumRow({ fieldId, label, value, onChange }) {
  return (
    <div className="bld-field">
      <label className="bld-label" htmlFor={fieldId}>
        {label} (px)
      </label>
      <input
        id={fieldId}
        type="number"
        className="bld-input"
        min={0}
        step={1}
        value={Number.isFinite(Number(value)) ? Number(value) : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function ThemePanel() {
  const { siteTheme, setSiteTheme, applySitePreset, siteThemePersist, currentPageSlug } = useBuilderTheme();
  const { colors, typography, spacing } = siteTheme;

  const patchColors = (key, val) => {
    setSiteTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: val } }));
  };
  const patchTypo = (key, val) => {
    setSiteTheme((prev) => ({ ...prev, typography: { ...prev.typography, [key]: val } }));
  };
  const patchSpace = (key, val) => {
    setSiteTheme((prev) => ({ ...prev, spacing: { ...prev.spacing, [key]: val } }));
  };

  const pageVars = (currentPageSlug && siteTheme.pageVars && siteTheme.pageVars[currentPageSlug]) || {};
  const pageSectionGap = Number.isFinite(Number(pageVars.sectionGapPx)) ? Number(pageVars.sectionGapPx) : 12;
  const pageSectionPadBottom = Number.isFinite(Number(pageVars.sectionPadBottomPx)) ? Number(pageVars.sectionPadBottomPx) : 12;
  const stickyHeader = Boolean(pageVars.stickyHeader);

  const patchPageVar = (key, val) => {
    if (!currentPageSlug) return;
    setSiteTheme((prev) => ({
      ...prev,
      pageVars: {
        ...(prev.pageVars || {}),
        [currentPageSlug]: {
          ...((prev.pageVars || {})[currentPageSlug] || {}),
          [key]: val,
        },
      },
    }));
  };

  return (
    <div className="bld-panel">
      <div className="bld-panel__head">Page theme</div>
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Theme is stored on the project in the database (single source of truth). The browser keeps an optional cache
        copy only. Per-widget style overrides still win.
      </p>
      {siteThemePersist.status !== 'idle' ? (
        <p
          className="bld-field-note"
          style={{
            marginTop: 4,
            color: siteThemePersist.status === 'error' ? '#ef4444' : undefined,
          }}
        >
          {siteThemePersist.status === 'saving'
            ? 'Saving to project…'
            : siteThemePersist.status === 'saved'
              ? 'Saved to database.'
              : siteThemePersist.status === 'error'
                ? `Save failed: ${siteThemePersist.error || 'Unknown error'}`
                : null}
        </p>
      ) : null}
      <div className="bld-tiny-toggle" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={`bld-tiny-toggle__btn ${siteTheme.presetId === 'light' ? 'is-active' : ''}`}
          onClick={() => applySitePreset('light')}
        >
          Light
        </button>
        <button
          type="button"
          className={`bld-tiny-toggle__btn ${siteTheme.presetId === 'dark' ? 'is-active' : ''}`}
          onClick={() => applySitePreset('dark')}
        >
          Dark
        </button>
      </div>
      <Section title="Colors">
        <ColorRow fieldId="theme-c-primary" label="Primary" value={colors.primary} onChange={(v) => patchColors('primary', v)} />
        <ColorRow fieldId="theme-c-secondary" label="Secondary" value={colors.secondary} onChange={(v) => patchColors('secondary', v)} />
        <ColorRow fieldId="theme-c-text" label="Text" value={colors.text} onChange={(v) => patchColors('text', v)} />
        <ColorRow fieldId="theme-c-muted" label="Muted" value={colors.muted} onChange={(v) => patchColors('muted', v)} />
        <ColorRow fieldId="theme-c-bg" label="Background" value={colors.background} onChange={(v) => patchColors('background', v)} />
        <ColorRow fieldId="theme-c-surface" label="Surface" value={colors.surface} onChange={(v) => patchColors('surface', v)} />
        <ColorRow fieldId="theme-c-border" label="Border" value={colors.border} onChange={(v) => patchColors('border', v)} />
      </Section>
      <Section title="Typography">
        <TextRow fieldId="theme-ff-body" label="Body font" value={typography.fontFamily} onChange={(v) => patchTypo('fontFamily', v)} />
        <TextRow
          fieldId="theme-ff-heading"
          label="Heading font"
          value={typography.fontFamilyHeading}
          onChange={(v) => patchTypo('fontFamilyHeading', v)}
        />
        <TextRow fieldId="theme-fs-base" label="Base size" value={typography.fontSizeBase} onChange={(v) => patchTypo('fontSizeBase', v)} />
        <TextRow fieldId="theme-lh" label="Line height" value={typography.lineHeight} onChange={(v) => patchTypo('lineHeight', v)} />
        <div className="bld-field-grid">
          <TextRow
            fieldId="theme-fw-norm"
            label="Weight normal"
            value={typography.fontWeightNormal}
            onChange={(v) => patchTypo('fontWeightNormal', v)}
          />
          <TextRow
            fieldId="theme-fw-bold"
            label="Weight bold"
            value={typography.fontWeightBold}
            onChange={(v) => patchTypo('fontWeightBold', v)}
          />
        </div>
      </Section>
      <Section title="Spacing scale">
        <div className="bld-field-grid">
          <NumRow fieldId="theme-sp-xs" label="XS" value={spacing.xs} onChange={(v) => patchSpace('xs', v)} />
          <NumRow fieldId="theme-sp-sm" label="SM" value={spacing.sm} onChange={(v) => patchSpace('sm', v)} />
          <NumRow fieldId="theme-sp-md" label="MD" value={spacing.md} onChange={(v) => patchSpace('md', v)} />
          <NumRow fieldId="theme-sp-lg" label="LG" value={spacing.lg} onChange={(v) => patchSpace('lg', v)} />
          <NumRow fieldId="theme-sp-xl" label="XL" value={spacing.xl} onChange={(v) => patchSpace('xl', v)} />
        </div>
      </Section>
      <Section title="Page spacing (this page)">
        {!currentPageSlug ? (
          <p className="bld-field-note" style={{ marginTop: 0 }}>
            Page slug not available. Open via builder page route to enable per-page spacing controls.
          </p>
        ) : (
          <>
            <div className="bld-field">
              <label className="bld-label" htmlFor="page-sticky-header">
                Sticky header
              </label>
              <select
                id="page-sticky-header"
                className="bld-input"
                value={stickyHeader ? 'yes' : 'no'}
                onChange={(e) => patchPageVar('stickyHeader', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <p className="bld-field-note">Keeps the Header section stuck to the top while scrolling.</p>
            </div>
            <div className="bld-field-grid">
              <NumRow
                fieldId="page-section-gap"
                label="Section gap"
                value={pageSectionGap}
                onChange={(v) => patchPageVar('sectionGapPx', Math.max(0, Number(v) || 0))}
              />
              <NumRow
                fieldId="page-section-pad-bottom"
                label="Section bottom padding"
                value={pageSectionPadBottom}
                onChange={(v) => patchPageVar('sectionPadBottomPx', Math.max(0, Number(v) || 0))}
              />
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
