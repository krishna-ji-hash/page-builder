'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-forms.css';

export default function AdminProjectForms({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { pages: [] }
      ),
    ])
      .then(([projectsData, pagesData]) => {
        const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
        setProject(found || null);
        setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (page) =>
        String(page.title || '').toLowerCase().includes(q) ||
        String(page.slug || '').toLowerCase().includes(q)
    );
  }, [pages, query]);

  return (
    <div className="proj-forms">
      <header className="proj-forms__hero">
        <div className="proj-forms__hero-main">
          <p className="proj-forms__badge">Workspace · Forms</p>
          <h1 className="proj-forms__title">Forms</h1>
          <p className="proj-forms__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — form widgets live on pages. Edit in builder, export submissions per
                page.
              </>
            ) : (
              'Form widgets live on pages — edit in builder, export submissions per page.'
            )}
          </p>
        </div>
        {!loading ? (
          <span className="proj-forms__pill">
            Pages <strong>{pages.length}</strong>
          </span>
        ) : null}
      </header>

      {loading ? (
        <div className="proj-forms__skeleton" aria-hidden="true">
          <div className="proj-forms__skeleton-row" style={{ height: 100, marginBottom: 10 }} />
          <div className="proj-forms__skeleton-row" />
        </div>
      ) : null}

      {!loading && pages.length > 0 ? (
        <div className="proj-forms__toolbar">
          <label className="proj-forms__search">
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
          <span className="proj-forms__count">
            {query.trim() ? `${filteredPages.length} of ${pages.length}` : `${pages.length} pages`}
          </span>
        </div>
      ) : null}

      {!loading && pages.length === 0 ? (
        <section className="proj-forms__panel">
          <div className="proj-forms__empty">
            <span className="proj-forms__empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <p className="proj-forms__empty-title">No pages yet</p>
            <p className="proj-forms__empty-text">Add a page and insert a form widget in the builder.</p>
            {project ? (
              <Link className="proj-forms__btn proj-forms__btn--primary" href={adminBuilderPagePath(project.slug, 'home')}>
                Open builder
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {!loading && pages.length > 0 ? (
        <section className="proj-forms__panel">
          <div className="proj-forms__panel-head">
            <h2 className="proj-forms__panel-title">Pages with forms</h2>
            <p className="proj-forms__panel-sub">Export submissions or view raw JSON per page</p>
          </div>

          {query.trim() && !filteredPages.length ? (
            <p className="proj-forms__no-results">No pages match &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            <ul className="proj-forms__list">
              {filteredPages.map((page) => (
                <li key={page.id} className="proj-forms__card">
                  <div className="proj-forms__main">
                    <span className="proj-forms__icon" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="2.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M5.5 6.5h5M5.5 9h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="proj-forms__info">
                      <span className="proj-forms__name">{page.title}</span>
                      <code className="proj-forms__slug">{page.slug}</code>
                    </span>
                  </div>
                  <div className="proj-forms__actions">
                    {project ? (
                      <Link
                        className="proj-forms__btn"
                        href={adminBuilderPagePath(project.slug, page.slug)}
                      >
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        </svg>
                        Edit
                      </Link>
                    ) : null}
                    <Link
                      className="proj-forms__btn proj-forms__btn--primary"
                      href={`/api/pages/${page.id}/form-submissions?projectId=${projectId}&format=csv`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 4.5h8v7H4v-7zM6 10.5h4" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M8 2.5v2M6.5 4h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      Export CSV
                    </Link>
                    <Link
                      className="proj-forms__btn"
                      href={`/api/pages/${page.id}/form-submissions?projectId=${projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 3.5h8v9H4v-9z" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M6 6h4v1.5H6V6z" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      View JSON
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
