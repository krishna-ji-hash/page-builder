'use client';

import { useEffect, useMemo, useState } from 'react';

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

export default function CmsManagerShell({ projectId }) {
  const [collections, setCollections] = useState([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
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
    }
  };

  const loadItems = async (slug) => {
    if (!slug) return;
    setBusy(true);
    setError('');
    try {
      const data = await fetchJson(`/api/projects/${projectId}/cms/collections/${slug}/items?status=published&limit=50`);
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
    setError('');
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
    setError('');
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
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>CMS Collections</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>Basic manager (Phase 12 scaffold)</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="bld-btn bld-btn--default" type="button" onClick={onCreateCollection} disabled={busy}>
            New collection
          </button>
          <button className="bld-btn bld-btn--info" type="button" onClick={onCreateItem} disabled={busy || !activeSlug}>
            New item
          </button>
        </div>
      </div>

      {error ? <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 700 }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, marginTop: 14, minWidth: 0 }}>
        <div style={{ border: '1px solid rgba(148,163,184,0.35)', borderRadius: 12, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ padding: 10, fontWeight: 900, background: 'rgba(2,6,23,0.03)' }}>Collections</div>
          <div style={{ display: 'grid' }}>
            {collections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveSlug(c.slug)}
                style={{
                  textAlign: 'left',
                  padding: '10px 10px',
                  border: 'none',
                  borderTop: '1px solid rgba(148,163,184,0.22)',
                  background: c.slug === activeSlug ? 'rgba(99,102,241,0.10)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800 }}>{c.name}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>{c.slug}</div>
              </button>
            ))}
            {!collections.length ? <div style={{ padding: 10, opacity: 0.75 }}>No collections yet.</div> : null}
          </div>
        </div>

        <div style={{ border: '1px solid rgba(148,163,184,0.35)', borderRadius: 12, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ padding: 10, fontWeight: 900, background: 'rgba(2,6,23,0.03)' }}>
            Items {active ? <span style={{ opacity: 0.7, fontWeight: 700 }}>({active.slug})</span> : null}
          </div>
          <div style={{ padding: 10, display: 'grid', gap: 8 }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.25)',
                  minWidth: 0,
                }}
              >
                <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.title || it.slug}
                </div>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 2 }}>{it.slug}</div>
              </div>
            ))}
            {activeSlug && !items.length ? <div style={{ opacity: 0.75 }}>No published items yet.</div> : null}
            {!activeSlug ? <div style={{ opacity: 0.75 }}>Select a collection.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

