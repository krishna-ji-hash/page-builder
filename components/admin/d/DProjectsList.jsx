'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_PROJECT_NEW_PATH } from '@/lib/admin/adminRoutes';
import { dispatchActiveProjectChanged } from '@/lib/admin/activeProjectEvents';
import { dispatchProjectListChanged } from '@/lib/admin/projectListEvents';
import { dProjectDomainsPath, dProjectPagesPath } from '@/lib/admin/dProjectRoutes';
import DomainStatusBadge, { formatLastVerifiedAt } from '@/components/admin/d/DomainStatusBadge';
import ProjectActionsMenu from '@/components/admin/d/ProjectActionsMenu';
import ServerDomainMap from '@/components/admin/d/ServerDomainMap';
import { ProjectRoutingCell, resolvePrimaryPreviewUrl } from '@/components/admin/d/ProjectRoutingGuide';
import {
  describeDomainRouting,
  describeLocalhostRouting,
} from '@/lib/admin/projectRoutingDisplay';
import { buildServerDomainMap } from '@/lib/admin/buildServerDomainMap';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import '@/styles/admin/platform.css';
import '@/styles/admin/d-shell.css';
import '@/styles/admin/project-pages.css';

function statusLabel(status) {
  return status === 'ARCHIVED' ? 'Archived' : 'Active';
}

function sortProjects(projects, activeProjectId) {
  return [...projects].sort((a, b) => {
    const aDefault = Number(a.id) === Number(activeProjectId);
    const bDefault = Number(b.id) === Number(activeProjectId);
    if (aDefault !== bDefault) return aDefault ? -1 : 1;
    const aArchived = a.status === 'ARCHIVED';
    const bArchived = b.status === 'ARCHIVED';
    if (aArchived !== bArchived) return aArchived ? 1 : -1;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
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
  const [defaultNotice, setDefaultNotice] = useState('');
  const [liveRoot, setLiveRoot] = useState('http://localhost:3000/');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLiveRoot(`${window.location.origin}/`);
    }
  }, []);

  const activeProject = projects.find((p) => Number(p.id) === Number(activeProjectId)) || null;

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'ARCHIVED').length;
    const archived = projects.length - active;
    return { total: projects.length, active, archived };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    let list = showArchived ? projects : projects.filter((p) => p.status !== 'ARCHIVED');
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          String(p.name || '')
            .toLowerCase()
            .includes(q) ||
          String(p.slug || '')
            .toLowerCase()
            .includes(q) ||
          String(p.domain || '')
            .toLowerCase()
            .includes(q)
      );
    }
    return sortProjects(list, activeProjectId);
  }, [projects, showArchived, query, activeProjectId]);

  const serverDomainMap = useMemo(
    () => buildServerDomainMap(projects, activeProjectId, liveRoot.replace(/\/+$/, '')),
    [projects, activeProjectId, liveRoot]
  );

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
    const target = projects.find((p) => Number(p.id) === Number(projectId));
    const name = target?.name || 'this project';
    const slug = target?.slug ? ` (${target.slug})` : '';
    if (
      !window.confirm(
        `Set "${name}"${slug} as the default for localhost?\n\n` +
          `Only this project will open at ${liveRoot}. ` +
          `Other projects without a custom domain will not appear on localhost until you change the default.`
      )
    ) {
      return;
    }

    setBusyId(projectId);
    setDefaultNotice('');
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/set-active`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to set default site');
      const name =
        data.project?.name || projects.find((p) => Number(p.id) === Number(projectId))?.name || 'Site';
      setActiveProjectId(projectId);
      setDefaultNotice(name);
      dispatchActiveProjectChanged(projectId);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteProject = async (project) => {
    if (
      !window.confirm(
        `Permanently delete "${project.name}" (${project.slug})?\n\n` +
          `This removes the project, all pages, media, domains, and builder data from the database. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(project.id);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/permanent`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete project');
      if (Number(activeProjectId) === Number(project.id)) {
        setActiveProjectId(null);
        dispatchActiveProjectChanged(null);
      }
      dispatchProjectListChanged();
      await load();
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
      dispatchProjectListChanged();
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
    <div className="platform-shell d-projects-admin">
      <div className="admin-page__header">
        <div className="admin-page__header-main">
          <p className="admin-page__badge">Workspace</p>
          <h1 className="admin-page__title">Projects</h1>
          <p className="admin-page__description">Manage sites, domains, and the localhost default.</p>
        </div>
        <div className="admin-page__header-actions">
          <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECT_NEW_PATH}>
            New project
          </Link>
        </div>
      </div>

      <div className="d-projects__stats" aria-label="Project summary">
        <div className="d-projects__stat">
          <span className="d-projects__stat-value">{stats.active}</span>
          <span className="d-projects__stat-label">Active</span>
        </div>
        <div className="d-projects__stat">
          <span className="d-projects__stat-value">{stats.archived}</span>
          <span className="d-projects__stat-label">Archived</span>
        </div>
        <div className="d-projects__stat d-projects__stat--accent">
          <span className="d-projects__stat-value">{activeProject?.name || '—'}</span>
          <span className="d-projects__stat-label">Default on localhost</span>
        </div>
      </div>

      <ServerDomainMap
        rows={serverDomainMap}
        liveRoot={liveRoot}
        projects={projects}
        activeProject={activeProject}
        busyId={busyId}
        onChanged={async () => {
          dispatchProjectListChanged();
          await load();
        }}
        onEditProject={openEdit}
        onSetDefault={setActive}
      />

      {activeProject ? null : (
        <p className="platform-alert platform-alert--warn d-projects__no-default" role="status">
          No default site selected. Pick a project below and click <strong>Set default</strong>.
        </p>
      )}

      {defaultNotice ? (
        <p className="platform-alert platform-alert--success d-projects__default-notice" role="status">
          <strong>{defaultNotice}</strong> is now the default site at{' '}
          <a href={liveRoot}>{liveRoot}</a>
        </p>
      ) : null}

      <div className="d-projects__toolbar">
        <label className="d-projects__search">
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug, or domain…"
          />
        </label>
        <label className="d-projects__filter">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {loading ? <p className="d-projects__loading">Loading projects…</p> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="platform-table-wrap d-projects__table-wrap">
          <table className="platform-table d-projects__table">
            <thead>
              <tr>
                <th>Project</th>
                <th>localhost</th>
                <th>Custom domain</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {projects.length === 0
                      ? 'No projects yet. Create your first site.'
                      : 'No projects match your search.'}
                  </td>
                </tr>
              ) : (
                visibleProjects.map((project) => {
                  const isActive = Number(activeProjectId) === Number(project.id);
                  const routingOrigin = liveRoot.replace(/\/+$/, '');
                  const localhostRouting = describeLocalhostRouting(project, {
                    isDefault: isActive,
                    origin: routingOrigin,
                  });
                  const domainRouting = describeDomainRouting(project, { origin: routingOrigin });
                  const publicUrl = resolvePrimaryPreviewUrl(project, {
                    isDefault: isActive,
                    origin: routingOrigin,
                  });
                  const isArchived = project.status === 'ARCHIVED';
                  return (
                    <tr
                      key={project.id}
                      className={[
                        isActive ? 'is-default-site' : '',
                        isArchived ? 'is-archived' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td>
                        <div className="d-projects__project-cell">
                          <span className="platform-table__primary">{project.name}</span>
                          <span className="platform-table__meta">
                            slug: <code>{project.slug}</code>
                            <span className="d-projects__project-id"> · id {project.id}</span>
                          </span>
                          {isActive ? <span className="d-projects__active-badge">localhost default</span> : null}
                          {domainRouting.domain ? (
                            <span className="d-projects__domain-badge">domain: {domainRouting.domain}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="d-projects__routing-cell">
                        <ProjectRoutingCell routing={localhostRouting} variant="localhost" compact />
                      </td>
                      <td className="d-projects__routing-cell">
                        <ProjectRoutingCell routing={domainRouting} variant="domain" compact />
                      </td>
                      <td>
                        <span
                          className={`platform-badge platform-badge--${isArchived ? 'muted' : 'success'}`}
                        >
                          {statusLabel(project.status)}
                        </span>
                      </td>
                      <td>
                        <ProjectActionsMenu
                          project={project}
                          isActive={isActive}
                          busy={busyId === project.id}
                          pagesPath={dProjectPagesPath(project, activeProject)}
                          domainsPath={dProjectDomainsPath(project, activeProject)}
                          publicUrl={publicUrl}
                          onSetDefault={setActive}
                          onEdit={openEdit}
                          onArchive={archiveProject}
                          onDelete={deleteProject}
                        />
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
