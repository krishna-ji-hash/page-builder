import Link from 'next/link';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { isLivePagePublished } from '@/lib/builder/projectPageRules';
import {
  listPagesByProject,
  listProjectsWithPageCount,
} from '@/services/builder/builderService';
import '@/styles/home.css';

export const dynamic = 'force-dynamic';

async function loadSites() {
  try {
    const projects = await listProjectsWithPageCount();
    const sites = await Promise.all(
      projects.map(async (project) => ({
        project,
        pages: await listPagesByProject(project.id),
      }))
    );
    return sites;
  } catch {
    return [];
  }
}

function pickFeaturedPage(sites) {
  for (const site of sites) {
    for (const page of site.pages) {
      if (isLivePagePublished(page)) {
        return { project: site.project, page };
      }
    }
  }
  const first = sites[0]?.pages?.[0];
  if (first && sites[0]) {
    return { project: sites[0].project, page: first };
  }
  return null;
}

export default async function HomePage() {
  const sites = await loadSites();
  const featured = pickFeaturedPage(sites);
  const totalPages = sites.reduce((n, s) => n + s.pages.length, 0);

  return (
    <div className="home">
      <header className="home-header">
        <Link href="/" className="home-brand">
          <span className="home-brand__mark" aria-hidden="true">
            B
          </span>
          <span className="home-brand__text">
            <span className="home-brand__name">Builder Custom</span>
            <span className="home-brand__tag">Visual page builder</span>
          </span>
        </Link>
        <nav className="home-nav" aria-label="Main">
          {sites.length ? (
            <a className="home-nav__link" href="#sites">
              Your sites
            </a>
          ) : null}
          <Link className="home-btn home-btn--primary" href="/admin/builder">
            Project manager
          </Link>
        </nav>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <p className="home-hero__badge">Local development</p>
          <h1 className="home-hero__title">
            Build pages with <span>Builder Custom</span>
          </h1>
          <p className="home-hero__lead">
            {sites.length
              ? `${sites.length} project${sites.length === 1 ? '' : 's'} · ${totalPages} page${totalPages === 1 ? '' : 's'} ready to edit or publish.`
              : 'Create a project, design in the visual editor, and publish to slug-based URLs.'}
          </p>
          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" href="/admin/builder">
              {sites.length ? 'Create or manage projects' : 'Create your first project'}
            </Link>
            {featured ? (
              <Link
                className="home-btn home-btn--secondary"
                href={
                  isLivePagePublished(featured.page)
                    ? publicPagePath(featured.project.slug, featured.page.slug)
                    : previewPagePath(featured.project.slug, featured.page.slug)
                }
              >
                {isLivePagePublished(featured.page) ? 'View live page' : 'Preview draft'}
              </Link>
            ) : null}
          </div>
        </section>

        <section id="sites" className="home-sites" aria-labelledby="home-sites-title">
          <div className="home-sites__head">
            <div>
              <h2 id="home-sites-title" className="home-sites__title">
                Your sites
              </h2>
              <p className="home-sites__sub">
                Each row opens the builder or live site — no duplicate admin hop.
              </p>
            </div>
            <Link className="home-btn home-btn--secondary home-btn--compact" href="/admin/builder">
              + New project
            </Link>
          </div>

          {!sites.length ? (
            <div className="home-empty">
              <p className="home-empty__title">No projects yet</p>
              <p className="home-empty__text">
                Use the project manager to create a site, add pages, and open the builder.
              </p>
              <Link className="home-btn home-btn--primary" href="/admin/builder">
                Open project manager
              </Link>
            </div>
          ) : (
            <div className="home-sites__list">
              {sites.map(({ project, pages }) => (
                <article key={project.id} className="home-site">
                  <header className="home-site__head">
                    <div>
                      <h3 className="home-site__name">{project.name}</h3>
                      <p className="home-site__meta">
                        <code>/{project.slug}</code>
                        <span> · {project.type}</span>
                        <span> · {pages.length} page{pages.length === 1 ? '' : 's'}</span>
                      </p>
                    </div>
                    <Link
                      className="home-btn home-btn--ghost-inline"
                      href="/admin/builder"
                      title="Rename project slug or manage pages"
                    >
                      Settings
                    </Link>
                  </header>

                  {!pages.length ? (
                    <p className="home-site__empty">No pages — add one in the project manager.</p>
                  ) : (
                    <ul className="home-page-table">
                      {pages.map((page) => {
                        const publicPath = publicPagePath(project.slug, page.slug);
                        const builderPath = adminBuilderPagePath(project.slug, page.slug);
                        const published = isLivePagePublished(page);
                        return (
                          <li key={page.id} className="home-page-row">
                            <div className="home-page-row__main">
                              <span className="home-page-row__title">{page.title}</span>
                              <code className="home-page-row__path">{publicPath}</code>
                            </div>
                            <span
                              className={`home-status home-status--${published ? 'published' : 'draft'}`}
                            >
                              {published ? 'Published' : 'Draft'}
                            </span>
                            <div className="home-page-row__actions">
                              <Link className="home-action home-action--builder" href={builderPath}>
                                Edit builder
                              </Link>
                              {published ? (
                                <Link
                                  className="home-action home-action--live"
                                  href={publicPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View live
                                </Link>
                              ) : (
                                <Link
                                  className="home-action home-action--preview"
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
          )}
        </section>

        {featured ? (
          <section className="home-info home-info--compact" aria-labelledby="home-routing">
            <h2 id="home-routing" className="home-info__title">
              Routing reference
            </h2>
            <p className="home-info__text">
              Example using <strong>{featured.project.name}</strong> / <strong>{featured.page.title}</strong>:
            </p>
            <div className="home-info__paths">
              <div className="home-info__path">
                <span className="home-info__path-label">Public</span>
                <code>{publicPagePath(featured.project.slug, featured.page.slug)}</code>
              </div>
              <div className="home-info__path">
                <span className="home-info__path-label">Builder</span>
                <code>{adminBuilderPagePath(featured.project.slug, featured.page.slug)}</code>
              </div>
              <div className="home-info__path">
                <span className="home-info__path-label">Draft preview</span>
                <code>{previewPagePath(featured.project.slug, featured.page.slug)}</code>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="home-footer">Builder Custom · Local environment</footer>
    </div>
  );
}
