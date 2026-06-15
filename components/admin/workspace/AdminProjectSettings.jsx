'use client';

import { useCallback, useEffect, useState } from 'react';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-settings.css';

const EXPORT_OPTIONS = [
  {
    id: 'project',
    title: 'Project JSON',
    description: 'Project config, pages list, domains, and global component snapshots.',
    ext: 'json',
    icon: 'P',
    statKey: null,
    statLabel: 'Full config',
  },
  {
    id: 'pages',
    title: 'Page snapshots',
    description: 'Draft and published/archived version snapshots for every page.',
    ext: 'json',
    icon: 'Pg',
    statKey: 'pages',
    statLabel: 'pages',
  },
  {
    id: 'cms',
    title: 'CMS export',
    description: 'All collections, schemas, and items (draft + published).',
    ext: 'json',
    icon: 'C',
    statKey: 'cmsCollections',
    statLabel: 'collections',
  },
  {
    id: 'forms',
    title: 'Form submissions',
    description: 'All stored form leads for this project as CSV.',
    ext: 'csv',
    icon: 'F',
    statKey: 'formSubmissions',
    statLabel: 'submissions',
    csv: true,
  },
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export default function AdminProjectSettings({ projectId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState('');
  const [exported, setExported] = useState('');

  const pid = Number(projectId);

  const load = useCallback(async () => {
    if (!Number.isInteger(pid) || pid <= 0) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson(`/api/projects/${pid}/settings`, { cache: 'no-store' });
      setSummary(data);
    } catch (e) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadBackup = async (option) => {
    setExporting(option.id);
    setExported('');
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/projects/${pid}/backup?type=${encodeURIComponent(option.id)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const slug = summary?.project?.slug || 'project';
      const fallback = `${slug}-${option.id}-backup.${option.ext}`;
      const filename = match?.[1] || fallback;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setExported(option.id);
      setSuccess(`${option.title} downloaded.`);
      window.setTimeout(() => setExported(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting('');
    }
  };

  const project = summary?.project;
  const stats = summary?.stats || {};

  if (loading) {
    return (
      <div className="proj-settings">
        <p className="proj-settings__loading">Loading project settings…</p>
        <div className="proj-settings__skeleton" aria-hidden="true" />
      </div>
    );
  }

  if (!summary?.project) {
    return (
      <div className="proj-settings">
        <div className="proj-settings__alert proj-settings__alert--error">{error || 'Project not found'}</div>
        <button type="button" className="proj-settings__btn" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="proj-settings">
      <header className="proj-settings__hero">
        <div>
          <p className="proj-settings__badge">Workspace · Settings</p>
          <h1 className="proj-settings__title">Project settings</h1>
          <p className="proj-settings__sub">
            <strong>{project.name}</strong> — backup exports, metadata, and point-in-time snapshots for this project.
          </p>
        </div>
        <div className="proj-settings__stats">
          <div className="proj-settings__stat">
            <span className="proj-settings__stat-val">{stats.pages ?? 0}</span>
            <span className="proj-settings__stat-lbl">Pages</span>
          </div>
          <div className="proj-settings__stat">
            <span className="proj-settings__stat-val">{stats.publishedPages ?? 0}</span>
            <span className="proj-settings__stat-lbl">Published</span>
          </div>
          <div className="proj-settings__stat">
            <span className="proj-settings__stat-val">{stats.domains ?? 0}</span>
            <span className="proj-settings__stat-lbl">Domains</span>
          </div>
          <div className="proj-settings__stat">
            <span className="proj-settings__stat-val">{stats.media ?? 0}</span>
            <span className="proj-settings__stat-lbl">Media</span>
          </div>
        </div>
      </header>

      {error ? <div className="proj-settings__alert proj-settings__alert--error">{error}</div> : null}
      {success ? <div className="proj-settings__alert proj-settings__alert--ok">{success}</div> : null}

      <section className="proj-settings__section">
        <div className="proj-settings__section-head">
          <h2 className="proj-settings__section-title">Project metadata</h2>
          <p className="proj-settings__section-desc">Read-only summary from the database.</p>
        </div>
        <div className="proj-settings__meta-grid">
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Slug</span>
            <span className="proj-settings__meta-value proj-settings__meta-value--mono">{project.slug}</span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Type</span>
            <span className="proj-settings__meta-value">{project.type || 'website'}</span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Theme</span>
            <span className="proj-settings__meta-value">
              {stats.themePreset === 'dark' ? 'Dark' : 'Light'} · rev {stats.themeRevision ?? 0}
            </span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">CMS collections</span>
            <span className="proj-settings__meta-value">{stats.cmsCollections ?? 0}</span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Form submissions</span>
            <span className="proj-settings__meta-value">{stats.formSubmissions ?? 0}</span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Created</span>
            <span className="proj-settings__meta-value">{formatDate(project.createdAt)}</span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Last updated</span>
            <span className="proj-settings__meta-value">{formatDate(project.updatedAt)}</span>
          </div>
          <div className="proj-settings__meta-card">
            <span className="proj-settings__meta-label">Project ID</span>
            <span className="proj-settings__meta-value proj-settings__meta-value--mono">#{project.id}</span>
          </div>
        </div>
      </section>

      <section className="proj-settings__section">
        <div className="proj-settings__section-head">
          <h2 className="proj-settings__section-title">Backup exports</h2>
          <p className="proj-settings__section-desc">
            Point-in-time snapshots for migration or archival — not automated full-database restore.
          </p>
        </div>
        <div className="proj-settings__export-grid">
          {EXPORT_OPTIONS.map((option) => {
            const busy = exporting === option.id;
            const done = exported === option.id;
            const count =
              option.statKey && stats[option.statKey] != null ? stats[option.statKey] : null;
            return (
              <article
                key={option.id}
                className={`proj-settings__export-card${busy ? ' is-busy' : ''}${done ? ' is-done' : ''}`}
              >
                <div className="proj-settings__export-top">
                  <span
                    className={`proj-settings__export-icon${option.csv ? ' proj-settings__export-icon--csv' : ''}`}
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>
                  <div>
                    <h3 className="proj-settings__export-title">{option.title}</h3>
                    <p className="proj-settings__export-desc">{option.description}</p>
                  </div>
                </div>
                {count != null ? (
                  <p className="proj-settings__export-meta">
                    {count} {option.statLabel} in project
                  </p>
                ) : (
                  <p className="proj-settings__export-meta">{option.statLabel}</p>
                )}
                <div className="proj-settings__export-actions">
                  <button
                    type="button"
                    className="proj-settings__btn proj-settings__btn--primary"
                    disabled={Boolean(exporting)}
                    onClick={() => downloadBackup(option)}
                  >
                    {busy ? 'Exporting…' : `Download .${option.ext}`}
                  </button>
                  {done ? <span className="proj-settings__done">Downloaded</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
