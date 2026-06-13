'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminActivityLogPanel from '@/components/admin/AdminActivityLogPanel';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import '@/styles/admin/platform.css';

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

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · Overview"
        title={project?.name || 'Project overview'}
        description={
          project?.slug
            ? `/${project.slug} — summary, shortcuts, and recent activity.`
            : 'Summary, shortcuts, and recent activity.'
        }
        actions={
          project ? (
            <div className="platform-actions">
              <Link className="platform-btn platform-btn--primary" href={adminProjectSectionPath(projectId, 'pages')}>
                Manage pages
              </Link>
              <Link className="platform-btn" href={adminBuilderPagePath(project.slug, 'home')}>
                Open builder
              </Link>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className="platform-skeleton-grid" aria-hidden="true">
          <div className="platform-skeleton platform-skeleton--card" />
          <div className="platform-skeleton platform-skeleton--card" />
          <div className="platform-skeleton platform-skeleton--card" />
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {project ? (
        <>
          <div className="platform-grid">
            <div className="platform-card">
              <div className="platform-card__score">{pages.length}</div>
              <div>Pages</div>
            </div>
            <div className="platform-card">
              <div className="platform-card__score">{publishedCount}</div>
              <div>Published</div>
            </div>
            <div className="platform-card">
              <div className="platform-card__score">{domains.length}</div>
              <div>Domains</div>
            </div>
          </div>

          <AdminActivityLogPanel projectId={projectId} title="Recent activity" limit={10} showToolbar={false} />
        </>
      ) : null}
    </div>
  );
}
