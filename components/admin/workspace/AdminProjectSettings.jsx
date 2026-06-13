'use client';

import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import '@/styles/admin/platform.css';

const EXPORT_OPTIONS = [
  {
    id: 'project',
    title: 'Project JSON',
    description: 'Project config, pages list, domains, and global component snapshots.',
    ext: 'json',
  },
  {
    id: 'pages',
    title: 'Page snapshots',
    description: 'Draft and published/archived version snapshots for every page.',
    ext: 'json',
  },
  {
    id: 'cms',
    title: 'CMS export',
    description: 'All collections, schemas, and items (draft + published).',
    ext: 'json',
  },
  {
    id: 'forms',
    title: 'Form submissions',
    description: 'All stored form leads for this project as CSV.',
    ext: 'csv',
  },
];

export default function AdminProjectSettings({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;
    fetch('/api/projects', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((data) => {
        const found = (data.projects || []).find((p) => Number(p.id) === pid);
        if (!found) throw new Error('Project not found');
        setProject(found);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const downloadBackup = async (type) => {
    setExporting(type);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/backup?type=${encodeURIComponent(type)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `${project?.slug || 'project'}-${type}-backup.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · Settings"
        title="Project settings"
        description={
          project?.name
            ? `${project.name} — backup exports and project metadata.`
            : 'Backup exports and project metadata.'
        }
      />

      {loading ? (
        <div className="platform-skeleton platform-skeleton--card" style={{ height: 200 }} aria-hidden="true" />
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <>
          <section className="platform-panel" style={{ marginBottom: 20 }}>
            <div className="platform-panel__head">
              <div>
                <h2 className="platform-panel__title">Project metadata</h2>
                <p className="platform-panel__sub">Read-only summary</p>
              </div>
            </div>
            <div className="platform-panel__body platform-panel__body--padded">
              <div className="platform-grid">
                <div className="platform-card">
                  <div className="platform-card__score">{project?.slug || '—'}</div>
                  <div>Slug</div>
                </div>
                <div className="platform-card">
                  <div className="platform-card__score">{project?.type || 'website'}</div>
                  <div>Type</div>
                </div>
                <div className="platform-card">
                  <div className="platform-card__score">{project?.pageCount ?? '—'}</div>
                  <div>Pages</div>
                </div>
              </div>
            </div>
          </section>

          <section className="platform-panel">
            <div className="platform-panel__head">
              <div>
                <h2 className="platform-panel__title">Backup exports</h2>
                <p className="platform-panel__sub">
                  Point-in-time snapshots — not full database restore automation.
                </p>
              </div>
            </div>
            <div className="platform-panel__body platform-panel__body--padded">
              <div className="backup-export-grid">
                {EXPORT_OPTIONS.map((option) => (
                  <div key={option.id} className="backup-export-card">
                    <strong>{option.title}</strong>
                    <p className="admin-page__description" style={{ margin: '8px 0 16px' }}>
                      {option.description}
                    </p>
                      <button
                        type="button"
                        className="platform-btn platform-btn--primary"
                        disabled={Boolean(exporting)}
                        onClick={() => downloadBackup(option.id)}
                      >
                        {exporting === option.id ? 'Exporting…' : `Download .${option.ext}`}
                      </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
