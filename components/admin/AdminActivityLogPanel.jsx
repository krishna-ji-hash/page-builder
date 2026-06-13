'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { activityActionLabel, activityActionMeta, ACTIVITY_ACTION_LABELS } from '@/lib/admin/activityActions';
import '@/styles/admin/platform.css';
import '@/styles/admin/activity.css';

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(value);
  }
}

function formatRelative(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatWhen(value);
  } catch {
    return '';
  }
}

function dateGroupLabel(value) {
  if (!value) return 'Unknown';
  try {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Unknown';
  }
}

function describeEntry(entry) {
  const parts = [];
  if (entry.projectName || entry.projectSlug) {
    parts.push(entry.projectName || entry.projectSlug);
  }
  if (entry.pageTitle || entry.pageSlug) {
    parts.push(entry.pageTitle || entry.pageSlug);
  }
  const meta = entry.metadata;
  if (meta?.domain) parts.push(meta.domain);
  if (meta?.versionId) parts.push(`v${meta.versionId}`);
  if (meta?.format) parts.push(meta.format);
  return parts.length ? parts.join(' · ') : null;
}

function userInitial(entry) {
  const name = entry.userDisplayName || entry.userEmail || '?';
  return (name[0] || '?').toUpperCase();
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All actions' },
  ...Object.entries(ACTIVITY_ACTION_LABELS).map(([action, label]) => ({
    value: action,
    label,
  })),
];

export default function AdminActivityLogPanel({
  projectId = null,
  title = 'Activity logs',
  limit = 25,
  showToolbar = true,
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (silent = false) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (projectId) params.set('projectId', String(projectId));

      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/admin/activity-logs?${params}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load activity');
        setLogs(Array.isArray(json.logs) ? json.logs : []);
        setWarning(json.warning || '');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, limit]
  );

  useEffect(() => {
    load();
  }, [load]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
      if (!q) return true;
      const hay = [
        entry.actionLabel,
        entry.userDisplayName,
        entry.userEmail,
        entry.projectName,
        entry.projectSlug,
        entry.pageTitle,
        entry.pageSlug,
        describeEntry(entry),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, actionFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const entry of filteredLogs) {
      const key = dateGroupLabel(entry.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    }
    return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }));
  }, [filteredLogs]);

  const uniqueUsers = useMemo(() => {
    const set = new Set(logs.map((e) => e.userDisplayName || e.userEmail).filter(Boolean));
    return set.size;
  }, [logs]);

  return (
    <section className="platform-panel activity-feed" aria-labelledby={title ? 'activity-feed-title' : undefined}>
      {title ? (
        <div className="platform-panel__head">
          <div>
            <h2 id="activity-feed-title" className="platform-panel__title">
              {title}
            </h2>
            <p className="platform-panel__sub">
              {filteredLogs.length} event{filteredLogs.length === 1 ? '' : 's'}
              {projectId ? ' for this project' : ' across the platform'}
            </p>
          </div>
        </div>
      ) : null}

      {showToolbar ? (
        <div className="activity-feed__toolbar">
          <div className="activity-feed__stats">
            <span className="activity-feed__stat">
              Total <strong>{logs.length}</strong>
            </span>
            <span className="activity-feed__stat">
              Showing <strong>{filteredLogs.length}</strong>
            </span>
            {uniqueUsers ? (
              <span className="activity-feed__stat">
                Users <strong>{uniqueUsers}</strong>
              </span>
            ) : null}
          </div>
          <div className="activity-feed__controls">
            <input
              type="search"
              className="platform-search"
              placeholder="Search activity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search activity"
            />
            <select
              className="activity-feed__filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by action"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="platform-btn"
              onClick={() => load(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="platform-panel__body platform-panel__body--padded">
          {[0, 1, 2].map((i) => (
            <div key={i} className="platform-skeleton platform-skeleton--row" style={{ marginBottom: 8 }} />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="platform-panel__body platform-panel__body--padded">
          <p className="platform-alert platform-alert--error" role="alert">
            {error}
          </p>
        </div>
      ) : null}

      {warning ? (
        <div className="platform-panel__body platform-panel__body--padded">
          <p className="platform-alert platform-alert--warn" role="status">
            {warning}
          </p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="activity-feed__body">
          {filteredLogs.length === 0 ? (
            <div className="activity-feed__empty">
              <div className="activity-feed__empty-icon" aria-hidden="true">
                ◷
              </div>
              <p className="activity-feed__empty-title">No activity yet</p>
              <p className="activity-feed__empty-text">
                {search || actionFilter !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Actions like sign-in, publish, and domain changes will appear here.'}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="activity-feed__group">
                <p className="activity-feed__date">{group.label}</p>
                <ul className="activity-feed__list">
                  {group.entries.map((entry) => {
                    const meta = activityActionMeta(entry.action);
                    const detail = describeEntry(entry);
                    return (
                      <li key={entry.id} className="activity-feed__item">
                        <span
                          className={`activity-feed__icon activity-feed__icon--${meta.tone}`}
                          aria-hidden="true"
                        >
                          {meta.icon}
                        </span>
                        <div className="activity-feed__main">
                          <p className="activity-feed__action">
                            {entry.actionLabel || activityActionLabel(entry.action)}
                          </p>
                          {detail ? <p className="activity-feed__detail">{detail}</p> : null}
                        </div>
                        <div className="activity-feed__meta">
                          <time className="activity-feed__time" dateTime={entry.createdAt} title={formatWhen(entry.createdAt)}>
                            {formatRelative(entry.createdAt)}
                          </time>
                          <span className="activity-feed__user">
                            <span className="activity-feed__user-avatar" aria-hidden="true">
                              {userInitial(entry)}
                            </span>
                            {entry.userDisplayName || entry.userEmail || 'System'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
