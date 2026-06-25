'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { activityActionLabel, activityActionMeta } from '@/lib/admin/activityActions';
import { ACTIVE_PROJECT_CHANGED } from '@/lib/admin/activeProjectEvents';
import { ADMIN_DASHBOARD_PATH, ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';
import { buildAdminSearchIndex, searchAdminIndex } from '@/lib/admin/adminSearchIndex';
import '@/styles/admin/topbar.css';

const NOTIF_SEEN_KEY = 'admin-notifications-last-seen';

const CLOCK_LOCALE = 'en-US';

function formatLiveClock(date) {
  return {
    time: date.toLocaleTimeString(CLOCK_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    date: date.toLocaleDateString(CLOCK_LOCALE, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };
}

function formatNotifWhen(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '';
  }
}

function describeNotification(entry) {
  const parts = [];
  if (entry.projectName || entry.projectSlug) parts.push(entry.projectName || entry.projectSlug);
  if (entry.pageTitle || entry.pageSlug) parts.push(entry.pageTitle || entry.pageSlug);
  const meta = entry.metadata;
  if (meta?.domain) parts.push(meta.domain);
  return parts.length ? parts.join(' · ') : null;
}

function AdminLiveClock() {
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    function tick() {
      setDisplay(formatLiveClock(new Date()));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="admin-topbar__clock" aria-live="polite">
      <span className="admin-topbar__clock-time">{display?.time ?? '--:--:--'}</span>
      <span className="admin-topbar__clock-date">{display?.date ?? '\u00a0'}</span>
    </div>
  );
}

function AdminThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="admin-topbar__icon-btn"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function AdminGlobalSearch({ projects }) {
  const router = useRouter();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    fetch('/api/platform/publishing', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPages(Array.isArray(data?.pages) ? data.pages : []))
      .catch(() => setPages([]));
  }, []);

  const index = useMemo(() => buildAdminSearchIndex({ projects, pages }), [projects, pages]);
  const results = useMemo(() => {
    if (!query.trim()) return index.slice(0, 8);
    return searchAdminIndex(index, query);
  }, [index, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const goTo = useCallback(
    (href) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router]
  );

  function onKeyDown(e) {
    if (!open && e.key === 'ArrowDown') {
      setOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[activeIndex];
      if (hit?.href) goTo(hit.href);
    }
  }

  return (
    <div className={`admin-topbar__search${open ? ' is-open' : ''}`} ref={rootRef}>
      <label className="admin-topbar__search-label" htmlFor="admin-global-search">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id="admin-global-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          placeholder="Search projects, pages, settings…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <kbd className="admin-topbar__search-kbd" aria-hidden="true">
          ⌘K
        </kbd>
      </label>

      {open ? (
        <div className="admin-topbar__search-panel" role="listbox">
          {!query.trim() ? (
            <p className="admin-topbar__search-hint">Quick links</p>
          ) : null}
          {!results.length ? (
            <p className="admin-topbar__search-empty">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <ul className="admin-topbar__search-results">
              {results.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`admin-topbar__search-hit${index === activeIndex ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item.href)}
                  >
                    <span className="admin-topbar__search-hit-main">
                      <span className="admin-topbar__search-hit-label">{item.label}</span>
                      {item.meta ? <span className="admin-topbar__search-hit-meta">{item.meta}</span> : null}
                    </span>
                    <span className="admin-topbar__search-hit-cat">{item.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSeenId, setLastSeenId] = useState(0);
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/activity-logs?limit=25', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(NOTIF_SEEN_KEY) || 0);
    if (Number.isFinite(stored)) setLastSeenId(stored);
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const unreadCount = useMemo(() => {
    if (!logs.length) return 0;
    return logs.filter((log) => Number(log.id) > lastSeenId).length;
  }, [logs, lastSeenId]);

  function markAllRead() {
    const maxId = logs.reduce((max, log) => Math.max(max, Number(log.id) || 0), 0);
    setLastSeenId(maxId);
    window.localStorage.setItem(NOTIF_SEEN_KEY, String(maxId));
  }

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        window.setTimeout(() => {
          const maxId = logs.reduce((max, log) => Math.max(max, Number(log.id) || 0), 0);
          setLastSeenId(maxId);
          window.localStorage.setItem(NOTIF_SEEN_KEY, String(maxId));
        }, 0);
      }
      return next;
    });
  }

  return (
    <div className="admin-topbar__notifications" ref={rootRef}>
      <button
        type="button"
        className="admin-topbar__icon-btn admin-topbar__icon-btn--notif"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={toggleOpen}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="admin-topbar__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="admin-topbar__notif-panel">
          <div className="admin-topbar__notif-head">
            <strong>Notifications</strong>
            <button type="button" className="admin-topbar__notif-mark" onClick={markAllRead}>
              Mark all read
            </button>
          </div>

          {loading ? <p className="admin-topbar__notif-empty">Loading…</p> : null}

          {!loading && !logs.length ? (
            <p className="admin-topbar__notif-empty">No activity yet. Publish, edit, or manage domains to see updates here.</p>
          ) : null}

          {!loading && logs.length ? (
            <ul className="admin-topbar__notif-list">
              {logs.map((entry) => {
                const meta = activityActionMeta(entry.action);
                const detail = describeNotification(entry);
                const isUnread = Number(entry.id) > lastSeenId;
                return (
                  <li
                    key={entry.id}
                    className={`admin-topbar__notif-item admin-topbar__notif-item--${meta.tone}${isUnread ? ' is-unread' : ''}`}
                  >
                    <span className={`admin-topbar__notif-icon admin-topbar__notif-icon--${meta.tone}`} aria-hidden="true">
                      {meta.icon}
                    </span>
                    <div className="admin-topbar__notif-body">
                      <span className="admin-topbar__notif-title">{activityActionLabel(entry.action)}</span>
                      {detail ? <span className="admin-topbar__notif-detail">{detail}</span> : null}
                      <span className="admin-topbar__notif-when">
                        {formatNotifWhen(entry.createdAt)}
                        {entry.userDisplayName ? ` · ${entry.userDisplayName}` : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="admin-topbar__notif-foot">
            <Link href={ADMIN_DASHBOARD_PATH} onClick={() => setOpen(false)}>
              View dashboard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminLiveSiteLink({ projects = [], activeProjectId = null }) {
  const [resolvedId, setResolvedId] = useState(activeProjectId);

  const loadActiveId = useCallback(() => {
    fetch('/api/platform/site-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setResolvedId(data?.settings?.activeProjectId ?? null))
      .catch(() => setResolvedId(null));
  }, []);

  useEffect(() => {
    setResolvedId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    loadActiveId();
    const onChanged = () => loadActiveId();
    window.addEventListener(ACTIVE_PROJECT_CHANGED, onChanged);
    return () => window.removeEventListener(ACTIVE_PROJECT_CHANGED, onChanged);
  }, [loadActiveId]);

  const activeProject = useMemo(
    () => projects.find((p) => Number(p.id) === Number(resolvedId)) || null,
    [projects, resolvedId]
  );

  if (!activeProject) {
    return (
      <Link href={ADMIN_PROJECTS_PATH} className="admin-topbar__live-link admin-topbar__live-link--muted">
        Set default site
      </Link>
    );
  }

  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="admin-topbar__live-link"
      title={`${activeProject.name} is published at localhost`}
    >
      Live: {activeProject.name}
    </a>
  );
}

export default function AdminTopbarTools({ projects = [], activeProjectId = null, theme = 'light', onToggleTheme }) {
  return (
    <div className="admin-topbar__tools">
      <AdminLiveSiteLink projects={projects} activeProjectId={activeProjectId} />
      <AdminGlobalSearch projects={projects} />
      <AdminLiveClock />
      <AdminThemeToggle theme={theme} onToggle={onToggleTheme} />
      <AdminNotifications />
    </div>
  );
}
