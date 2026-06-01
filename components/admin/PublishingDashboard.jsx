'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';

export default function PublishingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/publishing', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publishPage = async (pageId) => {
    await fetch(`/api/pages/${pageId}/publish`, { method: 'POST' });
    await load();
  };

  const summary = data?.summary || {};

  return (
    <div className="platform-shell">
      <h1>Publishing manager</h1>
      <p className="platform-shell__sub">
        Projects, pages, publish status, SEO/audit scores, and domains.
      </p>

      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}
      {data?.warning && <p>{data.warning}</p>}

      {data && (
        <>
          <div className="platform-grid">
            <div className="platform-card">
              <div className="platform-card__score">{summary.projects ?? 0}</div>
              <div>Projects</div>
            </div>
            <div className="platform-card">
              <div className="platform-card__score">{summary.pages ?? 0}</div>
              <div>Pages</div>
            </div>
            <div className="platform-card">
              <div className="platform-card__score">{summary.published ?? 0}</div>
              <div>Published</div>
            </div>
            <div className="platform-card">
              <div className="platform-card__score">{summary.drafts ?? 0}</div>
              <div>Drafts</div>
            </div>
          </div>

          <h2>Projects</h2>
          <table className="platform-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Pages</th>
                <th>Published</th>
                <th>Domain</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.projects || []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.slug}</div>
                  </td>
                  <td>{p.pagesCount}</td>
                  <td>{p.publishedCount}</td>
                  <td>{p.domainStatus}</td>
                  <td>
                    <Link className="platform-btn" href={`/admin/builder`}>
                      Builder
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: 32 }}>Pages</h2>
          <table className="platform-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Status</th>
                <th>Last publish</th>
                <th>SEO</th>
                <th>Audit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.pages || []).map((pg) => (
                <tr key={pg.id}>
                  <td>
                    <strong>{pg.title}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {pg.projectSlug}/{pg.slug}
                    </div>
                  </td>
                  <td>{pg.status}</td>
                  <td>
                    {pg.lastPublishAt ? new Date(pg.lastPublishAt).toLocaleString() : '—'}
                  </td>
                  <td>{pg.seoScore ?? '—'}</td>
                  <td>{pg.auditScore ?? '—'}</td>
                  <td>
                    <div className="platform-actions">
                      <Link
                        className="platform-btn"
                        href={adminBuilderPagePath(pg.projectSlug, pg.slug)}
                      >
                        Edit
                      </Link>
                      <Link
                        className="platform-btn"
                        href={previewPagePath(pg.projectSlug, pg.slug)}
                        target="_blank"
                      >
                        Preview
                      </Link>
                      {pg.status === 'published' && (
                        <Link
                          className="platform-btn"
                          href={publicPagePath(pg.projectSlug, pg.slug)}
                          target="_blank"
                        >
                          Live
                        </Link>
                      )}
                      <button
                        type="button"
                        className="platform-btn platform-btn--primary"
                        onClick={() => publishPage(pg.id)}
                      >
                        Publish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/admin/platform-health">Platform health panel →</Link>
      </p>
    </div>
  );
}
