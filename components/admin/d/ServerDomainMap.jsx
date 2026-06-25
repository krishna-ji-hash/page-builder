'use client';

import Link from 'next/link';
import { useState } from 'react';
import { adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { dProjectDomainsPath } from '@/lib/admin/dProjectRoutes';
import ProjectDeleteIconButton from '@/components/admin/d/ProjectDeleteIconButton';

/**
 * Server-wide map: which host opens which project.
 */
export default function ServerDomainMap({
  rows = [],
  liveRoot,
  projects = [],
  busyId,
  onChanged,
  onEditProject,
  onSetDefault,
}) {
  const [editRow, setEditRow] = useState(null);
  const [editHost, setEditHost] = useState('');
  const [defaultProjectId, setDefaultProjectId] = useState('');
  const [error, setError] = useState('');

  const activeProjects = projects.filter((p) => p.status !== 'ARCHIVED');

  function openEdit(row) {
    setError('');
    if (row.kind === 'localhost-default') {
      setDefaultProjectId(String(row.projectId));
      setEditRow(row);
      return;
    }
    setEditHost(row.host);
    setEditRow(row);
  }

  function closeEdit() {
    setEditRow(null);
    setEditHost('');
    setDefaultProjectId('');
    setError('');
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editRow) return;
    setError('');

    if (editRow.kind === 'localhost-default') {
      const nextId = Number(defaultProjectId);
      if (!nextId || nextId === Number(editRow.projectId)) {
        closeEdit();
        return;
      }
        try {
          await onSetDefault(nextId);
          await onChanged?.();
          closeEdit();
        } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    const host = editHost.trim().toLowerCase();
    if (!host) {
      setError('Enter a domain host.');
      return;
    }
    if (host === editRow.host) {
      closeEdit();
      return;
    }

    const projectId = editRow.projectId;
    try {
      if (editRow.isPrimary || editRow.kind === 'primary-domain') {
        const res = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: host }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to update domain');
      } else if (editRow.domainId) {
        const del = await fetch(`/api/projects/${projectId}/domains/${editRow.domainId}`, {
          method: 'DELETE',
        });
        const delData = await del.json().catch(() => ({}));
        if (!del.ok) throw new Error(delData?.error || 'Failed to remove old domain');

        const add = await fetch(`/api/projects/${projectId}/domains`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: host }),
        });
        const addData = await add.json().catch(() => ({}));
        if (!add.ok) throw new Error(addData?.error || 'Failed to add domain');
      } else {
        throw new Error('Domain record not found. Use Domains page.');
      }

      closeEdit();
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function removeRow(row) {
    if (row.kind === 'localhost-default') return;
    if (
      !window.confirm(
        `Remove "${row.host}" from the server map?\n\nVisitors will no longer reach ${row.projectName} on this host.`
      )
    ) {
      return;
    }

    const projectId = row.projectId;
    try {
      if (row.domainId) {
        const res = await fetch(`/api/projects/${projectId}/domains/${row.domainId}`, {
          method: 'DELETE',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to remove domain');
      } else if (row.isPrimary || row.kind === 'primary-domain') {
        const res = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: null }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to clear domain');
      } else {
        throw new Error('Domain record not found.');
      }
      await onChanged?.();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  }

  if (!rows.length) {
    return (
      <section className="d-projects__domain-map d-projects__domain-map--empty" aria-labelledby="domain-map-title">
        <h2 id="domain-map-title" className="d-projects__domain-map-title">
          Server domain map
        </h2>
        <p className="d-projects__domain-map-empty">
          No domains yet. Add a host from a project&apos;s <strong>Domains</strong> page.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="d-projects__domain-map" aria-labelledby="domain-map-title">
        <div className="d-projects__domain-map-head">
          <h2 id="domain-map-title" className="d-projects__domain-map-title">
            Server domain map
          </h2>
          <p className="d-projects__domain-map-sub">
            Host → project routing. <code>localhost</code> uses the default project ({liveRoot}).
          </p>
        </div>
        <div className="d-projects__domain-map-table-wrap">
          <table className="d-projects__domain-map-table">
            <thead>
              <tr>
                <th>Host / domain</th>
                <th>Project</th>
                <th>Opens at</th>
                <th>DNS</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.host}-${row.projectId}`}>
                  <td>
                    <span className="d-projects__domain-map-host">{row.label}</span>
                    {row.kind === 'localhost-default' ? (
                      <span className="d-projects__domain-map-tag">dev default</span>
                    ) : null}
                  </td>
                  <td>
                    <Link href={adminProjectSectionPath({ slug: row.projectSlug }, 'overview')}>
                      {row.projectName}
                    </Link>
                    <span className="platform-table__meta">
                      <code>{row.projectSlug}</code>
                    </span>
                  </td>
                  <td>
                    <a className="d-routing__url" href={row.url} target="_blank" rel="noopener noreferrer">
                      {row.url}
                    </a>
                  </td>
                  <td>
                    {row.kind === 'localhost-default' ? (
                      <span className="d-projects__domain-map-dns">n/a</span>
                    ) : row.verified ? (
                      <span className="d-projects__domain-map-dns d-projects__domain-map-dns--ok">Verified</span>
                    ) : (
                      <span className="d-projects__domain-map-dns d-projects__domain-map-dns--pending">Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="d-projects__domain-map-actions">
                      <button
                        type="button"
                        className="platform-btn platform-btn--sm"
                        disabled={busyId != null}
                        onClick={() => openEdit(row)}
                      >
                        {row.kind === 'localhost-default' ? 'Change default' : 'Edit'}
                      </button>
                      {row.kind !== 'localhost-default' ? (
                        <ProjectDeleteIconButton
                          label={`Remove ${row.host}`}
                          disabled={busyId != null}
                          onClick={() => void removeRow(row)}
                        />
                      ) : null}
                      {row.kind !== 'localhost-default' ? (
                        <Link
                          className="platform-btn platform-btn--sm"
                          href={dProjectDomainsPath({ slug: row.projectSlug })}
                        >
                          Domains
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editRow ? (
        <div className="d-projects__modal-backdrop" role="presentation" onClick={closeEdit}>
          <div
            className="d-projects__modal d-projects__modal--narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="domain-map-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="domain-map-edit-title">
              {editRow.kind === 'localhost-default' ? 'Change localhost default' : 'Edit domain host'}
            </h2>
            <form onSubmit={(e) => void saveEdit(e)}>
              {editRow.kind === 'localhost-default' ? (
                <div className="platform-field">
                  <label htmlFor="domain-map-default-project">Default project</label>
                  <select
                    id="domain-map-default-project"
                    value={defaultProjectId}
                    onChange={(e) => setDefaultProjectId(e.target.value)}
                  >
                    {activeProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.slug})
                      </option>
                    ))}
                  </select>
                  <p className="d-projects__field-hint">
                    This project opens at <code>{liveRoot}</code> on localhost.
                  </p>
                </div>
              ) : (
                <>
                  <div className="platform-field">
                    <label htmlFor="domain-map-host">Host / domain</label>
                    <input
                      id="domain-map-host"
                      value={editHost}
                      onChange={(e) => setEditHost(e.target.value)}
                      placeholder="example.com"
                      required
                    />
                  </div>
                  <p className="d-projects__field-hint">
                    Project: <strong>{editRow.projectName}</strong> (
                    <code>{editRow.projectSlug}</code>)
                  </p>
                  {onEditProject ? (
                    <button
                      type="button"
                      className="d-projects__link-btn"
                      onClick={() => {
                        const project = projects.find((p) => Number(p.id) === Number(editRow.projectId));
                        if (project) {
                          closeEdit();
                          onEditProject(project);
                        }
                      }}
                    >
                      Open full project settings
                    </button>
                  ) : null}
                </>
              )}
              {error ? (
                <p className="platform-alert platform-alert--error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="d-projects__modal-actions">
                <button type="button" className="platform-btn" onClick={closeEdit}>
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
    </>
  );
}
