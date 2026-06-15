'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminActivityLogPanel from '@/components/admin/AdminActivityLogPanel';
import { activityActionLabel } from '@/lib/admin/activityActions';
import '@/styles/admin/platform.css';
import '@/styles/admin/activity.css';
import '@/styles/admin/settings-system.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export default function AdminSystemSettings() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson('/api/admin/system', { cache: 'no-store' });
      setOverview(data);
    } catch (e) {
      setError(e?.message || 'Failed to load system overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = overview?.stats;

  if (loading) {
    return (
      <div className="set-system">
        <p className="set-system__loading">Loading system overview…</p>
      </div>
    );
  }

  return (
    <div className="set-system">
      <header className="set-system__hero">
        <div>
          <p className="set-system__badge">Settings · Operations</p>
          <h1 className="set-system__title">System</h1>
          <p className="set-system__sub">
            Platform audit trail, operational visibility, and activity history across all projects.
          </p>
          <div className="set-system__links">
            <Link href="/admin/settings/users" className="set-system__link">
              Team members →
            </Link>
            <Link href="/admin/settings/roles" className="set-system__link">
              Roles & permissions →
            </Link>
            <Link href="/admin/platform-health" className="set-system__link">
              Platform health →
            </Link>
          </div>
        </div>
        <div className="set-system__stats">
          <div className="set-system__stat">
            <span className="set-system__stat-val set-system__stat-val--live">
              {overview?.auditStatus === 'live' ? 'Live' : 'Pending'}
            </span>
            <span className="set-system__stat-lbl">Audit</span>
          </div>
          <div className="set-system__stat">
            <span className="set-system__stat-val">{stats?.totalEvents ?? 0}</span>
            <span className="set-system__stat-lbl">Events</span>
          </div>
          <div className="set-system__stat">
            <span className="set-system__stat-val">{stats?.todayEvents ?? 0}</span>
            <span className="set-system__stat-lbl">Today</span>
          </div>
          <div className="set-system__stat">
            <span className="set-system__stat-val">{stats?.uniqueActors ?? 0}</span>
            <span className="set-system__stat-lbl">Actors</span>
          </div>
        </div>
      </header>

      {error ? <div className="set-system__alert">{error}</div> : null}
      {overview?.warning ? (
        <div className="set-system__alert set-system__alert--warn">{overview.warning}</div>
      ) : null}

      <div className="set-system__grid">
        <article className="set-system__card">
          <p className="set-system__card-label">Audit trail</p>
          <p className="set-system__card-value">Real-time</p>
          <p className="set-system__card-hint">
            Sign-ins, publishes, domain changes, backups, and user management are logged automatically.
          </p>
        </article>
        <article className="set-system__card">
          <p className="set-system__card-label">Retention</p>
          <p className="set-system__card-value">Database</p>
          <p className="set-system__card-hint">
            Events stored in <code>admin_activity_logs</code>. {stats?.weekEvents ?? 0} events in the last 7 days.
          </p>
        </article>
        <article className="set-system__card">
          <p className="set-system__card-label">Workspace</p>
          <p className="set-system__card-value">
            {stats?.activeUsers ?? 0} / {stats?.projects ?? 0}
          </p>
          <p className="set-system__card-hint">Active admin users and total projects on this platform.</p>
        </article>
      </div>

      {overview?.topActions?.length > 0 ? (
        <div className="set-system__actions" aria-label="Top actions (30 days)">
          {overview.topActions.map((item) => (
            <span key={item.action} className="set-system__chip">
              {activityActionLabel(item.action)} <strong>{item.count}</strong>
            </span>
          ))}
        </div>
      ) : null}

      <section className="set-system__feed" aria-labelledby="system-activity-title">
        <div className="set-system__feed-head">
          <h2 id="system-activity-title" className="set-system__feed-title">
            Platform activity
          </h2>
          <p className="set-system__feed-sub">Search, filter, and refresh the live audit feed.</p>
        </div>
        <AdminActivityLogPanel title="" limit={50} variant="embedded" />
      </section>
    </div>
  );
}
