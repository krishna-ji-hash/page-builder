'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';

export default function AdminProjectPages({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · Pages"
        title="Pages"
        description={
          project?.name
            ? `${project.name} — edit in builder, preview drafts, or open live URLs.`
            : 'Edit in builder, preview drafts, or open live URLs.'
        }
      />

      {loading ? (
        <div className="platform-skeleton platform-skeleton--row" style={{ height: 120 }} aria-hidden="true" />
      ) : null}
      {error ? <p className="platform-alert platform-alert--error" role="alert">{error}</p> : null}

      {!loading && !error && project ? (
        <section className="platform-panel">
          <div className="platform-panel__head">
            <div>
              <h2 className="platform-panel__title">All pages</h2>
              <p className="platform-panel__sub">{pages.length} page{pages.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="platform-panel__body">
            <div className="platform-table-wrap">
              <table className="platform-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>
                  <span className="platform-table__primary">{page.title}</span>
                </td>
                <td>
                  <code className="platform-table__meta">{page.slug}</code>
                </td>
                <td>
                  <span className={`platform-status platform-status--${page.status === 'published' ? 'published' : 'draft'}`}>
                    {page.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div className="platform-actions">
                    <Link
                      className="platform-btn platform-btn--primary"
                      href={adminBuilderPagePath(project.slug, page.slug)}
                    >
                      Edit
                    </Link>
                    <Link
                      className="platform-btn"
                      href={previewPagePath(project.slug, page.slug)}
                      target="_blank"
                    >
                      Preview
                    </Link>
                    {page.status === 'published' ? (
                      <Link
                        className="platform-btn"
                        href={publicPagePath(project.slug, page.slug)}
                        target="_blank"
                      >
                        Live
                      </Link>
                    ) : null}
                    {page.status === 'published' ? (
                      <button
                        type="button"
                        className="platform-btn"
                        onClick={() => unpublishPage(page)}
                      >
                        Unpublish
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
