'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import '@/styles/admin/platform.css';

export default function AdminProjectForms({ projectId }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;
    fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((data) => setPages(Array.isArray(data.pages) ? data.pages : []))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · Forms"
        title="Forms"
        description="Form widgets live on pages — edit in builder, export submissions per page."
      />

      {loading ? (
        <div className="platform-skeleton platform-skeleton--row" style={{ height: 120 }} aria-hidden="true" />
      ) : null}

      {!loading ? (
        <section className="platform-panel">
          <div className="platform-panel__head">
            <div>
              <h2 className="platform-panel__title">Pages with forms</h2>
              <p className="platform-panel__sub">{pages.length} page{pages.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="platform-panel__body">
            {pages.length === 0 ? (
              <div className="platform-empty">
                <p className="platform-empty__title">No pages yet</p>
                <p className="platform-empty__text">Add a page and insert a form widget in the builder.</p>
              </div>
            ) : (
              <div className="platform-table-wrap">
                <table className="platform-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => (
                      <tr key={page.id}>
                        <td>
                          <span className="platform-table__primary">{page.title}</span>
                          <span className="platform-table__meta">
                            <code>{page.slug}</code>
                          </span>
                        </td>
                        <td>
                          <div className="platform-actions">
                            <Link
                              className="platform-btn"
                              href={`/api/pages/${page.id}/form-submissions?projectId=${projectId}&format=csv`}
                              target="_blank"
                            >
                              Export CSV
                            </Link>
                            <Link
                              className="platform-btn"
                              href={`/api/pages/${page.id}/form-submissions?projectId=${projectId}`}
                              target="_blank"
                            >
                              View JSON
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
