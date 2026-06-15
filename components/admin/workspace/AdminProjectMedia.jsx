'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatLabelForMime } from '@/lib/media/mediaLabels';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-media.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

function humanBytes(bytes) {
  const b = Number(bytes || 0);
  if (!Number.isFinite(b) || b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  const val = b / 1024 ** exp;
  return `${val.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}

function kindLabel(item) {
  if (item?.mimeType) return formatLabelForMime(item.mimeType);
  if (item?.kind === 'video') return 'Video';
  if (item?.kind === 'svg') return 'SVG';
  if (item?.kind === 'document') return 'Document';
  return 'Image';
}

function MediaThumb({ item, fit = 'cover' }) {
  const candidates = useMemo(() => {
    const list = [item?.thumbUrl, item?.publicUrl].filter(Boolean);
    return [...new Set(list)];
  }, [item?.thumbUrl, item?.publicUrl]);
  const [srcIndex, setSrcIndex] = useState(0);
  const src = candidates[srcIndex] || '';
  const isVisual = item?.kind === 'image' || item?.kind === 'svg';

  useEffect(() => {
    setSrcIndex(0);
  }, [item?.id, item?.thumbUrl, item?.publicUrl]);

  if (isVisual && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={fit === 'contain' ? 'proj-media__img--contain' : undefined}
        src={src}
        alt={item.altText || item.title || item.originalName || ''}
        loading="lazy"
        onError={() => {
          setSrcIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
        }}
      />
    );
  }
  return (
    <div className="proj-media__thumb-fallback" aria-hidden="true">
      {kindLabel(item)}
    </div>
  );
}

export default function AdminProjectMedia({ projectId }) {
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [selected, setSelected] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const pid = Number(projectId);
  const apiBase = `/api/projects/${pid}/media`;

  const load = useCallback(async () => {
    if (!Number.isInteger(pid) || pid <= 0) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '96',
        sort,
      });
      if (query.trim()) params.set('q', query.trim());
      if (kind) params.set('kind', kind);

      const [mediaData, projectsData] = await Promise.all([
        fetchJson(`${apiBase}?${params}`, { cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      ]);
      setProject((projectsData.projects || []).find((p) => Number(p.id) === pid) || null);
      setItems(Array.isArray(mediaData.items) ? mediaData.items : []);
      setTotal(Number(mediaData.total) || 0);
    } catch (e) {
      setError(e?.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [apiBase, pid, query, kind, sort]);

  useEffect(() => {
    const t = window.setTimeout(() => load(), query ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, query]);

  const stats = useMemo(() => {
    const images = items.filter((i) => i.kind === 'image' || i.kind === 'svg').length;
    const videos = items.filter((i) => i.kind === 'video').length;
    const bytes = items.reduce((s, i) => s + (Number(i.bytes) || 0), 0);
    return { images, videos, bytes };
  }, [items]);

  const openItem = (item) => {
    setSelected(item);
    setEditTitle(item.title || '');
    setEditAlt(item.altText || '');
    setCopied(false);
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        await fetchJson(apiBase, { method: 'POST', body: fd });
      }
      setSuccess(files.length === 1 ? `Uploaded ${files[0].name}` : `Uploaded ${files.length} files`);
      await load();
    } catch (e) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveMetadata = async () => {
    if (!selected?.id) return;
    setBusy(true);
    setError('');
    try {
      const data = await fetchJson(`${apiBase}/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, altText: editAlt }),
      });
      const updated = data.item || data;
      setSelected(updated);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSuccess('Asset details saved');
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.originalName || item.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      await fetchJson(`${apiBase}/${item.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotal((t) => Math.max(0, t - 1));
      if (selected?.id === item.id) setSelected(null);
      setSuccess('Asset deleted');
    } catch (e) {
      setError(e?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy URL');
    }
  };

  return (
    <div className="proj-media">
      <header className="proj-media__hero">
        <div className="proj-media__hero-main">
          <p className="proj-media__badge">Workspace · Media</p>
          <h1 className="proj-media__title">Media library</h1>
          <p className="proj-media__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — upload images, videos, and documents for use in the builder.
              </>
            ) : (
              'Upload and manage project assets for the builder.'
            )}
          </p>
        </div>
        <div className="proj-media__stats">
          <div className="proj-media__stat">
            <span className="proj-media__stat-val">{total}</span>
            <span className="proj-media__stat-label">Assets</span>
          </div>
          <div className="proj-media__stat">
            <span className="proj-media__stat-val">{stats.images}</span>
            <span className="proj-media__stat-label">Images</span>
          </div>
          <div className="proj-media__stat">
            <span className="proj-media__stat-val">{humanBytes(stats.bytes)}</span>
            <span className="proj-media__stat-label">On page</span>
          </div>
        </div>
      </header>

      {error ? (
        <p className="proj-media__alert proj-media__alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="proj-media__alert proj-media__alert--success">{success}</p> : null}

      <div className="proj-media__toolbar">
        <label className="proj-media__search">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets…"
            aria-label="Search media"
          />
        </label>
        <select className="proj-media__select" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter type">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="svg">SVG</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
        <select className="proj-media__select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="created_desc">Newest</option>
          <option value="created_asc">Oldest</option>
          <option value="name_asc">Name</option>
          <option value="size_desc">Largest</option>
        </select>
        <input
          ref={fileRef}
          type="file"
          className="proj-media__file-input"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,application/pdf,.webp,.jpg,.jpeg,.png"
          onChange={(e) => {
            uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="proj-media__btn proj-media__btn--primary"
          disabled={uploading || busy}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload files'}
        </button>
      </div>

      <div
        className="proj-media__dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('proj-media__dropzone--active');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('proj-media__dropzone--active');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('proj-media__dropzone--active');
          uploadFiles(e.dataTransfer.files);
        }}
      >
        <p>Drag & drop files here, or use <strong>Upload files</strong></p>
        <span>JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF · max 25 MB</span>
        <span className="proj-media__dropzone-note">JPEG/PNG are auto-optimized to WebP on upload</span>
      </div>

      {loading ? <div className="proj-media__skeleton" aria-hidden="true" /> : null}

      {!loading && !items.length ? (
        <div className="proj-media__empty">
          <div className="proj-media__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="17" cy="21" r="3" stroke="currentColor" strokeWidth="2" />
              <path d="M6 32l10-8 8 6 8-10 10 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="proj-media__empty-title">No media yet</p>
          <p className="proj-media__empty-text">Upload images and files to use them across pages in the builder.</p>
          <button
            type="button"
            className="proj-media__btn proj-media__btn--primary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Upload your first file
          </button>
        </div>
      ) : null}

      {!loading && items.length ? (
        <div className="proj-media__layout">
          <div className="proj-media__grid" role="list">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="listitem"
                className={`proj-media__card${selected?.id === item.id ? ' proj-media__card--active' : ''}`}
                onClick={() => openItem(item)}
              >
                <div className="proj-media__thumb">
                  <MediaThumb item={item} />
                </div>
                <div className="proj-media__card-body">
                  <span className="proj-media__card-name">{item.title || item.originalName}</span>
                  <span className="proj-media__card-meta">
                    {kindLabel(item)} · {humanBytes(item.bytes)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <aside className="proj-media__detail">
              <div className="proj-media__detail-preview">
                <MediaThumb item={selected} fit="contain" />
              </div>
              <h2 className="proj-media__detail-title">{selected.originalName}</h2>
              <p className="proj-media__detail-meta">
                {kindLabel(selected)}
                {selected.width && selected.height ? ` · ${selected.width}×${selected.height}` : ''} · {humanBytes(selected.bytes)}
              </p>
              <label className="proj-media__field">
                <span>Title</span>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </label>
              <label className="proj-media__field">
                <span>Alt text</span>
                <input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} placeholder="Describe image for accessibility" />
              </label>
              <div className="proj-media__url">
                <code>{selected.publicUrl}</code>
                <button type="button" className="proj-media__btn" onClick={() => copyUrl(selected.publicUrl)}>
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
              </div>
              <div className="proj-media__detail-actions">
                <button type="button" className="proj-media__btn proj-media__btn--primary" disabled={busy} onClick={saveMetadata}>
                  Save details
                </button>
                <a className="proj-media__btn" href={selected.publicUrl} target="_blank" rel="noopener noreferrer">
                  Open file
                </a>
                <button type="button" className="proj-media__btn proj-media__btn--danger" disabled={busy} onClick={() => deleteItem(selected)}>
                  Delete
                </button>
              </div>
            </aside>
          ) : (
            <aside className="proj-media__detail proj-media__detail--empty">
              <p>Select an asset to edit title, alt text, or copy its URL.</p>
            </aside>
          )}
        </div>
      ) : null}
    </div>
  );
}
