'use client';

import { useEffect, useMemo, useState } from 'react';
import '@/styles/admin/platform.css';
import '@/styles/admin/cms.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function safeSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export default function AdminProjectCms({ projectId }) {
  const [project, setProject] = useState(null);
  const [collections, setCollections] = useState([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const active = useMemo(() => collections.find((c) => c.slug === activeSlug) || null, [collections, activeSlug]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        String(it.title || '').toLowerCase().includes(q) ||
        String(it.slug || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const pid = Number(projectId);
      const [cmsData, projectsData] = await Promise.all([
        fetchJson(`/api/projects/${projectId}/cms/collections`),
        fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      ]);
      setCollections(Array.isArray(cmsData.collections) ? cmsData.collections : []);
      const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
      setProject(found || null);
      const first = Array.isArray(cmsData.collections) && cmsData.collections[0] ? cmsData.collections[0].slug : '';
      setActiveSlug((cur) => cur || first || '');
    } catch (e) {
      setError(e?.message || 'Failed to load collections');
    } finally {
      setBusy(false);
      setLoading(false);
    }
  };

  const loadItems = async (slug) => {
    if (!slug) return;
    setBusy(true);
    setError('');
    try {
      const data = await fetchJson(
        `/api/projects/${projectId}/cms/collections/${slug}/items?status=published&limit=50`
      );
      setItems(Array.isArray(data.items) ? data.items : []);
      setQuery('');
    } catch (e) {
      setError(e?.message || 'Failed to load items');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (activeSlug) loadItems(activeSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  const onCreateCollection = async () => {
    const name = window.prompt('Collection name', 'Blog Posts');
    if (!name) return;
    const slug = safeSlug(window.prompt('Collection slug', safeSlug(name)) || safeSlug(name));
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/cms/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, type: 'custom', schema: { fields: [] } }),
      });
      await load();
      setActiveSlug(slug);
    } catch (e) {
      setError(e?.message || 'Failed to create collection');
    } finally {
      setBusy(false);
    }
  };

  const onCreateItem = async () => {
    if (!activeSlug) return;
    const title = window.prompt('Item title', 'New item');
    if (!title) return;
    const slug = safeSlug(window.prompt('Item slug', safeSlug(title)) || safeSlug(title));
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/cms/collections/${activeSlug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          title,
          slug,
          data: { title, slug },
        }),
      });
      await loadItems(activeSlug);
    } catch (e) {
      setError(e?.message || 'Failed to create item');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="proj-cms">
      <header className="proj-cms__hero">
        <div className="proj-cms__hero-main">
          <p className="proj-cms__badge">Workspace · CMS</p>
          <h1 className="proj-cms__title">Collections</h1>
          <p className="proj-cms__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — manage content collections and published items.
              </>
            ) : (
              'Manage content collections and published items for this project.'
            )}
          </p>
        </div>
        <div className="proj-cms__actions">
          <button type="button" className="proj-cms__btn" onClick={onCreateCollection} disabled={busy}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            New collection
          </button>
          <button
            type="button"
            className="proj-cms__btn proj-cms__btn--primary"
            onClick={onCreateItem}
            disabled={busy || !activeSlug}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            New item
          </button>
        </div>
      </header>

      {loading ? (
        <div className="proj-cms__skeleton" aria-hidden="true">
          <div className="proj-cms__skeleton-block" style={{ height: 320 }} />
          <div className="proj-cms__skeleton-block" style={{ height: 320 }} />
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <div className="proj-cms__layout">
          <aside className="proj-cms__panel proj-cms__collections">
            <div className="proj-cms__panel-head">
              <h2 className="proj-cms__panel-title">Collections</h2>
              <p className="proj-cms__panel-sub">{collections.length} total</p>
            </div>
            <div className="proj-cms__collections-body">
              {collections.length ? (
                <ul className="proj-cms__collections-list">
                  {collections.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`proj-cms__collection-btn${c.slug === activeSlug ? ' is-active' : ''}`}
                        onClick={() => setActiveSlug(c.slug)}
                      >
                        <span className="proj-cms__collection-name">{c.name}</span>
                        <span className="proj-cms__collection-slug">{c.slug}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="proj-cms__empty proj-cms__empty--inline">
                  <p className="proj-cms__empty-title">No collections</p>
                  <p className="proj-cms__empty-text">Create a collection to start adding content items.</p>
                  <button type="button" className="proj-cms__btn proj-cms__btn--primary" onClick={onCreateCollection} disabled={busy}>
                    New collection
                  </button>
                </div>
              )}
            </div>
          </aside>

          <section className="proj-cms__panel proj-cms__items">
            <div className="proj-cms__panel-head">
              <h2 className="proj-cms__panel-title">Published items</h2>
              <p className="proj-cms__panel-sub">
                {active ? (
                  <>
                    <code className="proj-cms__active-slug">{active.slug}</code>
                    {' · '}
                    {items.length} item{items.length === 1 ? '' : 's'}
                  </>
                ) : (
                  'Select a collection'
                )}
              </p>
            </div>
            <div className="proj-cms__items-body">
              {!activeSlug ? (
                <div className="proj-cms__empty">
                  <p className="proj-cms__empty-title">Select a collection</p>
                  <p className="proj-cms__empty-text">Choose a collection on the left to view and manage its items.</p>
                </div>
              ) : !items.length ? (
                <div className="proj-cms__empty">
                  <p className="proj-cms__empty-title">No published items</p>
                  <p className="proj-cms__empty-text">Add your first item to this collection.</p>
                  <button type="button" className="proj-cms__btn proj-cms__btn--primary" onClick={onCreateItem} disabled={busy}>
                    New item
                  </button>
                </div>
              ) : (
                <>
                  <div className="proj-cms__items-toolbar">
                    <span className="proj-cms__items-meta">
                      {query.trim() ? `${filteredItems.length} of ${items.length}` : `${items.length} items`}
                    </span>
                    <label className="proj-cms__search">
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search items…"
                        aria-label="Search items"
                      />
                    </label>
                  </div>
                  {query.trim() && !filteredItems.length ? (
                    <p className="proj-cms__empty-text" style={{ textAlign: 'center', padding: '16px 0' }}>
                      No items match &ldquo;{query.trim()}&rdquo;.
                    </p>
                  ) : (
                    <ul className="proj-cms__items-list">
                      {filteredItems.map((it) => (
                        <li key={it.id} className="proj-cms__item">
                          <span className="proj-cms__item-icon" aria-hidden="true">
                            <svg viewBox="0 0 16 16" fill="none">
                              <path d="M4 3.5h8v9H4v-9z" stroke="currentColor" strokeWidth="1.4" />
                              <path d="M6 6.5h4M6 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span className="proj-cms__item-text">
                            <span className="proj-cms__item-title">{it.title || it.slug}</span>
                            <span className="proj-cms__item-slug">{it.slug}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
