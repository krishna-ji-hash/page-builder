'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { isRootPageRow } from '@/lib/liveDocSectionSpacing';
import InspectorTipChips from '@/components/builder/inspector/InspectorTipChips';
import PageResponsivePanel from '@/components/builder/inspector/PageResponsivePanel';
import { InspectorNumField } from '@/components/builder/inspector/InspectorNumeric';
import { DEFAULT_STYLE_PRESETS, normalizeStylePresets } from '@/lib/stylePresetsStore';
import {
  createModePalettesFromFlat,
  hasModePalettes,
  resolveActiveThemeTokens,
} from '@/lib/themeTokens';

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
    <InspectorNumField
      id={fieldId}
      label={`${label} (px)`}
      min={0}
      max={9999}
      value={value}
      onChange={(n) => onChange(n ?? 0)}
    />
  );
}

/**
 * @param {object} props
 * @param {unknown[]} [props.pageTree]
 * @param {(nodeId: number, patch: { sectionGapBeforePx?: number | null | ''; sectionGapAfterPx?: number | null | ''; sectionPadBottomPx?: number | null | '' }) => Promise<void>} [props.onPatchRootSectionPageSpacing]
 * @param {number|null} [props.selectedNodeId] — when a root section row is selected, show its gap overrides
 */
export default function ThemePanel({
  pageTree = [],
  onPatchRootSectionPageSpacing,
  selectedNodeId = null,
  onApplyResponsiveToPage,
  isApplyingResponsive = false,
  hideBrandSections = false,
}) {
  const {
    siteTheme,
    setSiteTheme,
    applySitePreset,
    siteThemePersist,
    currentPageSlug,
    themeTokens,
    setThemeTokens,
    themeTokensPersist,
    stylePresets,
    setStylePresets,
    stylePresetsPersist,
  } = useBuilderTheme();
  const { colors, typography, spacing } = siteTheme;
  const activeThemeTokens = useMemo(() => resolveActiveThemeTokens(themeTokens), [themeTokens]);
  const tokenMode = themeTokens?.mode === 'dark' ? 'dark' : 'light';
  const tokenColors = activeThemeTokens.colors || {};
  const tokenGradients = activeThemeTokens.gradients || {};
  const tokenSpacing = activeThemeTokens.spacing || {};
  const tokenRadius = activeThemeTokens.radius || {};
  const tokenShadows = activeThemeTokens.shadows || {};
  const tokenMotion = activeThemeTokens.motion || {};

  const setTokenMode = (next) => {
    setThemeTokens((prev) => {
      const mode = next === 'dark' ? 'dark' : 'light';
      if (hasModePalettes(prev)) return { ...prev, mode };
      const { light, dark } = createModePalettesFromFlat(prev);
      return { ...prev, mode, light, dark };
    });
  };

  const patchTokenGroup = (group, patch) => {
    setThemeTokens((prev) => {
      const mode = prev.mode === 'dark' ? 'dark' : 'light';
      if (hasModePalettes(prev)) {
        return {
          ...prev,
          [mode]: {
            ...(prev[mode] || {}),
            [group]: { ...(prev[mode]?.[group] || {}), ...patch },
          },
        };
      }
      return {
        ...prev,
        [group]: { ...(prev[group] || {}), ...patch },
      };
    });
  };

  const presetsNorm = useMemo(() => normalizeStylePresets(stylePresets || DEFAULT_STYLE_PRESETS), [stylePresets]);
  const presetsList = presetsNorm.presets || [];
  const [activePresetId, setActivePresetId] = useState('');
  const activePreset = useMemo(
    () => presetsList.find((p) => p.id === activePresetId) || null,
    [presetsList, activePresetId]
  );
  const [presetDraftJson, setPresetDraftJson] = useState('');
  useEffect(() => {
    if (!activePreset) {
      setPresetDraftJson('');
      return;
    }
    setPresetDraftJson(JSON.stringify(activePreset.style_json || {}, null, 2));
  }, [activePresetId]);

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
    setSiteTheme((prev) => {
      const cur = { ...((prev.pageVars || {})[currentPageSlug] || {}) };
      if (val === null || val === undefined) {
        delete cur[key];
      } else {
        cur[key] = val;
      }
      return {
        ...prev,
        pageVars: {
          ...(prev.pageVars || {}),
          [currentPageSlug]: cur,
        },
      };
    });
  };

  const rootRows = useMemo(
    () => (Array.isArray(pageTree) ? pageTree.filter((n) => n?.nodeType === 'row' && isRootPageRow(pageTree, n)) : []),
    [pageTree]
  );
  /** When set, show gap/padding fields for that root row only; page defaults still apply everywhere else. */
  const [overrideSectionId, setOverrideSectionId] = useState(null);

  useEffect(() => {
    if (overrideSectionId == null) return;
    if (!rootRows.some((r) => r.id === overrideSectionId)) {
      setOverrideSectionId(null);
    }
  }, [rootRows, overrideSectionId]);

  useEffect(() => {
    const id = Number(selectedNodeId);
    if (!Number.isInteger(id) || id <= 0) return;
    if (rootRows.some((r) => r.id === id)) {
      setOverrideSectionId(id);
    }
  }, [selectedNodeId, rootRows]);

  const singleRow = useMemo(
    () =>
      overrideSectionId != null ? rootRows.find((r) => r.id === overrideSectionId) ?? null : null,
    [rootRows, overrideSectionId]
  );
  const singleMeta =
    singleRow?.props?.meta && typeof singleRow.props.meta === 'object' && !Array.isArray(singleRow.props.meta)
      ? singleRow.props.meta
      : {};

  const canPatchSection = typeof onPatchRootSectionPageSpacing === 'function' && rootRows.length > 0;

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
      {themeTokensPersist?.status !== 'idle' ? (
        <p
          className="bld-field-note"
          style={{
            marginTop: 4,
            color: themeTokensPersist.status === 'error' ? '#ef4444' : undefined,
          }}
        >
          {themeTokensPersist.status === 'saving'
            ? 'Saving theme tokens…'
            : themeTokensPersist.status === 'saved'
              ? 'Theme tokens saved.'
              : themeTokensPersist.status === 'error'
                ? `Theme tokens save failed: ${themeTokensPersist.error || 'Unknown error'}`
                : null}
        </p>
      ) : null}
      {stylePresetsPersist?.status !== 'idle' ? (
        <p
          className="bld-field-note"
          style={{
            marginTop: 4,
            color: stylePresetsPersist.status === 'error' ? '#ef4444' : undefined,
          }}
        >
          {stylePresetsPersist.status === 'saving'
            ? 'Saving style presets…'
            : stylePresetsPersist.status === 'saved'
              ? 'Style presets saved.'
              : stylePresetsPersist.status === 'error'
                ? `Style presets save failed: ${stylePresetsPersist.error || 'Unknown error'}`
                : null}
        </p>
      ) : null}
      {hideBrandSections ? (
        <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
          Brand colors and font are in the left <strong>Theme</strong> panel. Advanced settings below.
        </p>
      ) : (
        <>
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
        </>
      )}

      <details className="bld-acc" style={{ marginTop: 10 }}>
        <summary>Design tokens (global)</summary>
        <div className="bld-acc__body">
          <p className="bld-field-note" style={{ marginTop: 0 }}>
            Tokens are stored on <strong>projects.config_json.themeTokens</strong> with per-mode palettes{' '}
            <code>light</code> / <code>dark</code>. Active mode sets CSS vars like <code>--token-color-primary</code>.
          </p>

          <div className="bld-tiny-toggle" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={`bld-tiny-toggle__btn ${tokenMode === 'light' ? 'is-active' : ''}`}
              onClick={() => setTokenMode('light')}
            >
              Light tokens
            </button>
            <button
              type="button"
              className={`bld-tiny-toggle__btn ${tokenMode === 'dark' ? 'is-active' : ''}`}
              onClick={() => setTokenMode('dark')}
            >
              Dark tokens
            </button>
          </div>
          <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 10 }}>
            Editing applies to the <strong>{tokenMode}</strong> palette. Canvas, preview, and live use the active mode
            after save.
          </p>

          <Section title="Token colors">
            <ColorRow
              fieldId="tok-c-primary"
              label="Primary"
              value={tokenColors.primary}
              onChange={(v) => patchTokenGroup('colors', { primary: v })}
            />
            <ColorRow
              fieldId="tok-c-secondary"
              label="Secondary"
              value={tokenColors.secondary}
              onChange={(v) => patchTokenGroup('colors', { secondary: v })}
            />
            <ColorRow
              fieldId="tok-c-accent"
              label="Accent"
              value={tokenColors.accent}
              onChange={(v) => patchTokenGroup('colors', { accent: v })}
            />
            <ColorRow
              fieldId="tok-c-bg"
              label="Background"
              value={tokenColors.background}
              onChange={(v) => patchTokenGroup('colors', { background: v })}
            />
            <ColorRow
              fieldId="tok-c-surface"
              label="Surface"
              value={tokenColors.surface}
              onChange={(v) => patchTokenGroup('colors', { surface: v })}
            />
            <ColorRow
              fieldId="tok-c-text"
              label="Text"
              value={tokenColors.text}
              onChange={(v) => patchTokenGroup('colors', { text: v })}
            />
            <ColorRow
              fieldId="tok-c-border"
              label="Border"
              value={tokenColors.border}
              onChange={(v) => patchTokenGroup('colors', { border: v })}
            />
            <ColorRow
              fieldId="tok-c-on-primary"
              label="On primary"
              value={tokenColors.onPrimary}
              onChange={(v) => patchTokenGroup('colors', { onPrimary: v })}
            />
          </Section>

          <Section title="Token status">
            <ColorRow
              fieldId="tok-c-success"
              label="Success"
              value={tokenColors.success}
              onChange={(v) => patchTokenGroup('colors', { success: v })}
            />
            <ColorRow
              fieldId="tok-c-success-bg"
              label="Success background"
              value={tokenColors.successBg}
              onChange={(v) => patchTokenGroup('colors', { successBg: v })}
            />
            <ColorRow
              fieldId="tok-c-warning"
              label="Warning"
              value={tokenColors.warning}
              onChange={(v) => patchTokenGroup('colors', { warning: v })}
            />
            <ColorRow
              fieldId="tok-c-warning-bg"
              label="Warning background"
              value={tokenColors.warningBg}
              onChange={(v) => patchTokenGroup('colors', { warningBg: v })}
            />
            <ColorRow
              fieldId="tok-c-error"
              label="Error"
              value={tokenColors.error}
              onChange={(v) => patchTokenGroup('colors', { error: v })}
            />
            <ColorRow
              fieldId="tok-c-error-bg"
              label="Error background"
              value={tokenColors.errorBg}
              onChange={(v) => patchTokenGroup('colors', { errorBg: v })}
            />
            <ColorRow
              fieldId="tok-c-info"
              label="Info"
              value={tokenColors.info}
              onChange={(v) => patchTokenGroup('colors', { info: v })}
            />
            <ColorRow
              fieldId="tok-c-info-bg"
              label="Info background"
              value={tokenColors.infoBg}
              onChange={(v) => patchTokenGroup('colors', { infoBg: v })}
            />
          </Section>

          <Section title="Token gradients">
            <TextRow
              fieldId="tok-g-hero"
              label="Hero gradient"
              value={tokenGradients.hero}
              placeholder="linear-gradient(135deg, …)"
              onChange={(v) => patchTokenGroup('gradients', { hero: v })}
            />
            <TextRow
              fieldId="tok-g-surface"
              label="Surface gradient"
              value={tokenGradients.surface}
              placeholder="linear-gradient(180deg, …)"
              onChange={(v) => patchTokenGroup('gradients', { surface: v })}
            />
            <TextRow
              fieldId="tok-g-section"
              label="Section gradient"
              value={tokenGradients.section}
              placeholder="linear-gradient(145deg, …)"
              onChange={(v) => patchTokenGroup('gradients', { section: v })}
            />
          </Section>

          <Section title="Token spacing">
            <div className="bld-field-grid">
              <TextRow fieldId="tok-sp-xs" label="XS" value={tokenSpacing.xs} placeholder="4px" onChange={(v) => patchTokenGroup('spacing', { xs: v })} />
              <TextRow fieldId="tok-sp-sm" label="SM" value={tokenSpacing.sm} placeholder="8px" onChange={(v) => patchTokenGroup('spacing', { sm: v })} />
              <TextRow fieldId="tok-sp-md" label="MD" value={tokenSpacing.md} placeholder="16px" onChange={(v) => patchTokenGroup('spacing', { md: v })} />
              <TextRow fieldId="tok-sp-lg" label="LG" value={tokenSpacing.lg} placeholder="24px" onChange={(v) => patchTokenGroup('spacing', { lg: v })} />
              <TextRow fieldId="tok-sp-xl" label="XL" value={tokenSpacing.xl} placeholder="32px" onChange={(v) => patchTokenGroup('spacing', { xl: v })} />
            </div>
          </Section>

          <Section title="Token radius">
            <div className="bld-field-grid">
              <TextRow fieldId="tok-r-sm" label="SM" value={tokenRadius.sm} placeholder="8px" onChange={(v) => patchTokenGroup('radius', { sm: v })} />
              <TextRow fieldId="tok-r-md" label="MD" value={tokenRadius.md} placeholder="12px" onChange={(v) => patchTokenGroup('radius', { md: v })} />
              <TextRow fieldId="tok-r-lg" label="LG" value={tokenRadius.lg} placeholder="16px" onChange={(v) => patchTokenGroup('radius', { lg: v })} />
              <TextRow fieldId="tok-r-pill" label="Pill" value={tokenRadius.pill} placeholder="999px" onChange={(v) => patchTokenGroup('radius', { pill: v })} />
            </div>
          </Section>

          <Section title="Token shadows">
            <TextRow fieldId="tok-sh-sm" label="Shadow sm" value={tokenShadows.sm} placeholder="0 2px 8px rgba(15,23,42,0.10)" onChange={(v) => patchTokenGroup('shadows', { sm: v })} />
            <TextRow fieldId="tok-sh-md" label="Shadow md" value={tokenShadows.md} placeholder="0 10px 24px rgba(15,23,42,0.14)" onChange={(v) => patchTokenGroup('shadows', { md: v })} />
            <TextRow fieldId="tok-sh-lg" label="Shadow lg" value={tokenShadows.lg} placeholder="0 18px 42px rgba(15,23,42,0.16)" onChange={(v) => patchTokenGroup('shadows', { lg: v })} />
          </Section>

          <Section title="Token motion">
            <div className="bld-field-grid">
              <TextRow fieldId="tok-m-fast" label="Fast" value={tokenMotion.fast} placeholder="140ms" onChange={(v) => patchTokenGroup('motion', { fast: v })} />
              <TextRow fieldId="tok-m-base" label="Base" value={tokenMotion.base} placeholder="200ms" onChange={(v) => patchTokenGroup('motion', { base: v })} />
              <TextRow fieldId="tok-m-slow" label="Slow" value={tokenMotion.slow} placeholder="320ms" onChange={(v) => patchTokenGroup('motion', { slow: v })} />
            </div>
            <TextRow fieldId="tok-m-easing" label="Easing" value={tokenMotion.easing} placeholder="cubic-bezier(0.16, 1, 0.3, 1)" onChange={(v) => patchTokenGroup('motion', { easing: v })} />
          </Section>
        </div>
      </details>

      <details className="bld-acc" style={{ marginTop: 10 }}>
        <summary>Component presets &amp; variants</summary>
        <div className="bld-acc__body">
          <p className="bld-field-note" style={{ marginTop: 0 }}>
            Presets are stored on <strong>projects.config_json.stylePresets</strong>. Nodes can attach via{' '}
            <code>props.presetId</code> or by using a style variant (where supported).
          </p>

          <div className="bld-field-grid">
            <div className="bld-field">
              <label className="bld-label">Preset</label>
              <select
                className="bld-input"
                value={activePresetId || ''}
                onChange={(e) => setActivePresetId(e.target.value)}
              >
                <option value="">— Select preset —</option>
                {presetsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="bld-field">
              <label className="bld-label">Create</label>
              <button
                type="button"
                className="bld-btn bld-btn--primary"
                onClick={() => {
                  const id = `custom.${Date.now()}`;
                  const next = normalizeStylePresets({
                    ...presetsNorm,
                    presets: [
                      ...(presetsNorm.presets || []),
                      {
                        id,
                        category: 'custom',
                        nodeType: 'button',
                        variant: 'custom',
                        name: 'Custom preset',
                        style_json: { desktop: {} },
                      },
                    ],
                  });
                  setStylePresets(next);
                  setActivePresetId(id);
                }}
              >
                New preset
              </button>
            </div>
          </div>

          {activePreset ? (
            <>
              <div className="bld-field-grid" style={{ marginTop: 10 }}>
                <TextRow
                  fieldId="preset-name"
                  label="Name"
                  value={activePreset.name || ''}
                  onChange={(v) =>
                    setStylePresets((prev) => {
                      const cur = normalizeStylePresets(prev);
                      return {
                        ...cur,
                        presets: (cur.presets || []).map((p) => (p.id === activePreset.id ? { ...p, name: v } : p)),
                      };
                    })
                  }
                />
                <TextRow
                  fieldId="preset-category"
                  label="Category"
                  value={activePreset.category || ''}
                  placeholder="button / card / section / text / form ..."
                  onChange={(v) =>
                    setStylePresets((prev) => {
                      const cur = normalizeStylePresets(prev);
                      return {
                        ...cur,
                        presets: (cur.presets || []).map((p) =>
                          p.id === activePreset.id ? { ...p, category: v } : p
                        ),
                      };
                    })
                  }
                />
                <TextRow
                  fieldId="preset-node-type"
                  label="Node type"
                  value={activePreset.nodeType || ''}
                  placeholder="button / row / content_card / heading ..."
                  onChange={(v) =>
                    setStylePresets((prev) => {
                      const cur = normalizeStylePresets(prev);
                      return {
                        ...cur,
                        presets: (cur.presets || []).map((p) =>
                          p.id === activePreset.id ? { ...p, nodeType: v } : p
                        ),
                      };
                    })
                  }
                />
                <TextRow
                  fieldId="preset-variant"
                  label="Variant"
                  value={activePreset.variant || ''}
                  placeholder="primary / secondary / glass ..."
                  onChange={(v) =>
                    setStylePresets((prev) => {
                      const cur = normalizeStylePresets(prev);
                      return {
                        ...cur,
                        presets: (cur.presets || []).map((p) =>
                          p.id === activePreset.id ? { ...p, variant: v } : p
                        ),
                      };
                    })
                  }
                />
              </div>

              <div className="bld-field" style={{ marginTop: 10 }}>
                <label className="bld-label">Preset style_json (responsive)</label>
                <textarea
                  className="bld-input"
                  style={{ minHeight: 180, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  value={presetDraftJson}
                  onChange={(e) => setPresetDraftJson(e.target.value)}
                  placeholder='{"desktop": {"colors": {"backgroundColor": "token-color-primary"}}}'
                />
                <div className="bld-field-grid" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => {
                      try {
                        const nextJson = JSON.parse(presetDraftJson || '{}');
                        setStylePresets((prev) => {
                          const cur = normalizeStylePresets(prev);
                          return {
                            ...cur,
                            presets: (cur.presets || []).map((p) =>
                              p.id === activePreset.id ? { ...p, style_json: nextJson } : p
                            ),
                          };
                        });
                      } catch {
                        // ignore invalid JSON; keep draft
                      }
                    }}
                  >
                    Apply JSON
                  </button>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => {
                      const id = `copy.${Date.now()}`;
                      setStylePresets((prev) => {
                        const cur = normalizeStylePresets(prev);
                        const src = cur.presets.find((p) => p.id === activePreset.id);
                        if (!src) return cur;
                        return {
                          ...cur,
                          presets: [...cur.presets, { ...src, id, name: `${src.name || src.id} (copy)` }],
                        };
                      });
                      setActivePresetId(id);
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => {
                      setStylePresets((prev) => {
                        const cur = normalizeStylePresets(prev);
                        return { ...cur, presets: (cur.presets || []).filter((p) => p.id !== activePreset.id) };
                      });
                      setActivePresetId('');
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </details>

      {hideBrandSections ? null : (
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
      )}
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
          <p className="bld-field-note" style={{ marginTop: 0, fontSize: 10, lineHeight: 1.3 }}>
            Page slug not available. Open via builder page route to enable per-page spacing controls.
          </p>
        ) : (
          <div className="bld-theme-page-spacing">
            <div className="bld-panel__subhead" style={{ marginTop: 0, marginBottom: 4 }}>
              Gap between full-width strips
            </div>
            <InspectorTipChips
              size="xs"
              chips={['Between strips only', 'Not content height', 'Gap to next']}
            />
            {pageSectionGap <= 0 ? (
              <InspectorTipChips
                size="xs"
                style={{ marginTop: 4 }}
                chips={['Gap is zero', 'Strips may touch', 'Try 24 or 40']}
              />
            ) : null}
            <InspectorNumField
              id="page-section-gap"
              label="Gap between sections (px)"
              min={0}
              max={9999}
              value={pageSectionGap}
              onChange={(n) => patchPageVar('sectionGapPx', n ?? 0)}
            />

            <div className="bld-panel__subhead" style={{ marginTop: 14, marginBottom: 4 }}>
              Different gap for one strip only
            </div>
            <div className="bld-field">
              <label className="bld-label" htmlFor="theme-override-section-row">
                Only adjust this strip
              </label>
              <select
                id="theme-override-section-row"
                className="bld-input"
                value={overrideSectionId != null ? String(overrideSectionId) : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setOverrideSectionId(v === '' ? null : Number(v));
                }}
                disabled={!canPatchSection}
                title={!canPatchSection ? 'No top-level sections on this page' : undefined}
              >
                <option value="">— Every section uses the numbers above —</option>
                {rootRows.map((r, i) => (
                  <option key={r.id} value={String(r.id)}>
                    {(r.displayName || r.nodeType || 'Section').trim()} {rootRows.length > 1 ? `(${i + 1})` : ''}
                  </option>
                ))}
              </select>
              <InspectorTipChips
                size="xs"
                style={{ marginTop: 4 }}
                chips={['Between strips only', 'Empty field', `Uses ${pageSectionGap}px`]}
              />
            </div>

            {singleRow ? (
              <>
                <div className="bld-field-grid" style={{ marginTop: 8 }}>
                  <div className="bld-field">
                    <InspectorNumField
                      id="theme-single-gap-before"
                      label="Gap to strip above (outside)"
                      min={0}
                      max={9999}
                      placeholder={`Page default (${pageSectionGap})`}
                      value={singleMeta.sectionGapBeforePx}
                      onChange={(n) =>
                        onPatchRootSectionPageSpacing?.(singleRow.id, {
                          sectionGapBeforePx: n == null ? null : n,
                        })
                      }
                    />
                    <InspectorTipChips
                      id="theme-gap-before-hint"
                      size="xs"
                      chips={['Unused on first strip', 'Space under prior']}
                    />
                  </div>
                  <div className="bld-field">
                    <InspectorNumField
                      id="theme-single-gap-after"
                      label="Gap to strip below (outside)"
                      min={0}
                      max={9999}
                      placeholder={`Page default (${pageSectionGap})`}
                      value={singleMeta.sectionGapAfterPx}
                      onChange={(n) =>
                        onPatchRootSectionPageSpacing?.(singleRow.id, {
                          sectionGapAfterPx: n == null ? null : n,
                        })
                      }
                    />
                    <InspectorTipChips
                      id="theme-gap-after-hint"
                      size="xs"
                      chips={['Gap before next strip']}
                    />
                  </div>
                </div>
                <div className="bld-field-grid" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => onPatchRootSectionPageSpacing?.(singleRow.id, { sectionGapBeforePx: 0 })}
                  >
                    Flush to section above (0px)
                  </button>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => onPatchRootSectionPageSpacing?.(singleRow.id, { sectionGapAfterPx: 0 })}
                  >
                    Flush to section below (0px)
                  </button>
                  <button
                    type="button"
                    className="bld-chip"
                    style={{ gridColumn: '1 / -1' }}
                    onClick={() =>
                      onPatchRootSectionPageSpacing?.(singleRow.id, {
                        sectionGapBeforePx: null,
                        sectionGapAfterPx: null,
                      })
                    }
                  >
                    Clear gap overrides (use page gap)
                  </button>
                </div>
                <InspectorTipChips
                  size="xs"
                  style={{ marginTop: 8 }}
                  chips={['Logo to hero gap', 'Raise section gap', 'Inner pad not gap', 'Globals not listed']}
                />
              </>
            ) : null}

            <details style={{ marginTop: 12 }}>
              <summary
                className="bld-panel__subhead"
                style={{ cursor: 'pointer', userSelect: 'none', listStyle: 'none', marginBottom: 4 }}
              >
                Optional: inner bottom padding (inside a strip)
              </summary>
              <InspectorTipChips
                size="xs"
                chips={['Inside bottom only', 'Not strip-to-strip']}
              />
              <NumRow
                fieldId="page-section-pad-bottom"
                label="Default bottom padding (all sections)"
                value={pageSectionPadBottom}
                onChange={(v) => patchPageVar('sectionPadBottomPx', Math.max(0, Number(v) || 0))}
              />
              {singleRow ? (
                <div className="bld-field" style={{ marginTop: 10 }}>
                  <InspectorNumField
                    id="theme-single-pad-bottom"
                    label="This strip only (overrides default)"
                    min={0}
                    max={9999}
                    placeholder={`Page default (${pageSectionPadBottom})`}
                    value={singleMeta.sectionPadBottomPx}
                    onChange={(n) =>
                      onPatchRootSectionPageSpacing?.(singleRow.id, {
                        sectionPadBottomPx: n == null ? null : n,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="bld-chip"
                    style={{ marginTop: 8 }}
                    onClick={() => onPatchRootSectionPageSpacing?.(singleRow.id, { sectionPadBottomPx: null })}
                  >
                    Clear padding override for this strip
                  </button>
                </div>
              ) : null}
            </details>

            <details className="bld-acc" open>
              <summary>Page responsive (tablet &amp; mobile)</summary>
              <div className="bld-acc__body">
                <PageResponsivePanel
                  pageTree={pageTree}
                  onApplyResponsiveToPage={onApplyResponsiveToPage}
                  isApplying={isApplyingResponsive}
                />
              </div>
            </details>

            <div className="bld-panel__subhead" style={{ marginTop: 16, marginBottom: 4 }}>
              Page width (live + preview)
            </div>
            <InspectorNumField
              id="page-content-max-width"
              label="Max content width (px), optional"
              min={320}
              max={2560}
              step={20}
              placeholder="1200 — default when empty"
              value={pageVars.contentMaxWidthPx}
              onChange={(n) => patchPageVar('contentMaxWidthPx', n == null ? null : n)}
            />
            <InspectorTipChips
              size="xs"
              style={{ marginTop: 4 }}
              chips={['Clears to 1200px default', 'Builder + site same cap', 'Wider screens']}
            />

            <div className="bld-panel__subhead" style={{ marginTop: 16, marginBottom: 4 }}>
              Sticky header (live site)
            </div>
            <div className="bld-field">
              <label className="bld-label" htmlFor="page-sticky-header">
                Pin header while scrolling
              </label>
              <select
                id="page-sticky-header"
                className="bld-input"
                value={stickyHeader ? 'yes' : 'no'}
                onChange={(e) => patchPageVar('stickyHeader', e.target.value === 'yes')}
              >
                <option value="no">Off — header scrolls away with the page</option>
                <option value="yes">On — header stays at the top while scrolling</option>
              </select>
              <InspectorTipChips
                size="xs"
                style={{ marginTop: 4 }}
                chips={['Live preview only', 'Top header row', 'Or global header', 'Avoid absolute row']}
              />
            </div>
            </div>
        )}
      </Section>
    </div>
  );
}
