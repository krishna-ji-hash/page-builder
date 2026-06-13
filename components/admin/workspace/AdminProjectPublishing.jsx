'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import PublishChecklistModal from '@/components/builder/publish/PublishChecklistModal';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/admin/platform.css';

export default function AdminProjectPublishing({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [checklistPage, setChecklistPage] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    Promise.all([
      fetch('/api/platform/publishing', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then((data) => {
        const proj = (data?.projects || []).find((p) => Number(p.id) === pid);
        setProject(proj || null);
        const filtered = (data?.pages || []).filter((p) => Number(p.projectId) === pid);
        setPages(filtered);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const reloadPages = async () => {
    const data = await fetch('/api/platform/publishing', { cache: 'no-store' }).then((r) =>
      r.ok ? r.json() : null
    );
    const filtered = (data?.pages || []).filter((p) => Number(p.projectId) === Number(projectId));
    setPages(filtered);
  };

  const publishPage = async (page) => {
    setChecklistOpen(true);
    setChecklistLoading(true);
    setChecklistError('');
    setChecklist(null);
    setChecklistPage(page);
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
      await reloadPages();
    } catch (err) {
      setChecklistError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishPage = async (page) => {
    const label = `${page.projectSlug}/${page.slug}`;
    if (
      !window.confirm(
        `Unpublish "${page.title}" (${label})? The live URL will go offline. The draft stays editable.`
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
        badge="Workspace · Publishing"
        title="Publishing"
        description={
          project?.name
            ? `${project.name} — publish status and actions for each page.`
            : 'Publish status and actions for each page.'
        }
      />

      {loading ? (
        <div className="platform-skeleton platform-skeleton--card" style={{ height: 240 }} aria-hidden="true" />
      ) : null}

      {!loading && !pages.length ? (
        <div className="platform-empty">
          <p className="platform-empty__title">No pages yet</p>
          <p className="platform-empty__text">Create pages in the builder to publish them here.</p>
        </div>
      ) : null}

      {!loading && pages.length ? (
        <section className="platform-panel">
          <div className="platform-panel__head">
            <div>
              <h2 className="platform-panel__title">Pages</h2>
              <p className="platform-panel__sub">{pages.length} page{pages.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="platform-panel__body">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Status</th>
                  <th>Last publish</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((pg) => (
                  <tr key={pg.id}>
                    <td>
                      <strong>{pg.title}</strong>
                      <div className="platform-table__meta">{pg.slug}</div>
                    </td>
                    <td>
                      <span
                        className={`platform-status platform-status--${
                          pg.status === 'published' ? 'published' : 'draft'
                        }`}
                      >
                        {pg.status}
                      </span>
                    </td>
                    <td>{pg.lastPublishAt ? new Date(pg.lastPublishAt).toLocaleString() : '—'}</td>
                    <td>
                      <div className="platform-actions">
                        <Link
                          className="platform-btn"
                          href={adminBuilderPagePath(pg.projectSlug, pg.slug)}
                        >
                          Edit
                        </Link>
                        <Link className="platform-btn" href={previewPagePath(pg.projectSlug, pg.slug)} target="_blank">
                          Preview
                        </Link>
                        {pg.status === 'published' ? (
                          <Link className="platform-btn" href={publicPagePath(pg.projectSlug, pg.slug)} target="_blank">
                            Live
                          </Link>
                        ) : null}
                        {pg.status === 'published' ? (
                          <button type="button" className="platform-btn" onClick={() => unpublishPage(pg)}>
                            Unpublish
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="platform-btn platform-btn--primary"
                          onClick={() => publishPage(pg)}
                        >
                          Publish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
