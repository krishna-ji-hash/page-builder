'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import '@/styles/admin/platform.css';
import '@/styles/admin/forms.css';
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
  const [collections, setCollections] = useState([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const active = useMemo(() => collections.find((c) => c.slug === activeSlug) || null, [collections, activeSlug]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await fetchJson(`/api/projects/${projectId}/cms/collections`);
      setCollections(Array.isArray(data.collections) ? data.collections : []);
      const first = Array.isArray(data.collections) && data.collections[0] ? data.collections[0].slug : '';
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
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · CMS"
        title="Collections"
        description="Manage content collections and published items for this project."
        actions={
          <div className="platform-actions">
            <button type="button" className="platform-btn" onClick={onCreateCollection} disabled={busy}>
              New collection
            </button>
            <button
              type="button"
              className="platform-btn platform-btn--primary"
              onClick={onCreateItem}
              disabled={busy || !activeSlug}
            >
              New item
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="platform-skeleton platform-skeleton--card" style={{ height: 280 }} aria-hidden="true" />
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <div className="admin-cms-layout">
          <section className="platform-panel admin-cms-collections">
            <div className="platform-panel__head">
              <h2 className="platform-panel__title">Collections</h2>
              <p className="platform-panel__sub">{collections.length} total</p>
            </div>
            <ul className="admin-cms-list">
              {collections.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`admin-cms-list__btn${c.slug === activeSlug ? ' is-active' : ''}`}
                    onClick={() => setActiveSlug(c.slug)}
                  >
                    <span className="admin-cms-list__name">{c.name}</span>
                    <span className="admin-cms-list__slug">{c.slug}</span>
                  </button>
                </li>
              ))}
              {!collections.length ? (
                <li className="admin-cms-list__empty">No collections yet.</li>
              ) : null}
            </ul>
          </section>

          <section className="platform-panel admin-cms-items">
            <div className="platform-panel__head">
              <div>
                <h2 className="platform-panel__title">Items</h2>
                <p className="platform-panel__sub">
                  {active ? active.slug : 'Select a collection'}
                </p>
              </div>
            </div>
            <div className="platform-panel__body platform-panel__body--padded">
              {!activeSlug ? (
                <p className="admin-cms-list__empty">Select a collection to view items.</p>
              ) : !items.length ? (
                <p className="admin-cms-list__empty">No published items yet.</p>
              ) : (
                <ul className="admin-cms-items-list">
                  {items.map((it) => (
                    <li key={it.id} className="admin-cms-item">
                      <span className="admin-cms-item__title">{it.title || it.slug}</span>
                      <span className="admin-cms-item__slug">{it.slug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
