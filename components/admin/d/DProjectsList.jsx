'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  D_PROJECT_NEW_PATH,
  dProjectPagesPath,
} from '@/lib/admin/dProjectRoutes';
import PublicUrlActions from '@/components/admin/d/PublicUrlActions';
import DomainStatusBadge, { formatLastVerifiedAt } from '@/components/admin/d/DomainStatusBadge';
import { buildProjectHomePreviewUrl } from '@/lib/admin/publicPreviewUrl';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import '@/styles/admin/platform.css';

function statusLabel(status) {
  return status === 'ARCHIVED' ? 'Archived' : 'Active';
}

export default function DProjectsList() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    domain: '',
    status: 'ACTIVE',
    domainStatus: 'PENDING',
    lastVerifiedAt: null,
  });
  const [editError, setEditError] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/projects', { cache: 'no-store' }),
        fetch('/api/platform/site-settings', { cache: 'no-store' }),
      ]);
      const projectsData = await projectsRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!projectsRes.ok) throw new Error(projectsData?.error || 'Failed to load projects');
      setProjects(Array.isArray(projectsData.projects) ? projectsData.projects : []);
      setActiveProjectId(settingsData?.settings?.activeProjectId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setActive = async (projectId) => {
    setBusyId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/set-active`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to set active project');
      setActiveProjectId(projectId);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const archiveProject = async (project) => {
    if (
      !window.confirm(
        `Archive "${project.name}"? The project will be hidden from active lists but data is kept.`
      )
    ) {
      return;
    }
    setBusyId(project.id);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to archive project');
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (project) => {
    setEditProject(project);
    setEditForm({
      name: project.name || '',
      slug: project.slug || '',
      domain: project.domain || '',
      status: project.status || 'ACTIVE',
      domainStatus: project.domainStatus || 'PENDING',
      lastVerifiedAt: project.lastVerifiedAt || null,
    });
    setEditError('');
    setVerifyMessage('');
  };

  const verifyDomain = async () => {
    if (!editProject) return;
    setVerifyMessage('');
    setBusyId(editProject.id);
    try {
      const res = await fetch(`/api/admin/projects/${editProject.id}/verify-domain`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Domain verification failed');

      const project = data.project || {};
      setEditForm((f) => ({
        ...f,
        domainStatus: project.domainStatus || f.domainStatus,
        lastVerifiedAt: project.lastVerifiedAt || null,
      }));
      setVerifyMessage(data?.verification?.message || 'Domain verification complete.');
      await load();
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editProject) return;
    setEditError('');
    setBusyId(editProject.id);
    try {
      const res = await fetch(`/api/admin/projects/${editProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          slug: normalizeBuilderSlug(editForm.slug),
          domain: editForm.domain.trim() || null,
          status: editForm.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update project');
      setEditProject(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="platform-shell">
      <div className="admin-page__header">
        <div className="admin-page__header-main">
          <p className="admin-page__badge">Sites</p>
          <h1 className="admin-page__title">Projects</h1>
          <p className="admin-page__description">
            Manage client websites, domains, and published pages.
          </p>
        </div>
        <div className="admin-page__header-actions">
          <Link className="platform-btn platform-btn--primary" href={D_PROJECT_NEW_PATH}>
            New project
          </Link>
        </div>
      </div>

      {loading ? <p>Loading projects…</p> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="platform-table-wrap">
          <table className="platform-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Public URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6}>No projects yet. Create your first site.</td>
                </tr>
              ) : (
                projects.map((project) => {
                  const isActive = Number(activeProjectId) === Number(project.id);
                  const publicUrl = buildProjectHomePreviewUrl(project, { isActiveProject: isActive });
                  return (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.name}</strong>
                        {isActive ? <span className="d-projects__active-badge">Default</span> : null}
                      </td>
                      <td>
                        <code>{project.slug}</code>
                      </td>
                      <td>
                        <div className="d-projects__domain-cell">
                          <span>{project.domain || '—'}</span>
                          {project.domain ? (
                            <DomainStatusBadge status={project.domainStatus} />
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`platform-badge platform-badge--${project.status === 'ARCHIVED' ? 'muted' : 'success'}`}
                        >
                          {statusLabel(project.status)}
                        </span>
                      </td>
                      <td>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          {publicUrl}
                        </a>
                      </td>
                      <td>
                        <div className="platform-actions">
                          <PublicUrlActions url={publicUrl} />
                          <Link className="platform-btn" href={dProjectPagesPath(project.id)}>
                            Pages
                          </Link>
                          <button
                            type="button"
                            className="platform-btn"
                            disabled={busyId === project.id || isActive}
                            onClick={() => setActive(project.id)}
                          >
                            {isActive ? 'Default' : 'Set default'}
                          </button>
                          <button
                            type="button"
                            className="platform-btn"
                            onClick={() => openEdit(project)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="platform-btn platform-btn--danger"
                            disabled={busyId === project.id || project.status === 'ARCHIVED'}
                            onClick={() => archiveProject(project)}
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {editProject ? (
        <div className="d-projects__modal-backdrop" role="presentation" onClick={() => setEditProject(null)}>
          <div
            className="d-projects__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-project-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-project-title">Edit project</h2>
            <form onSubmit={saveEdit}>
              <div className="platform-field">
                <label htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="platform-field">
                <label htmlFor="edit-slug">Slug</label>
                <input
                  id="edit-slug"
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, slug: normalizeBuilderSlug(e.target.value) }))
                  }
                  required
                />
              </div>
              <div className="platform-field">
                <label htmlFor="edit-domain">Domain</label>
                <input
                  id="edit-domain"
                  value={editForm.domain}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      domain: e.target.value,
                      domainStatus: 'PENDING',
                      lastVerifiedAt: null,
                    }))
                  }
                  placeholder="example.com"
                />
                {editForm.domain ? (
                  <div className="d-projects__domain-meta">
                    <DomainStatusBadge status={editForm.domainStatus} />
                    {formatLastVerifiedAt(editForm.lastVerifiedAt) ? (
                      <span className="d-projects__verified-at">
                        Last checked: {formatLastVerifiedAt(editForm.lastVerifiedAt)}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="platform-btn"
                      disabled={busyId === editProject.id}
                      onClick={() => void verifyDomain()}
                    >
                      Verify Domain
                    </button>
                  </div>
                ) : null}
                {verifyMessage ? (
                  <p className="d-projects__verify-message" role="status">
                    {verifyMessage}
                  </p>
                ) : null}
              </div>
              <div className="platform-field">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              {editError ? (
                <p className="platform-alert platform-alert--error" role="alert">
                  {editError}
                </p>
              ) : null}
              <div className="d-projects__modal-actions">
                <button type="button" className="platform-btn" onClick={() => setEditProject(null)}>
                  Cancel
                </button>
                <button type="submit" className="platform-btn platform-btn--primary" disabled={busyId != null}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
