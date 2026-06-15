'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PublishChecklistModal from '@/components/builder/publish/PublishChecklistModal';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-publishing.css';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function AdminProjectPublishing({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [checklistPage, setChecklistPage] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState('');

  const pid = Number(projectId);

  const load = async () => {
    if (!Number.isInteger(pid) || pid <= 0) return;
    setLoading(true);
    setError('');
    try {
      const [projectsRes, pagesRes, publishingRes] = await Promise.all([
        fetch('/api/projects', { cache: 'no-store' }),
        fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }),
        fetch('/api/platform/publishing', { cache: 'no-store' }),
      ]);
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };
      const pagesData = pagesRes.ok ? await pagesRes.json() : {};
      if (!pagesRes.ok) {
        const err = pagesData?.error || 'Failed to load pages';
        throw new Error(err);
      }
      const publishingData = publishingRes.ok ? await publishingRes.json() : { pages: [], projects: [] };

      const found =
        (projectsData.projects || []).find((p) => Number(p.id) === pid) ||
        (publishingData.projects || []).find((p) => Number(p.id) === pid) ||
        (() => {
          const sample = (publishingData.pages || []).find((p) => Number(p.projectId) === pid);
          return sample
            ? { id: pid, name: sample.projectName || `Project #${pid}`, slug: sample.projectSlug }
            : null;
        })();

      if (!found) throw new Error('Project not found');
      setProject(found);

      const enrichById = new Map(
        (publishingData.pages || [])
          .filter((p) => Number(p.projectId) === pid)
          .map((p) => [p.id, p])
      );

      const merged = (Array.isArray(pagesData.pages) ? pagesData.pages : []).map((page) => {
        const extra = enrichById.get(page.id);
        return {
          ...page,
          projectSlug: found.slug,
          lastPublishAt: extra?.lastPublishAt || null,
          seoScore: extra?.seoScore ?? null,
        };
      });
      setPages(merged);
    } catch (e) {
      setError(e?.message || 'Failed to load publishing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.length - publishedCount;

  const filteredPages = useMemo(() => {
    let list = pages;
    if (filter === 'published') list = list.filter((p) => p.status === 'published');
    if (filter === 'draft') list = list.filter((p) => p.status !== 'published');
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (page) =>
        page.title.toLowerCase().includes(q) ||
        page.slug.toLowerCase().includes(q) ||
        (project && publicPagePath(project.slug, page.slug).toLowerCase().includes(q))
    );
  }, [pages, query, filter, project]);

  const publishPage = async (page) => {
    setChecklistOpen(true);
    setChecklistLoading(true);
    setChecklistError('');
    setChecklist(null);
    setChecklistPage(page);
    setSuccess('');
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
      setSuccess(`Published "${checklistPage.title}" — live site updated.`);
      await load();
    } catch (err) {
      setChecklistError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishPage = async (page) => {
    if (
      !window.confirm(
        `Unpublish "${page.title}" (${page.slug})? The live URL will go offline. The draft stays editable.`
      )
    ) {
      return;
    }
    setSuccess('');
    const res = await fetch(`/api/pages/${page.id}/unpublish`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data?.error || 'Unpublish failed');
      return;
    }
    setSuccess(`Unpublished "${page.title}".`);
    await load();
  };

  return (
    <div className="proj-pub">
      {loading ? (
        <div className="proj-pub__skeleton" aria-hidden="true">
          <div className="proj-pub__skeleton-row" style={{ height: 120, marginBottom: 10 }} />
          <div className="proj-pub__skeleton-row" />
          <div className="proj-pub__skeleton-row" />
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {success ? <p className="proj-pub__success">{success}</p> : null}

      {!loading && !error && project ? (
        <>
          <header className="proj-pub__hero">
            <div className="proj-pub__hero-main">
              <p className="proj-pub__badge">Workspace · Publishing</p>
              <h1 className="proj-pub__title">Publishing</h1>
              <p className="proj-pub__sub">
                <strong>{project.name}</strong> — review drafts, run the publish checklist, and push pages live.
              </p>
            </div>
            <div className="proj-pub__stats" aria-label="Publishing counts">
              <span className="proj-pub__pill">
                Total <strong>{pages.length}</strong>
              </span>
              <span className="proj-pub__pill proj-pub__pill--live">
                Live <strong>{publishedCount}</strong>
              </span>
              <span className="proj-pub__pill proj-pub__pill--draft">
                Drafts <strong>{draftCount}</strong>
              </span>
            </div>
          </header>

          {pages.length ? (
            <>
              <div className="proj-pub__toolbar">
                <label className="proj-pub__search">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pages…"
                    aria-label="Search pages"
                  />
                </label>
                <div className="proj-pub__filters" role="tablist" aria-label="Filter by status">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'published', label: 'Live' },
                    { id: 'draft', label: 'Drafts' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={filter === tab.id}
                      className={`proj-pub__filter${filter === tab.id ? ' proj-pub__filter--active' : ''}`}
                      onClick={() => setFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {query.trim() && !filteredPages.length ? (
                <p className="proj-pub__no-results">No pages match &ldquo;{query.trim()}&rdquo;.</p>
              ) : null}

              <ul className="proj-pub__list">
                {filteredPages.map((page) => {
                  const published = page.status === 'published';
                  const livePath = publicPagePath(project.slug, page.slug);
                  return (
                    <li key={page.id} className="proj-pub__card">
                      <div className="proj-pub__main">
                        <span
                          className={`proj-pub__dot proj-pub__dot--${published ? 'published' : 'draft'}`}
                          aria-hidden="true"
                        />
                        <div className="proj-pub__info">
                          <span className="proj-pub__name">{page.title}</span>
                          <code className="proj-pub__slug">{page.slug}</code>
                          <span className="proj-pub__path">{livePath}</span>
                          <span className="proj-pub__meta">
                            Last publish: {formatDate(page.lastPublishAt)}
                            {page.seoScore != null ? ` · SEO ${page.seoScore}/100` : ''}
                          </span>
                        </div>
                      </div>
                      <span className={`proj-pub__status proj-pub__status--${published ? 'published' : 'draft'}`}>
                        {published ? 'Live' : 'Draft'}
                      </span>
                      <div className="proj-pub__actions">
                        <button
                          type="button"
                          className="proj-pub__btn proj-pub__btn--publish"
                          onClick={() => publishPage(page)}
                        >
                          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 3v10M8 3l3.5 3.5M8 3L4.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {published ? 'Republish' : 'Publish'}
                        </button>
                        <Link className="proj-pub__btn" href={adminBuilderPagePath(project.slug, page.slug)}>
                          Edit
                        </Link>
                        <Link
                          className="proj-pub__btn"
                          href={previewPagePath(project.slug, page.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Preview
                        </Link>
                        {published ? (
                          <Link className="proj-pub__btn" href={livePath} target="_blank" rel="noopener noreferrer">
                            Live
                          </Link>
                        ) : null}
                        {published ? (
                          <button type="button" className="proj-pub__btn proj-pub__btn--danger" onClick={() => unpublishPage(page)}>
                            Unpublish
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="proj-pub__empty">
              <div className="proj-pub__empty-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 6l4 4-10 10H20V16L30 6z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="proj-pub__empty-title">No pages to publish</p>
              <p className="proj-pub__empty-text">
                Create and design pages in the builder first. When you are ready, return here to publish them live.
              </p>
              <Link className="proj-pub__btn proj-pub__btn--publish" href={adminBuilderPagePath(project.slug, 'home')}>
                Open builder
              </Link>
            </div>
          )}
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
