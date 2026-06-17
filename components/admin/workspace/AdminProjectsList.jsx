'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ADMIN_PROJECT_NEW_PATH, adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import '@/styles/admin/platform.css';

export default function AdminProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/projects', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || 'Failed to load projects');
        return Array.isArray(data.projects) ? data.projects : [];
      })
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="platform-shell">
      <div className="admin-page__header">
        <h1>Projects</h1>
        <p>Manage client websites and open project workspaces.</p>
      </div>

      <div className="platform-actions" style={{ marginBottom: 20 }}>
        <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECT_NEW_PATH}>
          New project
        </Link>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!loading && !error ? (
        <table className="platform-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Slug</th>
              <th>Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td>{p.slug}</td>
                <td>{p.pages_count ?? p.pageCount ?? '—'}</td>
                <td>
                  <div className="platform-actions">
                    <Link className="platform-btn" href={adminProjectSectionPath(p, 'overview')}>
                      Overview
                    </Link>
                    <Link
                      className="platform-btn"
                      href={adminBuilderPagePath(p.slug, 'home')}
                    >
                      Builder
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
