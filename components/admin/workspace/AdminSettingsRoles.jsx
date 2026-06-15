'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERMISSION_MODULES, permissionLabel } from '@/lib/admin/roleDefinitions';
import { ROLES } from '@/lib/auth/constants';
import '@/styles/admin/platform.css';
import '@/styles/admin/settings-roles.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

function PermBadge({ level }) {
  const label = permissionLabel(level);
  return <span className={`set-roles__perm set-roles__perm--${level}`}>{label}</span>;
}

export default function AdminSettingsRoles() {
  const [roles, setRoles] = useState([]);
  const [totals, setTotals] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(ROLES.SUPER_ADMIN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesData, usersData] = await Promise.all([
        fetchJson('/api/admin/roles', { cache: 'no-store' }),
        fetchJson('/api/admin/users', { cache: 'no-store' }),
      ]);
      setRoles(rolesData.roles || []);
      setTotals(rolesData.totals || null);
      setUsers(usersData.users || []);
    } catch (e) {
      setError(e?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) || roles[0] || null,
    [roles, selectedId]
  );

  const roleMembers = useMemo(() => {
    if (!selected) return [];
    return users.filter((u) => u.role === selected.id);
  }, [users, selected]);

  if (loading) {
    return (
      <div className="set-roles">
        <p className="set-roles__loading">Loading roles & permissions…</p>
      </div>
    );
  }

  if (error && roles.length === 0) {
    return (
      <div className="set-roles">
        <div className="set-roles__alert">{error}</div>
      </div>
    );
  }

  return (
    <div className="set-roles">
      <header className="set-roles__hero">
        <div>
          <p className="set-roles__badge">Settings · Access control</p>
          <h1 className="set-roles__title">Roles & permissions</h1>
          <p className="set-roles__sub">
            Built-in workspace roles enforced across builder, publishing, CMS, SEO, and admin APIs. Assign roles per
            user on the team page.
          </p>
          <Link href="/admin/settings/users" className="set-roles__link">
            Manage team members →
          </Link>
        </div>
        <div className="set-roles__stats">
          <div className="set-roles__stat">
            <span className="set-roles__stat-val">{totals?.roles ?? roles.length}</span>
            <span className="set-roles__stat-lbl">Roles</span>
          </div>
          <div className="set-roles__stat">
            <span className="set-roles__stat-val">{totals?.members ?? 0}</span>
            <span className="set-roles__stat-lbl">Members</span>
          </div>
          <div className="set-roles__stat">
            <span className="set-roles__stat-val">{totals?.active ?? 0}</span>
            <span className="set-roles__stat-lbl">Active</span>
          </div>
        </div>
      </header>

      {error ? <div className="set-roles__alert">{error}</div> : null}

      <div className="set-roles__layout">
        <div className="set-roles__list" role="tablist" aria-label="Roles">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              role="tab"
              aria-selected={selectedId === role.id}
              className={`set-roles__card${selectedId === role.id ? ' is-active' : ''}`}
              onClick={() => setSelectedId(role.id)}
            >
              <span className={`set-roles__icon set-roles__icon--${role.id}`} aria-hidden="true">
                {role.icon}
              </span>
              <span>
                <p className="set-roles__card-title">{role.label}</p>
                <p className="set-roles__card-summary">{role.summary}</p>
                <span className="set-roles__card-meta">
                  <span className="set-roles__pill">
                    {role.memberCount} member{role.memberCount === 1 ? '' : 's'}
                  </span>
                  <span className="set-roles__pill">{role.activeCount} active</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        {selected ? (
          <section className="set-roles__panel" role="tabpanel">
            <div className="set-roles__panel-head">
              <div>
                <h2 className="set-roles__panel-title">{selected.label}</h2>
                <p className="set-roles__panel-desc">{selected.description}</p>
              </div>
              <Link
                href={`/admin/settings/users?role=${encodeURIComponent(selected.id)}`}
                className="set-roles__btn"
              >
                Assign members
              </Link>
            </div>

            <p className="set-roles__scope">
              <strong>Project scope:</strong> {selected.projectScope}
            </p>

            <div>
              <h3 className="set-roles__section-title">Permission matrix</h3>
              <div className="set-roles__matrix-wrap">
                <table className="set-roles__matrix">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Access level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((mod) => (
                      <tr key={mod.id}>
                        <td>
                          <span className="set-roles__module">{mod.label}</span>
                          <span className="set-roles__module-hint">{mod.hint}</span>
                        </td>
                        <td>
                          <PermBadge level={selected.permissions?.[mod.id] || 'none'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="set-roles__section-title">
                Members with this role ({roleMembers.length})
              </h3>
              {roleMembers.length === 0 ? (
                <div className="set-roles__empty">
                  No users assigned yet.{' '}
                  <Link href={`/admin/settings/users?role=${encodeURIComponent(selected.id)}`}>
                    Add a team member
                  </Link>
                </div>
              ) : (
                <div className="set-roles__members">
                  {roleMembers.map((user) => (
                    <div key={user.id} className="set-roles__member">
                      <div>
                        <div className="set-roles__member-name">{user.displayName}</div>
                        <div className="set-roles__member-email">{user.email}</div>
                      </div>
                      <span
                        className={`set-roles__member-status${user.isActive ? '' : ' set-roles__member-status--off'}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="set-roles__note">
              Roles are fixed platform enums stored on each user account. Custom per-module roles are not editable here
              — change a member&apos;s role under{' '}
              <Link href="/admin/settings/users">Settings → Users</Link>.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
