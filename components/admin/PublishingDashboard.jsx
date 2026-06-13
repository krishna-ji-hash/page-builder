'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ADMIN_PROJECTS_PATH,
  adminProjectSectionPath,
} from '@/lib/admin/adminRoutes';
import PublishChecklistModal from '@/components/builder/publish/PublishChecklistModal';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';

function domainStatusClass(status) {
  if (status === 'verified') return 'platform-status--verified';
  if (status === 'pending') return 'platform-status--pending';
  return 'platform-status--none';
}

function domainStatusLabel(status) {
  if (status === 'verified') return 'Verified';
  if (status === 'pending') return 'Pending';
  return 'No domain';
}

function scoreClass(score) {
  if (score == null) return 'platform-score--muted';
  if (score >= 80) return 'platform-score--good';
  if (score >= 50) return 'platform-score--warn';
  return 'platform-score--warn';
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function PublishingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [checklistPage, setChecklistPage] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/platform/publishing', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publishPage = async (page) => {
    setChecklistOpen(true);
    setChecklistLoading(true);
    setChecklistError('');
    setChecklist(null);
    setChecklistPage(page);
    try {
      const res = await fetch(`/api/pages/${page.id}/publish-checklist`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Checklist failed');
      setChecklist(json.checklist || null);
    } catch (err) {
      setChecklistError(err instanceof Error ? err.message : String(err));
    } finally {
      setChecklistLoading(false);
    }
  };

  const executePublish = async () => {
    if (!checklistPage?.id) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/pages/${checklistPage.id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Publish failed');
      }
      setChecklistOpen(false);
      await load(true);
    } catch (err) {
      setChecklistError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishPage = async (page) => {
    const label = `${page.projectSlug}/${page.slug}`;
    if (
      !window.confirm(
        `Unpublish "${page.title}" (${label})? The live URL will go offline. The draft stays editable.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/pages/${page.id}/unpublish`, { method: 'POST' });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      window.alert(errData?.error || 'Unpublish failed');
      return;
    }
    await load(true);
  };

  const summary = data?.summary || {};

  const filteredPages = useMemo(() => {
    const pages = data?.pages || [];
    const q = search.trim().toLowerCase();
    return pages.filter((pg) => {
      if (statusFilter !== 'all' && pg.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${pg.title} ${pg.projectSlug} ${pg.slug}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data?.pages, search, statusFilter]);

  const publishedCount = (data?.pages || []).filter((p) => p.status === 'published').length;
  const draftCount = (data?.pages || []).filter((p) => p.status === 'draft').length;

  return (
    <div className="platform-shell">
      <header className="admin-page__header">
        <div className="admin-page__header-main">
          <p className="admin-page__badge">Platform · Step 8</p>
          <h1>Publishing</h1>
          <p>Manage publish status across all projects — review scores, publish drafts, or take pages offline.</p>
        </div>
        <div className="admin-page__header-actions">
          <button
            type="button"
            className="platform-btn"
            onClick={() => load(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECTS_PATH}>
            Your sites
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="platform-skeleton-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="platform-skeleton platform-skeleton--card" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {data?.warning ? (
        <p className="platform-alert platform-alert--warn" role="status">
          {data.warning}
        </p>
      ) : null}

      {data && !loading ? (
        <>
          <div className="platform-grid">
            <div className="platform-card platform-card--projects">
              <div className="platform-card__label">Projects</div>
              <div className="platform-card__score">{summary.projects ?? 0}</div>
            </div>
            <div className="platform-card platform-card--pages">
              <div className="platform-card__label">Pages</div>
              <div className="platform-card__score">{summary.pages ?? 0}</div>
            </div>
            <div className="platform-card platform-card--published">
              <div className="platform-card__label">Published</div>
              <div className="platform-card__score">{summary.published ?? 0}</div>
            </div>
            <div className="platform-card platform-card--drafts">
              <div className="platform-card__label">Drafts</div>
              <div className="platform-card__score">{summary.drafts ?? 0}</div>
            </div>
          </div>

          <section className="platform-panel" aria-labelledby="pub-projects-title">
            <div className="platform-panel__head">
              <div>
                <h2 id="pub-projects-title" className="platform-panel__title">
                  Projects
                </h2>
                <p className="platform-panel__sub">
                  {(data.projects || []).length} project{(data.projects || []).length === 1 ? '' : 's'} on platform
                </p>
              </div>
            </div>
            <div className="platform-panel__body">
              {(data.projects || []).length === 0 ? (
                <div className="platform-empty">
                  <p className="platform-empty__title">No projects</p>
                  <p className="platform-empty__text">Create a project to start publishing pages.</p>
                </div>
              ) : (
                <div className="platform-table-wrap">
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
                            <span className="platform-table__primary">{p.name}</span>
                            <span className="platform-table__meta">
                              <code>/{p.slug}</code>
                            </span>
                          </td>
                          <td>{p.pagesCount}</td>
                          <td>{p.publishedCount}</td>
                          <td>
                            <span className={`platform-status ${domainStatusClass(p.domainStatus)}`}>
                              {domainStatusLabel(p.domainStatus)}
                            </span>
                          </td>
                          <td>
                            <div className="platform-actions">
                              <Link
                                className="platform-btn"
                                href={adminProjectSectionPath(p.id, 'pages')}
                              >
                                Pages
                              </Link>
                              <Link
                                className="platform-btn"
                                href={adminProjectSectionPath(p.id, 'publishing')}
                              >
                                Publishing
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="platform-panel" aria-labelledby="pub-pages-title">
            <div className="platform-panel__head">
              <div>
                <h2 id="pub-pages-title" className="platform-panel__title">
                  All pages
                </h2>
                <p className="platform-panel__sub">
                  {filteredPages.length} of {(data.pages || []).length} pages shown
                </p>
              </div>
            </div>

            <div className="platform-toolbar">
              <input
                type="search"
                className="platform-search"
                placeholder="Search by title or slug…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search pages"
              />
              <div className="platform-filters" role="group" aria-label="Filter by status">
                <button
                  type="button"
                  className={`platform-filter-pill${statusFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({(data.pages || []).length})
                </button>
                <button
                  type="button"
                  className={`platform-filter-pill${statusFilter === 'published' ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter('published')}
                >
                  Published ({publishedCount})
                </button>
                <button
                  type="button"
                  className={`platform-filter-pill${statusFilter === 'draft' ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter('draft')}
                >
                  Drafts ({draftCount})
                </button>
              </div>
            </div>

            <div className="platform-panel__body">
              {filteredPages.length === 0 ? (
                <div className="platform-empty">
                  <p className="platform-empty__title">No pages match</p>
                  <p className="platform-empty__text">
                    {search || statusFilter !== 'all'
                      ? 'Try a different search or filter.'
                      : 'Add pages from a project workspace.'}
                  </p>
                </div>
              ) : (
                <div className="platform-table-wrap">
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
                      {filteredPages.map((pg) => (
                        <tr key={pg.id}>
                          <td>
                            <span className="platform-table__primary">{pg.title}</span>
                            <span className="platform-table__meta">
                              <code>
                                {pg.projectSlug}/{pg.slug}
                              </code>
                            </span>
                          </td>
                          <td>
                            <span
                              className={`platform-status platform-status--${pg.status === 'published' ? 'published' : 'draft'}`}
                            >
                              {pg.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td>{formatDate(pg.lastPublishAt)}</td>
                          <td>
                            <span className={`platform-score ${scoreClass(pg.seoScore)}`}>
                              {pg.seoScore ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`platform-score ${scoreClass(pg.auditScore)}`}>
                              {pg.auditScore ?? '—'}
                            </span>
                          </td>
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
                                rel="noopener noreferrer"
                              >
                                Preview
                              </Link>
                              {pg.status === 'published' ? (
                                <>
                                  <Link
                                    className="platform-btn"
                                    href={publicPagePath(pg.projectSlug, pg.slug)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Live
                                  </Link>
                                  <button
                                    type="button"
                                    className="platform-btn platform-btn--danger"
                                    onClick={() => unpublishPage(pg)}
                                  >
                                    Unpublish
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="platform-btn platform-btn--primary"
                                  onClick={() => publishPage(pg)}
                                >
                                  Publish
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      <PublishChecklistModal
        open={checklistOpen}
        loading={checklistLoading}
        error={checklistError}
        pageTitle={checklistPage?.title}
        checklist={checklist}
        isPublishing={isPublishing}
        onClose={() => setChecklistOpen(false)}
        onPublish={executePublish}
        onPublishAnyway={executePublish}
      />
    </div>
  );
}
