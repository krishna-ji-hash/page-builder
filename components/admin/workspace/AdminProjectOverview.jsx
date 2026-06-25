'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProjectWorkspaceChrome from '@/components/admin/workspace/ProjectWorkspaceChrome';
import AdminActivityLogPanel from '@/components/admin/AdminActivityLogPanel';
import { adminProjectPagesAddPath, adminActivePathOpts, adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-overview.css';

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

export default function AdminProjectOverview({
  projectId,
  initialProject = null,
  activeProjectId: initialActiveProjectId = null,
  activeProjectSlug: initialActiveProjectSlug = null,
}) {
  const [project, setProject] = useState(initialProject);
  const [pages, setPages] = useState([]);
  const [domains, setDomains] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(initialActiveProjectId);
  const [activeProjectSlug, setActiveProjectSlug] = useState(initialActiveProjectSlug);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState('');

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    setLoading(true);
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch('/api/platform/site-settings', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : {}
      ),
      fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { pages: [] }
      ),
      fetch(`/api/projects/${pid}/domains`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { domains: [] }
      ),
    ])
      .then(([projectsData, settingsData, pagesData, domainsData]) => {
        const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
        if (!found) throw new Error('Project not found');
        setProject(found);
        const activeId = settingsData?.settings?.activeProjectId ?? null;
        setActiveProjectId(activeId);
        if (activeId != null) {
          const active = (projectsData.projects || []).find((p) => Number(p.id) === Number(activeId));
          setActiveProjectSlug(active?.slug ?? null);
        }
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
    <ProjectWorkspaceChrome
      project={project}
      activeProjectId={activeProjectId}
      activeProjectSlug={activeProjectSlug}
      section="overview"
      loading={loading}
      error={error}
    >
        {project ? (
          <>
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
                    href={adminProjectPagesAddPath(project, adminActivePathOpts({ id: activeProjectId, slug: activeProjectSlug }))}
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
                    href={adminProjectSectionPath(project, 'domains', adminActivePathOpts({ id: activeProjectId, slug: activeProjectSlug }))}
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
    </ProjectWorkspaceChrome>
  );
}
