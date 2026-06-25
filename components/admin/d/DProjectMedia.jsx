'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProjectWorkspaceChrome from '@/components/admin/workspace/ProjectWorkspaceChrome';
import { formatLabelForMime } from '@/lib/media/mediaLabels';
import { normalizeMediaItemForBuilder } from '@/lib/media/projectMediaApi';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-media.css';
import '@/styles/admin/project-menus.css';

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
  const url = item?.publicUrl || item?.url || '';
  const thumb = item?.thumbUrl || url;
  const isVisual = item?.kind === 'image' || item?.kind === 'svg' || String(item?.mimeType || '').startsWith('image/');

  if (isVisual && thumb) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={fit === 'contain' ? 'proj-media__img--contain' : undefined}
        src={thumb}
        alt={item.altText || item.title || item.originalName || ''}
        loading="lazy"
      />
    );
  }
  return (
    <div className="proj-media__thumb-fallback" aria-hidden="true">
      {kindLabel(item)}
    </div>
  );
}

export default function DProjectMedia({ projectId }) {
  const [project, setProject] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProjectSlug, setActiveProjectSlug] = useState(null);
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
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const pid = String(projectId);
  const listBase = `/api/admin/projects/${pid}/media`;
  const uploadUrl = `/api/admin/projects/${pid}/media/upload`;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '96', sort });
      if (query.trim()) params.set('q', query.trim());
      if (kind) params.set('kind', kind);

      const [mediaData, projectsRes, settingsRes] = await Promise.all([
        fetchJson(`${listBase}?${params}`, { cache: 'no-store' }),
        fetch('/api/admin/projects', { cache: 'no-store' }),
        fetch('/api/platform/site-settings', { cache: 'no-store' }),
      ]);
      const projectsData = await projectsRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!projectsRes.ok) throw new Error(projectsData?.error || 'Failed to load project');

      const found = (projectsData.projects || []).find((p) => String(p.id) === pid);
      if (!found) throw new Error('Project not found');
      setProject(found);
      const activeId = settingsData?.settings?.activeProjectId ?? null;
      setActiveProjectId(activeId);
      if (activeId != null) {
        const active = (projectsData.projects || []).find((p) => Number(p.id) === Number(activeId));
        setActiveProjectSlug(active?.slug ?? null);
      }
      setItems(
        Array.isArray(mediaData.items)
          ? mediaData.items.map((row) => normalizeMediaItemForBuilder(row))
          : []
      );
      setTotal(Number(mediaData.total) || 0);
    } catch (e) {
      setError(e?.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [listBase, pid, query, kind, sort]);

  useEffect(() => {
    const t = window.setTimeout(() => load(), query ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, query]);

  const stats = useMemo(() => {
    const images = items.filter((i) => i.kind === 'image' || i.kind === 'svg').length;
    const bytes = items.reduce((s, i) => s + (Number(i.bytes || i.size) || 0), 0);
    return { images, bytes };
  }, [items]);

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
        await fetchJson(uploadUrl, { method: 'POST', body: fd });
      }
      setSuccess(files.length === 1 ? `Uploaded ${files[0].name}` : `Uploaded ${files.length} files`);
      await load();
    } catch (e) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.originalName || item.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      await fetchJson(`/api/admin/media/${item.id}`, { method: 'DELETE' });
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
      <ProjectWorkspaceChrome
        project={project}
        activeProjectId={activeProjectId}
        activeProjectSlug={activeProjectSlug}
        section="media"
        loading={loading}
        stats={
          project ? (
            <>
              <span className="proj-workspace__pill">
                Assets <strong>{total}</strong>
              </span>
              <span className="proj-workspace__pill">
                Images <strong>{stats.images}</strong>
              </span>
              <span className="proj-workspace__pill">
                Size <strong>{humanBytes(stats.bytes)}</strong>
              </span>
            </>
          ) : null
        }
      >
        <p className="proj-media__sub">
          Upload images and files for use in the builder. Files are stored under <code>public/uploads</code>.
        </p>

      {error ? (
        <p className="proj-media__alert proj-media__alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="proj-media__alert proj-media__alert--success">{success}</p> : null}

      <div className="proj-media__toolbar">
        <label className="proj-media__search">
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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          uploadFiles(e.dataTransfer.files);
        }}
      >
        <p>Drag & drop files here, or use <strong>Upload files</strong></p>
        <span>JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF · max 25 MB</span>
      </div>

      {loading ? <div className="proj-media__skeleton" aria-hidden="true" /> : null}

      {!loading && !items.length ? (
        <div className="proj-media__empty">
          <p className="proj-media__empty-title">No media yet</p>
          <p className="proj-media__empty-text">Upload images to use them in builder image fields.</p>
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
                onClick={() => setSelected(item)}
              >
                <div className="proj-media__thumb">
                  <MediaThumb item={item} />
                </div>
                <div className="proj-media__card-body">
                  <span className="proj-media__card-name">{item.title || item.originalName}</span>
                  <span className="proj-media__card-meta">
                    {kindLabel(item)} · {humanBytes(item.bytes || item.size)}
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
                {kindLabel(selected)} · {humanBytes(selected.bytes || selected.size)}
              </p>
              <div className="proj-media__url">
                <code>{selected.publicUrl || selected.url}</code>
                <button
                  type="button"
                  className="proj-media__btn"
                  onClick={() => copyUrl(selected.publicUrl || selected.url)}
                >
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
              </div>
              <div className="proj-media__detail-actions">
                <a
                  className="proj-media__btn"
                  href={selected.publicUrl || selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open file
                </a>
                <button
                  type="button"
                  className="proj-media__btn proj-media__btn--danger"
                  disabled={busy}
                  onClick={() => deleteItem(selected)}
                >
                  Delete
                </button>
              </div>
            </aside>
          ) : (
            <aside className="proj-media__detail proj-media__detail--empty">
              <p>Select an asset to copy its URL or delete it.</p>
            </aside>
          )}
        </div>
      ) : null}
      </ProjectWorkspaceChrome>
    </div>
  );
}
