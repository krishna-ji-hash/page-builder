'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ADMIN_PROJECT_NEW_PATH, adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { isLivePagePublished } from '@/lib/builder/projectPageRules';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';
import '@/styles/admin/sites-hub.css';

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

export default function AdminSitesHub({ showHero = false, limit = null }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSitesData()
      .then(setSites)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleSites = limit ? sites.slice(0, limit) : sites;
  const totalPages = sites.reduce((n, s) => n + s.pages.length, 0);

  const content = (
    <div className="sites-hub">
      {showHero ? (
        <header className="admin-page__header">
          <div className="admin-page__header-main">
            <p className="admin-page__badge">Platform · Projects</p>
            <h1>Your sites</h1>
            <p>
              {sites.length
                ? `${sites.length} project${sites.length === 1 ? '' : 's'} · ${totalPages} page${totalPages === 1 ? '' : 's'} — edit, preview, or publish.`
                : 'Create a project, then design with Templates and Elements in the builder.'}
            </p>
          </div>
          <div className="admin-page__header-actions">
            <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECT_NEW_PATH}>
              + New project
            </Link>
          </div>
        </header>
      ) : null}

      <section aria-labelledby="sites-hub-title">
        {!showHero ? (
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

        {loading ? (
          <div className="platform-skeleton-grid" style={{ gridTemplateColumns: '1fr' }} aria-hidden="true">
            <div className="platform-skeleton platform-skeleton--card" />
            <div className="platform-skeleton platform-skeleton--card" />
          </div>
        ) : null}

        {error ? (
          <p className="platform-alert platform-alert--error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && !sites.length ? (
          <div className="platform-empty">
            <p className="platform-empty__title">No projects yet</p>
            <p className="platform-empty__text">
              Create a project with a Home page, then use Templates and Elements in the builder.
            </p>
            <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECT_NEW_PATH}>
              Create first project
            </Link>
          </div>
        ) : null}

        {!loading && !error && visibleSites.length ? (
          <div className="sites-hub__list">
            {visibleSites.map(({ project, pages }) => (
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
            ))}
          </div>
        ) : null}

        {limit && sites.length > limit ? (
          <p className="sites-hub__more">
            <Link href="/admin/projects">View all {sites.length} projects →</Link>
          </p>
        ) : null}
      </section>
    </div>
  );

  if (showHero) {
    return <div className="platform-shell">{content}</div>;
  }

  return content;
}
