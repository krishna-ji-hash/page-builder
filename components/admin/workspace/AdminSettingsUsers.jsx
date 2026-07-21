'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ROLES } from '@/lib/auth/constants';
import { fetchAuthMe } from '@/lib/auth/clientSession';
import '@/styles/admin/platform.css';
import '@/styles/admin/settings-users.css';

const ROLE_LABELS = {
  super_admin: 'Super admin',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ALL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER];

function formatDate(value) {
  if (!value) return 'Never';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function initials(name, email) {
  const source = String(name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

function roleOptionsForActor(actor) {
  if (actor?.role === ROLES.SUPER_ADMIN) return ALL_ROLES;
  if (actor?.role === ROLES.ADMIN) return [ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER];
  return [];
}

function UserFormFields({
  form,
  setForm,
  projects,
  showPassword = false,
  passwordRequired = false,
  roleOptions,
  showProjects,
}) {
  return (
    <>
      <label className="set-users__field">
        <span className="set-users__label">Display name</span>
        <input
          className="set-users__input"
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
        />
      </label>
      <label className="set-users__field">
        <span className="set-users__label">Email</span>
        <input
          className="set-users__input"
          type="email"
          value={form.email}
          disabled={Boolean(form.id)}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </label>
      <label className="set-users__field">
        <span className="set-users__label">Role</span>
        <select
          className="set-users__select"
          style={{ width: '100%' }}
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] || role}
            </option>
          ))}
        </select>
      </label>
      {showPassword ? (
        <label className="set-users__field">
          <span className="set-users__label">{passwordRequired ? 'Password' : 'New password (optional)'}</span>
          <input
            className="set-users__input"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </label>
      ) : null}
      {showProjects ? (
        <div className="set-users__field">
          <span className="set-users__label">Project access</span>
          <p className="set-users__hint">Limit this user to specific projects. Super admins always have full access.</p>
          <div className="set-users__projects">
            {projects.length === 0 ? (
              <span className="set-users__hint">No projects yet.</span>
            ) : (
              projects.map((project) => {
                const checked = form.projectIds.includes(project.id);
                return (
                  <label key={project.id} className="set-users__project-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setForm((f) => ({
                          ...f,
                          projectIds: checked
                            ? f.projectIds.filter((id) => id !== project.id)
                            : [...f.projectIds, project.id],
                        }));
                      }}
                    />
                    <span>
                      {project.name} <span className="set-users__hint">({project.slug})</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
      {!showPassword ? (
        <label className="set-users__project-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          <span>Account active</span>
        </label>
      ) : null}
    </>
  );
}

export default function AdminSettingsUsers() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: ROLES.EDITOR,
    projectIds: [],
  });

  const canManage = currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.role === ROLES.ADMIN;
  const roleOptions = useMemo(() => roleOptionsForActor(currentUser), [currentUser]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meResult, usersData] = await Promise.all([
        fetchAuthMe(),
        fetchJson('/api/admin/users', { cache: 'no-store' }),
      ]);
      setCurrentUser(meResult.ok ? meResult.data?.user || null : null);
      setUsers(usersData.users || []);
      setProjects(usersData.projects || []);
      setStats(usersData.stats || null);
    } catch (e) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role && ALL_ROLES.includes(role)) {
      setRoleFilter(role);
    }
  }, [searchParams]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (!q) return true;
      return (
        user.displayName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) || null,
    [users, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setEditForm(null);
      return;
    }
    setEditForm({
      id: selected.id,
      displayName: selected.displayName,
      email: selected.email,
      role: selected.role,
      isActive: selected.isActive,
      password: '',
      projectIds: [...(selected.projectIds || [])],
    });
  }, [selected]);

  const projectLabel = (user) => {
    if (user.role === ROLES.SUPER_ADMIN) return 'All projects';
    const count = user.projectIds?.length || 0;
    if (count === 0) return 'No projects';
    if (count === 1) {
      const p = projects.find((pr) => pr.id === user.projectIds[0]);
      return p?.name || '1 project';
    }
    return `${count} projects`;
  };

  const saveUser = async () => {
    if (!editForm || !selected) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        displayName: editForm.displayName,
        role: editForm.role,
        isActive: editForm.isActive,
        projectIds: editForm.projectIds,
      };
      if (editForm.password) body.password = editForm.password;
      const data = await fetchJson(`/api/admin/users/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setUsers((list) => list.map((u) => (u.id === data.user.id ? data.user : u)));
      setSuccess('User updated.');
    } catch (e) {
      setError(e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const revokeSessions = async () => {
    if (!selected) return;
    setRevoking(true);
    setError('');
    setSuccess('');
    try {
      const data = await fetchJson(`/api/admin/users/${selected.id}/revoke-sessions`, { method: 'POST' });
      setUsers((list) => list.map((u) => (u.id === data.user.id ? data.user : u)));
      setSuccess('All sessions revoked for this user.');
    } catch (e) {
      setError(e?.message || 'Failed to revoke sessions');
    } finally {
      setRevoking(false);
    }
  };

  const deleteUser = async () => {
    if (!selected) return;
    const label = selected.displayName || selected.email;
    const ok = window.confirm(
      `Permanently delete "${label}"?\n\nThis removes the user from the database. Sessions and project access are deleted. This cannot be undone.`
    );
    if (!ok) return;

    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await fetchJson(`/api/admin/users/${selected.id}`, { method: 'DELETE' });
      setUsers((list) => list.filter((u) => u.id !== selected.id));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              total: Math.max(0, prev.total - 1),
              active: selected.isActive ? Math.max(0, prev.active - 1) : prev.active,
              admins:
                selected.role === ROLES.SUPER_ADMIN || selected.role === ROLES.ADMIN
                  ? Math.max(0, prev.admins - 1)
                  : prev.admins,
              editors: selected.role === ROLES.EDITOR ? Math.max(0, prev.editors - 1) : prev.editors,
              viewers: selected.role === ROLES.VIEWER ? Math.max(0, prev.viewers - 1) : prev.viewers,
            }
          : prev
      );
      setSelectedId(null);
      setEditForm(null);
      setSuccess(`User "${label}" deleted from database.`);
    } catch (e) {
      setError(e?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const isSelf = selected && currentUser && Number(selected.id) === Number(currentUser.id);

  const createUser = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await fetchJson('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      setUsers((list) => [...list, data.user]);
      setSelectedId(data.user.id);
      setCreateOpen(false);
      setCreateForm({
        displayName: '',
        email: '',
        password: '',
        role: ROLES.EDITOR,
        projectIds: [],
      });
      setSuccess('User created.');
    } catch (e) {
      setError(e?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="set-users">
        <p className="set-users__loading">Loading team members…</p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="set-users">
        <div className="set-users__alert set-users__alert--error">
          You need admin access to manage users.
        </div>
      </div>
    );
  }

  return (
    <div className="set-users">
      <header className="set-users__hero">
        <div>
          <p className="set-users__badge">Settings · Team</p>
          <h1 className="set-users__title">Users</h1>
          <p className="set-users__sub">
            Manage admin accounts, roles, project scope, and active sessions for your workspace.
          </p>
          <Link href="/admin/settings/system" className="set-users__audit-link" style={{ marginTop: 10 }}>
            View activity audit →
          </Link>
        </div>
        <div className="set-users__stats">
          <div className="set-users__stat">
            <span className="set-users__stat-val">{stats?.total ?? users.length}</span>
            <span className="set-users__stat-lbl">Users</span>
          </div>
          <div className="set-users__stat">
            <span className="set-users__stat-val">{stats?.active ?? 0}</span>
            <span className="set-users__stat-lbl">Active</span>
          </div>
          <div className="set-users__stat">
            <span className="set-users__stat-val">{stats?.admins ?? 0}</span>
            <span className="set-users__stat-lbl">Admins</span>
          </div>
          <div className="set-users__stat">
            <span className="set-users__stat-val">{stats?.sessions ?? 0}</span>
            <span className="set-users__stat-lbl">Sessions</span>
          </div>
        </div>
      </header>

      {error ? <div className="set-users__alert set-users__alert--error">{error}</div> : null}
      {success ? <div className="set-users__alert set-users__alert--ok">{success}</div> : null}

      <div className="set-users__toolbar">
        <div className="set-users__filters">
          <label className="set-users__search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="set-users__select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="set-users__btn set-users__btn--primary" onClick={() => setCreateOpen(true)}>
          Add user
        </button>
      </div>

      <div className="set-users__layout">
        <div className="set-users__table-wrap">
          <table className="set-users__table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Last login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 32 }}>
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`set-users__row${selectedId === user.id ? ' is-selected' : ''}`}
                    onClick={() => setSelectedId(user.id)}
                  >
                    <td>
                      <div className="set-users__user-cell">
                        <span className="set-users__avatar" aria-hidden="true">
                          {initials(user.displayName, user.email)}
                        </span>
                        <div>
                          <div className="set-users__name">{user.displayName}</div>
                          <div className="set-users__email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`set-users__role set-users__role--${user.role}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td>{projectLabel(user)}</td>
                    <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{formatDate(user.lastLoginAt)}</td>
                    <td>
                      <span
                        className={`set-users__status${user.isActive ? '' : ' set-users__status--inactive'}`}
                      >
                        <span className="set-users__status-dot" aria-hidden="true" />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="set-users__panel">
          {!selected || !editForm ? (
            <div className="set-users__panel-empty">Select a team member to edit role, project access, or sessions.</div>
          ) : (
            <>
              <h2 className="set-users__panel-title">Edit member</h2>
              <div className="set-users__meta-row">
                <span>Active sessions</span>
                <strong>{selected.activeSessions ?? 0}</strong>
              </div>
              <div className="set-users__meta-row">
                <span>Member since</span>
                <strong>{formatDate(selected.createdAt)}</strong>
              </div>
              <UserFormFields
                form={editForm}
                setForm={setEditForm}
                projects={projects}
                showPassword
                roleOptions={roleOptions}
                showProjects={editForm.role !== ROLES.SUPER_ADMIN}
              />
              <div className="set-users__panel-actions">
                <button
                  type="button"
                  className="set-users__btn set-users__btn--primary"
                  disabled={saving || deleting}
                  onClick={saveUser}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="set-users__btn"
                  disabled={revoking || deleting || !selected.activeSessions}
                  onClick={revokeSessions}
                >
                  {revoking ? 'Revoking…' : 'Revoke sessions'}
                </button>
                {!isSelf ? (
                  <button
                    type="button"
                    className="set-users__btn set-users__btn--danger"
                    disabled={saving || deleting || revoking}
                    onClick={deleteUser}
                  >
                    {deleting ? 'Deleting…' : 'Delete user'}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>

      {createOpen ? (
        <div className="set-users__modal-backdrop" role="presentation" onClick={() => !saving && setCreateOpen(false)}>
          <div
            className="set-users__modal"
            role="dialog"
            aria-labelledby="add-user-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="set-users__modal-head">
              <h2 id="add-user-title" className="set-users__modal-title">
                Add team member
              </h2>
              <button type="button" className="set-users__close" onClick={() => setCreateOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <UserFormFields
              form={createForm}
              setForm={setCreateForm}
              projects={projects}
              showPassword
              passwordRequired
              roleOptions={roleOptions}
              showProjects={createForm.role !== ROLES.SUPER_ADMIN}
            />
            <div className="set-users__panel-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button
                type="button"
                className="set-users__btn set-users__btn--primary"
                disabled={saving}
                onClick={createUser}
              >
                {saving ? 'Creating…' : 'Create user'}
              </button>
              <button type="button" className="set-users__btn" disabled={saving} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
