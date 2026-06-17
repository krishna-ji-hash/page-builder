'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminActivityLogPanel from '@/components/admin/AdminActivityLogPanel';
import { adminProjectPagesAddPath, adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-overview.css';

function projectInitial(name) {
  const ch = String(name ?? '?').trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

const STAT_CARDS = [
  {
    key: 'pages',
    label: 'Pages',
    tone: 'pages',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M5.5 3.5h6l3 3v10a1 1 0 01-1 1h-8a1 1 0 01-1-1v-12a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M11.5 3.5V7h3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: 'published',
    label: 'Published',
    tone: 'published',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M4 10.5l4 4 8-9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'drafts',
    label: 'Drafts',
    tone: 'drafts',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 4.5h10v11H5v-11z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 8h5M7.5 11h5M7.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'domains',
    label: 'Domains',
    tone: 'domains',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10h14M10 3a10.5 10.5 0 010 14M10 3a10.5 10.5 0 000 14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function AdminProjectOverview({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    setLoading(true);
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { pages: [] }
      ),
      fetch(`/api/projects/${pid}/domains`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { domains: [] }
      ),
    ])
      .then(([projectsData, pagesData, domainsData]) => {
        const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
        if (!found) throw new Error('Project not found');
        setProject(found);
        setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
        setDomains(Array.isArray(domainsData.domains) ? domainsData.domains : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.length - publishedCount;

  const statValues = {
    pages: pages.length,
    published: publishedCount,
    drafts: draftCount,
    domains: domains.length,
  };

  return (
    <div className="proj-overview">
      {loading ? (
        <>
          <div className="proj-overview__hero" aria-hidden="true">
            <div className="proj-overview__skeleton-block" style={{ height: 120, borderRadius: 20 }} />
          </div>
          <div className="proj-overview__skeleton-stats">
            <div className="proj-overview__skeleton-block" />
            <div className="proj-overview__skeleton-block" />
            <div className="proj-overview__skeleton-block" />
            <div className="proj-overview__skeleton-block" />
          </div>
        </>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {project ? (
        <>
          <header className="proj-overview__hero">
            <div className="proj-overview__hero-main">
              <span className="proj-overview__avatar" aria-hidden="true">
                {projectInitial(project.name)}
              </span>
              <div className="proj-overview__hero-text">
                <p className="proj-overview__badge">Workspace · Overview</p>
                <h1 className="proj-overview__title">{project.name}</h1>
                <p className="proj-overview__meta">
                  <span className="proj-overview__slug">/{project.slug}</span>
                  <span className="proj-overview__type">{project.type || 'website'}</span>
                  <span>· summary & recent activity</span>
                </p>
              </div>
            </div>
            <div className="proj-overview__actions">
              <Link
                className="proj-overview__btn proj-overview__btn--primary"
                href={adminProjectPagesAddPath(project)}
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
                Add page
              </Link>
              <Link className="proj-overview__btn" href={adminProjectSectionPath(project, 'pages')}>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 4.5h10v9H3v-9z" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M6 7.5h4M6 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                All pages
              </Link>
              <Link className="proj-overview__btn" href={adminBuilderPagePath(project.slug, 'home')}>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                Open builder
              </Link>
              <Link className="proj-overview__btn" href={adminProjectSectionPath(project, 'domains')}>
                Domains
              </Link>
            </div>
          </header>

          <div className="proj-overview__stats" aria-label="Project summary">
            {STAT_CARDS.map((card) => {
              const statBody = (
                <>
                  <div className="proj-overview__stat-top">
                    <span className="proj-overview__stat-label">{card.label}</span>
                    <span className="proj-overview__stat-icon">{card.icon}</span>
                  </div>
                  <span className="proj-overview__stat-value">{statValues[card.key]}</span>
                </>
              );

              if (card.key === 'pages') {
                return (
                  <Link
                    key={card.key}
                    className={`proj-overview__stat proj-overview__stat--${card.tone} proj-overview__stat--link`}
                    href={adminProjectPagesAddPath(project)}
                    title="Add or manage pages"
                  >
                    {statBody}
                  </Link>
                );
              }

              if (card.key === 'domains') {
                return (
                  <Link
                    key={card.key}
                    className={`proj-overview__stat proj-overview__stat--${card.tone} proj-overview__stat--link`}
                    href={adminProjectSectionPath(project, 'domains')}
                  >
                    {statBody}
                  </Link>
                );
              }

              return (
                <article key={card.key} className={`proj-overview__stat proj-overview__stat--${card.tone}`}>
                  {statBody}
                </article>
              );
            })}
          </div>

          <div className="proj-overview__activity">
            <AdminActivityLogPanel projectId={projectId} title="Recent activity" limit={10} showToolbar={false} />
          </div>
        </>
      ) : null}
    </div>
  );
}
