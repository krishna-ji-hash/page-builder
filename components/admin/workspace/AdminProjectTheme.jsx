'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import {
  normalizeSiteTheme,
  SITE_THEME_PRESETS,
  siteThemeToCssVariableStyle,
} from '@/lib/siteDesignTheme';
import {
  createModePalettesFromFlat,
  hasModePalettes,
  normalizeThemeTokens,
  syncThemeTokenPaletteFromSiteTheme,
} from '@/lib/themeTokens';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-theme.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

function ColorField({ id, label, value, onChange }) {
  const safe = typeof value === 'string' && value ? value : '#000000';
  return (
    <label className="proj-theme__color" htmlFor={id}>
      <span className="proj-theme__color-label">{label}</span>
      <span className="proj-theme__color-inputs">
        <input
          id={id}
          type="color"
          className="proj-theme__color-swatch"
          value={safe.startsWith('#') ? safe.slice(0, 7) : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="proj-theme__color-text"
          value={safe}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}

export default function AdminProjectTheme({ projectId }) {
  const [project, setProject] = useState(null);
  const [builderPageSlug, setBuilderPageSlug] = useState('home');
  const [siteTheme, setSiteTheme] = useState(null);
  const [themeTokens, setThemeTokens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dirty, setDirty] = useState(false);

  const pid = Number(projectId);

  const load = useCallback(async () => {
    if (!Number.isInteger(pid) || pid <= 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [themeData, projectsRes, pagesRes] = await Promise.all([
        fetchJson(`/api/projects/${pid}/theme`, { cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }),
        fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }),
      ]);
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };
      const pagesData = pagesRes.ok ? await pagesRes.json() : { pages: [] };
      const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
      if (!found) throw new Error('Project not found');
      setProject(found);
      const pages = Array.isArray(pagesData.pages) ? pagesData.pages : [];
      const home = pages.find((p) => p.slug === 'home') || pages[0];
      setBuilderPageSlug(home?.slug || 'home');
      setSiteTheme(normalizeSiteTheme(themeData.siteTheme));
      setThemeTokens(normalizeThemeTokens(themeData.themeTokens));
      setDirty(false);
    } catch (e) {
      setError(e?.message || 'Failed to load theme');
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (presetId) => {
    const preset = SITE_THEME_PRESETS[presetId];
    if (!preset) return;
    const mode = presetId === 'dark' ? 'dark' : 'light';
    setSiteTheme((prev) =>
      normalizeSiteTheme(
        { ...preset, presetId },
        { defaultRevision: prev?.revision ?? 0, defaultSchemaVersion: prev?.schemaVersion ?? 1 }
      )
    );
    setThemeTokens((prev) => {
      if (!prev) return prev;
      const mode = presetId === 'dark' ? 'dark' : 'light';
      let next = prev;
      if (prev.mode !== mode || !hasModePalettes(prev)) {
        if (hasModePalettes(prev)) next = normalizeThemeTokens({ ...prev, mode });
        else {
          const { light, dark } = createModePalettesFromFlat(prev);
          next = normalizeThemeTokens({ ...prev, mode, light, dark });
        }
      }
      const themed = normalizeSiteTheme(
        { ...preset, presetId },
        { defaultRevision: prev?.revision ?? 0, defaultSchemaVersion: prev?.schemaVersion ?? 1 }
      );
      return syncThemeTokenPaletteFromSiteTheme(themed, next);
    });
    setDirty(true);
    setSuccess('');
  };

  const patchColor = (key, value) => {
    setSiteTheme((prev) =>
      normalizeSiteTheme(
        { ...prev, colors: { ...prev.colors, [key]: value } },
        { defaultRevision: prev.revision, defaultSchemaVersion: prev.schemaVersion }
      )
    );
    setDirty(true);
    setSuccess('');
  };

  const patchTypography = (key, value) => {
    setSiteTheme((prev) =>
      normalizeSiteTheme(
        { ...prev, typography: { ...prev.typography, [key]: value } },
        { defaultRevision: prev.revision, defaultSchemaVersion: prev.schemaVersion }
      )
    );
    setDirty(true);
    setSuccess('');
  };

  const save = async () => {
    if (!siteTheme || !themeTokens) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const stRes = await fetchJson(`/api/projects/${pid}/site-theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteTheme, ifRevision: siteTheme.revision }),
      });
      const savedTheme = normalizeSiteTheme(stRes.siteTheme);
      setSiteTheme(savedTheme);

      const aligned = syncThemeTokenPaletteFromSiteTheme(savedTheme, themeTokens);
      const ttRes = await fetchJson(`/api/projects/${pid}/theme-tokens`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeTokens: aligned, ifRevision: themeTokens.revision }),
      });
      setThemeTokens(normalizeThemeTokens(ttRes.themeTokens));
      setDirty(false);
      setSuccess('Theme saved to project.');
    } catch (e) {
      const msg = e?.message || 'Failed to save theme';
      if (msg.includes('409') || msg.toLowerCase().includes('modified elsewhere')) {
        setError('Theme was updated elsewhere. Reloading…');
        await load();
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const previewStyle = useMemo(() => {
    if (!siteTheme) return {};
    return siteThemeToCssVariableStyle(siteTheme);
  }, [siteTheme]);

  const colors = siteTheme?.colors || {};
  const typography = siteTheme?.typography || {};
  const presetId = siteTheme?.presetId === 'dark' ? 'dark' : 'light';
  const tokenMode = themeTokens?.mode === 'dark' ? 'dark' : 'light';
  const builderHref = project?.slug
    ? adminBuilderPagePath(project.slug, builderPageSlug)
    : '/admin/builder';

  if (loading) {
    return (
      <div className="proj-theme">
        <p className="proj-theme__loading">Loading theme…</p>
      </div>
    );
  }

  if (!siteTheme) {
    return (
      <div className="proj-theme">
        <div className="proj-theme__alert proj-theme__alert--error">{error || 'Theme unavailable'}</div>
        <button type="button" className="proj-theme__btn" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="proj-theme">
      <header className="proj-theme__hero">
        <div>
          <p className="proj-theme__badge">Design system</p>
          <h1 className="proj-theme__title">Theme</h1>
          <p className="proj-theme__sub">
            Site-wide colors and typography for{' '}
            <strong>{project?.name || `Project #${pid}`}</strong>. Changes apply to builder, preview, and
            published pages.
          </p>
        </div>
        <div className="proj-theme__stats">
          <div className="proj-theme__stat">
            <span className="proj-theme__stat-val">{presetId === 'dark' ? 'Dark' : 'Light'}</span>
            <span className="proj-theme__stat-lbl">Preset</span>
          </div>
          <div className="proj-theme__stat">
            <span
              className="proj-theme__stat-swatch"
              style={{ background: colors.primary || '#2563eb' }}
              aria-hidden="true"
            />
            <span className="proj-theme__stat-lbl">Primary</span>
          </div>
          <div className="proj-theme__stat">
            <span className="proj-theme__stat-val">v{siteTheme.revision ?? 0}</span>
            <span className="proj-theme__stat-lbl">Revision</span>
          </div>
        </div>
      </header>

      {error ? <div className="proj-theme__alert proj-theme__alert--error">{error}</div> : null}
      {success ? <div className="proj-theme__alert proj-theme__alert--ok">{success}</div> : null}

      <div className="proj-theme__toolbar">
        <div className="proj-theme__preset-toggle" role="group" aria-label="Site preset">
          <button
            type="button"
            className={`proj-theme__preset-btn ${presetId === 'light' ? 'is-active' : ''}`}
            onClick={() => applyPreset('light')}
          >
            Light
          </button>
          <button
            type="button"
            className={`proj-theme__preset-btn ${presetId === 'dark' ? 'is-active' : ''}`}
            onClick={() => applyPreset('dark')}
          >
            Dark
          </button>
        </div>
        <div className="proj-theme__toolbar-actions">
          {dirty ? (
            <button type="button" className="proj-theme__btn proj-theme__btn--ghost" disabled={saving} onClick={load}>
              Discard
            </button>
          ) : null}
          <Link href={builderHref} className="proj-theme__btn proj-theme__btn--ghost">
            Open in builder
          </Link>
          <button
            type="button"
            className="proj-theme__btn proj-theme__btn--primary"
            disabled={saving || !dirty}
            onClick={save}
          >
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="proj-theme__grid">
        <section className="proj-theme__card">
          <h2 className="proj-theme__card-title">Brand colors</h2>
          <p className="proj-theme__card-desc">Core palette used across sections and components.</p>
          <div className="proj-theme__fields">
            <ColorField
              id="theme-primary"
              label="Primary"
              value={colors.primary}
              onChange={(v) => patchColor('primary', v)}
            />
            <ColorField
              id="theme-secondary"
              label="Secondary"
              value={colors.secondary}
              onChange={(v) => patchColor('secondary', v)}
            />
            <ColorField id="theme-text" label="Text" value={colors.text} onChange={(v) => patchColor('text', v)} />
            <ColorField
              id="theme-muted"
              label="Muted"
              value={colors.muted}
              onChange={(v) => patchColor('muted', v)}
            />
            <ColorField
              id="theme-bg"
              label="Background"
              value={colors.background}
              onChange={(v) => patchColor('background', v)}
            />
            <ColorField
              id="theme-surface"
              label="Surface"
              value={colors.surface}
              onChange={(v) => patchColor('surface', v)}
            />
            <ColorField
              id="theme-border"
              label="Border"
              value={colors.border}
              onChange={(v) => patchColor('border', v)}
            />
          </div>
        </section>

        <section className="proj-theme__card">
          <h2 className="proj-theme__card-title">Typography</h2>
          <p className="proj-theme__card-desc">Body and heading fonts for the whole site.</p>
          <div className="proj-theme__fields">
            <label className="proj-theme__field">
              <span className="proj-theme__field-label">Body font</span>
              <input
                type="text"
                className="proj-theme__text-input"
                value={typography.fontFamily || ''}
                onChange={(e) => patchTypography('fontFamily', e.target.value)}
              />
            </label>
            <label className="proj-theme__field">
              <span className="proj-theme__field-label">Heading font</span>
              <input
                type="text"
                className="proj-theme__text-input"
                value={typography.fontFamilyHeading || typography.fontFamily || ''}
                onChange={(e) => patchTypography('fontFamilyHeading', e.target.value)}
              />
            </label>
            <label className="proj-theme__field">
              <span className="proj-theme__field-label">Base size</span>
              <input
                type="text"
                className="proj-theme__text-input"
                value={typography.fontSizeBase || '16px'}
                onChange={(e) => patchTypography('fontSizeBase', e.target.value)}
              />
            </label>
          </div>
          <div className="proj-theme__meta">
            <span className="proj-theme__meta-pill">Token mode: {tokenMode}</span>
            <span className="proj-theme__meta-note">Synced with preset on save</span>
          </div>
        </section>

        <section className="proj-theme__card proj-theme__card--preview">
          <h2 className="proj-theme__card-title">Live preview</h2>
          <p className="proj-theme__card-desc">How headings, body copy, and buttons will look.</p>
          <div className="proj-theme__preview" style={previewStyle}>
            <div className="proj-theme__preview-inner">
              <p className="proj-theme__preview-kicker">Sample section</p>
              <h3 className="proj-theme__preview-heading">Build something remarkable</h3>
              <p className="proj-theme__preview-body">
                Theme tokens flow through the builder, draft preview, and live site — one source of truth in the
                database.
              </p>
              <button type="button" className="proj-theme__preview-btn">
                Primary action
              </button>
              <button type="button" className="proj-theme__preview-btn proj-theme__preview-btn--ghost">
                Secondary
              </button>
            </div>
          </div>
        </section>

        <section className="proj-theme__card proj-theme__card--note">
          <p className="proj-theme__note-badge">Builder</p>
          <h2 className="proj-theme__card-title">Advanced theme controls</h2>
          <p className="proj-theme__card-desc">
            Per-page spacing, section overrides, style presets, and animation presets are edited in the builder Theme
            panel. This page covers project-wide brand colors and typography.
          </p>
          <Link href={builderHref} className="proj-theme__link">
            Open builder theme panel →
          </Link>
        </section>
      </div>
    </div>
  );
}
