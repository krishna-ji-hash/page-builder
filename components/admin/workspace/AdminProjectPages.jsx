'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-pages.css';

export default function AdminProjectPages({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    setLoading(true);
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || 'Failed to load pages');
        return data;
      }),
    ])
      .then(([projectsData, pagesData]) => {
        const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
        if (!found) throw new Error('Project not found');
        setProject(found);
        setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const reloadPages = async () => {
    const pid = Number(projectId);
    const pagesData = await fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then((r) =>
      r.ok ? r.json() : { pages: [] }
    );
    setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
  };

  const unpublishPage = async (page) => {
    if (
      !window.confirm(
        `Unpublish "${page.title}" (${page.slug})? The live URL will go offline. The draft stays editable.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/pages/${page.id}/unpublish`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data?.error || 'Unpublish failed');
      return;
    }
    await reloadPages();
  };

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.length - publishedCount;

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(q) ||
        page.slug.toLowerCase().includes(q) ||
        (project && publicPagePath(project.slug, page.slug).toLowerCase().includes(q))
    );
  }, [pages, query, project]);

  return (
    <div className="proj-pages">
      {loading ? (
        <div className="proj-pages__skeleton" aria-hidden="true">
          <div className="proj-pages__skeleton-row" style={{ height: 120, marginBottom: 10 }} />
          <div className="proj-pages__skeleton-row" />
          <div className="proj-pages__skeleton-row" />
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && project ? (
        <>
          <header className="proj-pages__hero">
            <div className="proj-pages__hero-main">
              <p className="proj-pages__badge">Workspace · Pages</p>
              <h1 className="proj-pages__title">Pages</h1>
              <p className="proj-pages__sub">
                <strong>{project.name}</strong> — edit in builder, preview drafts, or open live URLs.
              </p>
            </div>
            <div className="proj-pages__stats" aria-label="Page counts">
              <span className="proj-pages__pill">
                Total <strong>{pages.length}</strong>
              </span>
              <span className="proj-pages__pill proj-pages__pill--published">
                Live <strong>{publishedCount}</strong>
              </span>
              <span className="proj-pages__pill proj-pages__pill--draft">
                Drafts <strong>{draftCount}</strong>
              </span>
            </div>
          </header>

          {pages.length ? (
            <div className="proj-pages__toolbar">
              <label className="proj-pages__search">
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
              <span className="proj-pages__count">
                {query.trim()
                  ? `${filteredPages.length} of ${pages.length}`
                  : `${pages.length} page${pages.length === 1 ? '' : 's'}`}
              </span>
            </div>
          ) : null}

          {!pages.length ? (
            <div className="proj-pages__empty">
              <p className="proj-pages__empty-title">No pages yet</p>
              <p className="proj-pages__empty-text">
                Open the builder to create and design your first page.
              </p>
              <Link className="proj-pages__btn proj-pages__btn--primary" href={adminBuilderPagePath(project.slug, 'home')}>
                Open builder
              </Link>
            </div>
          ) : null}

          {pages.length && query.trim() && !filteredPages.length ? (
            <p className="proj-pages__no-results">No pages match &ldquo;{query.trim()}&rdquo;.</p>
          ) : null}

          {filteredPages.length ? (
            <ul className="proj-pages__list">
              {filteredPages.map((page) => {
                const published = page.status === 'published';
                const livePath = publicPagePath(project.slug, page.slug);
                return (
                  <li key={page.id} className="proj-pages__card">
                    <div className="proj-pages__main">
                      <span
                        className={`proj-pages__dot proj-pages__dot--${published ? 'published' : 'draft'}`}
                        aria-hidden="true"
                      />
                      <div className="proj-pages__info">
                        <span className="proj-pages__name">{page.title}</span>
                        <code className="proj-pages__slug">{page.slug}</code>
                        <span className="proj-pages__path">{livePath}</span>
                      </div>
                    </div>
                    <span className={`proj-pages__status proj-pages__status--${published ? 'published' : 'draft'}`}>
                      {published ? 'Published' : 'Draft'}
                    </span>
                    <div className="proj-pages__actions">
                      <Link
                        className="proj-pages__btn proj-pages__btn--primary"
                        href={adminBuilderPagePath(project.slug, page.slug)}
                      >
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        </svg>
                        Edit
                      </Link>
                      <Link
                        className="proj-pages__btn"
                        href={previewPagePath(project.slug, page.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M2.5 8s2-3.5 5.5-3.5S13.5 8 13.5 8s-2 3.5-5.5 3.5S2.5 8 2.5 8z" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                        Preview
                      </Link>
                      {published ? (
                        <Link
                          className="proj-pages__btn"
                          href={livePath}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 3.5h6.5V10M6 10L10.5 5.5 6 10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Live
                        </Link>
                      ) : null}
                      {published ? (
                        <button
                          type="button"
                          className="proj-pages__btn proj-pages__btn--danger"
                          onClick={() => unpublishPage(page)}
                        >
                          Unpublish
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
