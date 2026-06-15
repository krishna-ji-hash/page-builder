'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ADMIN_PROJECT_NEW_PATH, adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { isLivePagePublished } from '@/lib/builder/projectPageRules';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';
import '@/styles/admin/sites-hub.css';
import '@/styles/admin/projects-hub.css';

const PROJECT_TONES = ['violet', 'mint', 'peach', 'rose'];

function projectTone(id) {
  const str = String(id ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash + str.charCodeAt(i) * (i + 1)) % PROJECT_TONES.length;
  return PROJECT_TONES[hash];
}

function projectInitial(name) {
  const ch = String(name ?? '?').trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

async function loadSitesData() {
  const projectsRes = await fetch('/api/projects', { cache: 'no-store' });
  const projectsData = await projectsRes.json().catch(() => ({}));
  if (!projectsRes.ok) throw new Error(projectsData?.error || 'Failed to load projects');
  const projects = Array.isArray(projectsData.projects) ? projectsData.projects : [];

  const sites = await Promise.all(
    projects.map(async (project) => {
      const pagesRes = await fetch(`/api/projects/${project.id}/pages`, { cache: 'no-store' });
      const pagesData = await pagesRes.json().catch(() => ({}));
      const pages = pagesRes.ok && Array.isArray(pagesData.pages) ? pagesData.pages : [];
      return { project, pages };
    })
  );
  return sites;
}

function ProjectsHubHero({ sites, totalPages, stats, query, onQueryChange, children }) {
  return (
    <div className="projects-hub">
      <header className="projects-hero">
        <div className="projects-hero__glow" aria-hidden="true" />
        <div className="projects-hero__main">
          <p className="projects-hero__badge">Platform · Projects</p>
          <h1 className="projects-hero__title">Your sites</h1>
          <p className="projects-hero__sub">
            {sites.length
              ? 'Manage every project and page — open the builder, preview drafts, or go live.'
              : 'Create a project, then design with Templates and Elements in the builder.'}
          </p>
        </div>
        <Link className="projects-hero__cta" href={ADMIN_PROJECT_NEW_PATH}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          New project
        </Link>
        {sites.length ? (
          <div className="projects-hero__stats" aria-label="Portfolio summary">
            <div className="projects-stat projects-stat--projects">
              <span className="projects-stat__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <span className="projects-stat__body">
                <span className="projects-stat__value">{stats.projects}</span>
                <span className="projects-stat__label">Projects</span>
              </span>
            </div>
            <div className="projects-stat projects-stat--pages">
              <span className="projects-stat__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5.5 3.5h6l3 3v10a1 1 0 01-1 1h-8a1 1 0 01-1-1v-12a1 1 0 011-1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M11.5 3.5V7h3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <span className="projects-stat__body">
                <span className="projects-stat__value">{totalPages}</span>
                <span className="projects-stat__label">Pages</span>
              </span>
            </div>
            <div className="projects-stat projects-stat--published">
              <span className="projects-stat__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 10.5l4 4 8-9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="projects-stat__body">
                <span className="projects-stat__value">{stats.published}</span>
                <span className="projects-stat__label">Published</span>
              </span>
            </div>
            <div className="projects-stat projects-stat--drafts">
              <span className="projects-stat__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 4.5h10v11H5v-11z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7.5 8h5M7.5 11h5M7.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="projects-stat__body">
                <span className="projects-stat__value">{stats.drafts}</span>
                <span className="projects-stat__label">Drafts</span>
              </span>
            </div>
          </div>
        ) : null}
      </header>

      {sites.length ? (
        <div className="projects-toolbar">
          <label className="projects-toolbar__search">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search projects or pages…"
              aria-label="Search projects or pages"
            />
          </label>
          <span className="projects-toolbar__meta">
            {query.trim() ? `Filtered results` : `${sites.length} project${sites.length === 1 ? '' : 's'}`}
          </span>
        </div>
      ) : null}

      {children}
    </div>
  );
}

function ProjectCard({ project, pages }) {
  const tone = projectTone(project.id);
  const publishedCount = pages.filter((p) => isLivePagePublished(p)).length;

  return (
    <article className={`projects-card projects-card--${tone}`}>
      <header className="projects-card__head">
        <div className="projects-card__identity">
          <span className="projects-card__avatar" aria-hidden="true">
            {projectInitial(project.name)}
          </span>
          <div className="projects-card__info">
            <h2 className="projects-card__name">{project.name}</h2>
            <div className="projects-card__chips">
              <span className="projects-chip">
                <code>/{project.slug}</code>
              </span>
              <span className="projects-chip">{project.type || 'website'}</span>
              <span className="projects-chip">
                {pages.length} page{pages.length === 1 ? '' : 's'}
              </span>
              {pages.length ? (
                <span className="projects-chip">
                  {publishedCount} live
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Link className="projects-card__workspace" href={adminProjectSectionPath(project.id, 'overview')}>
          Workspace
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3.5h6.5V10M6 10L10.5 5.5 6 10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      {!pages.length ? (
        <p className="projects-card__empty">
          No pages yet —{' '}
          <Link href={adminProjectSectionPath(project.id, 'pages')}>add a page</Link> or open{' '}
          <Link href={adminBuilderPagePath(project.slug, 'home')}>builder</Link>.
        </p>
      ) : (
        <>
          <p className="projects-card__pages-label">Pages</p>
          <ul className="projects-card__pages">
            {pages.map((page) => {
              const published = isLivePagePublished(page);
              const builderPath = adminBuilderPagePath(project.slug, page.slug);
              const livePath = publicPagePath(project.slug, page.slug);
              return (
                <li key={page.id} className="projects-page">
                  <div className="projects-page__main">
                    <span
                      className={`projects-page__dot projects-page__dot--${published ? 'published' : 'draft'}`}
                      aria-hidden="true"
                    />
                    <div className="projects-page__text">
                      <span className="projects-page__title">{page.title}</span>
                      <span className="projects-page__path">{livePath}</span>
                    </div>
                  </div>
                  <span className={`projects-page__status projects-page__status--${published ? 'published' : 'draft'}`}>
                    {published ? 'Published' : 'Draft'}
                  </span>
                  <div className="projects-page__actions">
                    <Link className="projects-btn projects-btn--primary" href={builderPath}>
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                      Edit
                    </Link>
                    {published ? (
                      <Link
                        className="projects-btn"
                        href={livePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M6 3.5h6.5V10M6 10L10.5 5.5 6 10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Live
                      </Link>
                    ) : (
                      <Link
                        className="projects-btn"
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
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}

export default function AdminSitesHub({ showHero = false, limit = null, hideHeader = false }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadSitesData()
      .then(setSites)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleSites = limit ? sites.slice(0, limit) : sites;
  const totalPages = sites.reduce((n, s) => n + s.pages.length, 0);

  const stats = useMemo(() => {
    let published = 0;
    let drafts = 0;
    sites.forEach(({ pages }) => {
      pages.forEach((page) => {
        if (isLivePagePublished(page)) published += 1;
        else drafts += 1;
      });
    });
    return { projects: sites.length, published, drafts };
  }, [sites]);

  const filteredSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleSites;
    return visibleSites.filter(({ project, pages }) => {
      if (project.name.toLowerCase().includes(q)) return true;
      if (project.slug.toLowerCase().includes(q)) return true;
      return pages.some(
        (page) =>
          page.title.toLowerCase().includes(q) ||
          page.slug.toLowerCase().includes(q) ||
          publicPagePath(project.slug, page.slug).toLowerCase().includes(q)
      );
    });
  }, [visibleSites, query]);

  const listBody = (
    <>
      {loading ? (
        <div className={showHero ? 'projects-skeleton' : 'platform-skeleton-grid'} aria-hidden="true">
          {showHero ? (
            <>
              <div className="projects-skeleton__card" />
              <div className="projects-skeleton__card" />
            </>
          ) : (
            <>
              <div className="platform-skeleton platform-skeleton--card" />
              <div className="platform-skeleton platform-skeleton--card" />
            </>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && !sites.length ? (
        showHero ? (
          <div className="projects-empty">
            <span className="projects-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5V4a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <p className="projects-empty__title">No projects yet</p>
            <p className="projects-empty__text">
              Create a project with a Home page, then use Templates and Elements in the builder.
            </p>
            <Link className="projects-hero__cta" href={ADMIN_PROJECT_NEW_PATH}>
              Create first project
            </Link>
          </div>
        ) : (
          <div className="platform-empty">
            <p className="platform-empty__title">No projects yet</p>
            <p className="platform-empty__text">
              Create a project with a Home page, then use Templates and Elements in the builder.
            </p>
            <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECT_NEW_PATH}>
              Create first project
            </Link>
          </div>
        )
      ) : null}

      {!loading && !error && visibleSites.length && query.trim() && !filteredSites.length ? (
        <p className="projects-no-results">No projects or pages match &ldquo;{query.trim()}&rdquo;.</p>
      ) : null}

      {!loading && !error && filteredSites.length ? (
        <div className={showHero ? 'projects-grid' : 'sites-hub__list'}>
          {filteredSites.map(({ project, pages }) =>
            showHero ? (
              <ProjectCard key={project.id} project={project} pages={pages} />
            ) : (
              <article key={project.id} className="sites-hub__project">
                <header className="sites-hub__project-head">
                  <div>
                    <h3 className="sites-hub__project-name">{project.name}</h3>
                    <p className="sites-hub__project-meta">
                      <code>/{project.slug}</code>
                      <span> · {project.type || 'website'}</span>
                      <span>
                        {' '}
                        · {pages.length} page{pages.length === 1 ? '' : 's'}
                      </span>
                    </p>
                  </div>
                  <Link
                    className="platform-btn platform-btn--ghost"
                    href={adminProjectSectionPath(project.id, 'overview')}
                  >
                    Workspace
                  </Link>
                </header>
                {!pages.length ? (
                  <p className="sites-hub__empty-project">
                    No pages yet —{' '}
                    <Link href={adminProjectSectionPath(project.id, 'pages')}>add a page</Link> or open{' '}
                    <Link href={adminBuilderPagePath(project.slug, 'home')}>builder</Link>.
                  </p>
                ) : (
                  <ul className="sites-hub__pages">
                    {pages.map((page) => {
                      const published = isLivePagePublished(page);
                      const builderPath = adminBuilderPagePath(project.slug, page.slug);
                      const livePath = publicPagePath(project.slug, page.slug);
                      return (
                        <li key={page.id} className="sites-hub__page">
                          <div className="sites-hub__page-main">
                            <span className="sites-hub__page-title">{page.title}</span>
                            <code className="sites-hub__page-path">{livePath}</code>
                          </div>
                          <span
                            className={`platform-status sites-hub__page-status platform-status--${published ? 'published' : 'draft'}`}
                          >
                            {published ? 'Published' : 'Draft'}
                          </span>
                          <div className="sites-hub__page-actions">
                            <Link className="platform-btn platform-btn--primary" href={builderPath}>
                              Edit builder
                            </Link>
                            {published ? (
                              <Link
                                className="platform-btn"
                                href={livePath}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View live
                              </Link>
                            ) : (
                              <Link
                                className="platform-btn"
                                href={previewPagePath(project.slug, page.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Preview
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            )
          )}
        </div>
      ) : null}

      {limit && sites.length > limit ? (
        <p className="sites-hub__more">
          <Link href="/admin/projects">View all {sites.length} projects →</Link>
        </p>
      ) : null}
    </>
  );

  if (showHero) {
    return (
      <ProjectsHubHero
        sites={sites}
        totalPages={totalPages}
        stats={stats}
        query={query}
        onQueryChange={setQuery}
      >
        {listBody}
      </ProjectsHubHero>
    );
  }

  return (
    <div className="sites-hub">
      <section aria-labelledby="sites-hub-title">
        {!hideHeader ? (
          <div className="sites-hub__head">
            <div>
              <h2 id="sites-hub-title" className="sites-hub__title">
                Your sites
              </h2>
              <p className="sites-hub__sub">
                Select a page → Edit builder · Preview draft · View live when published.
              </p>
            </div>
            <Link className="platform-btn" href={ADMIN_PROJECT_NEW_PATH}>
              + New project
            </Link>
          </div>
        ) : null}
        {listBody}
      </section>
    </div>
  );
}
