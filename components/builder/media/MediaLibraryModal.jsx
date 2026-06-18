'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';

function humanBytes(bytes) {
  const b = Number(bytes || 0);
  if (!Number.isFinite(b) || b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  const val = b / Math.pow(1024, exp);
  return `${val.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}

const MEDIA_GRID_COLS = 5;

function kindIcon(kind) {
  if (kind === 'video') return 'VID';
  if (kind === 'svg') return 'SVG';
  if (kind === 'document') return 'DOC';
  return 'IMG';
}

function MediaDeleteButton({ label, busy, onClick }) {
  return (
    <button
      type="button"
      className="bld-media-delete"
      aria-label={label}
      title={label}
      disabled={busy}
      onClick={onClick}
    >
      {busy ? (
        <span aria-hidden>…</span>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

function getMediaModalPortalRoot() {
  if (typeof document === 'undefined') return null;
  return document.querySelector('.bld-builder-root') || document.body;
}

function UploadQueue({ projectId, folder, onUploaded, onUploadedItem }) {
  const [jobs, setJobs] = useState([]);
  const inputRef = useRef(null);

  const addFiles = (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setJobs((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file: f,
        status: 'queued',
        progress: 0,
        error: null,
      })),
    ]);
  };

  const startUpload = async (jobId) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'uploading', error: null, progress: 0 } : j)));
    const job = jobs.find((j) => j.id === jobId);
    if (!job?.file) return;

    await new Promise((resolve) => setTimeout(resolve, 0));

    const fd = new FormData();
    fd.append('file', job.file);
    if (folder) fd.append('folder', folder);

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/projects/${projectId}/media`);
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, progress: pct } : j)));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let item = null;
          try {
            const body = JSON.parse(xhr.responseText || '{}');
            item = body?.item || body?.data?.item || null;
          } catch {
            item = null;
          }
          resolve(item);
          return;
        }
        reject(new Error('Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(fd);
    })
      .then((createdItem) => {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'done', progress: 100 } : j)));
        if (createdItem?.publicUrl) onUploadedItem?.(createdItem);
        onUploaded?.();
      })
      .catch((error) => {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'failed', error: error?.message || 'Upload failed' } : j)));
      });
  };

  useEffect(() => {
    // Auto-start queued uploads (max 2 in parallel).
    const uploading = jobs.filter((j) => j.status === 'uploading').length;
    if (uploading >= 2) return;
    const next = jobs.find((j) => j.status === 'queued');
    if (!next) return;
    startUpload(next.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  return (
    <div className="bld-media-upload">
      <div className="bld-media-upload__head">
        <div className="bld-media-upload__title">Upload</div>
        <div className="bld-media-upload__actions">
          <input
            ref={inputRef}
            type="file"
            className="bld-media-upload__file"
            multiple
            accept="image/*,video/*,image/svg+xml,application/pdf"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      <div
        className="bld-media-upload__drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
      >
        Drag & drop files here, or click to choose.
      </div>
      {jobs.length ? (
        <div className="bld-media-upload__queue" aria-label="Upload queue">
          {jobs.slice(0, 8).map((j) => (
            <div key={j.id} className={`bld-media-upload__job is-${j.status}`}>
              <div className="bld-media-upload__name" title={j.file?.name}>
                {j.file?.name || 'File'}
              </div>
              <div className="bld-media-upload__meta">
                {humanBytes(j.file?.size)} · {j.status}
              </div>
              <div className="bld-media-upload__bar">
                <span style={{ width: `${j.progress || 0}%` }} />
              </div>
              {j.status === 'failed' ? (
                <button type="button" className="bld-chip" onClick={() => startUpload(j.id)}>
                  Retry
                </button>
              ) : null}
            </div>
          ))}
          {jobs.length > 8 ? <div className="bld-media-upload__more">+{jobs.length - 8} more…</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function MediaLibraryModal({
  open,
  projectId,
  initialFolder = '',
  mode = 'pick',
  allowedKinds = null,
  autoPickOnUpload = false,
  pickLabel = 'Use selected',
  onClose,
  onPick,
}) {
  const [view, setView] = useState('grid');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [folder, setFolder] = useState(initialFolder || '');
  const [recentOnly, setRecentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 48 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const parentRef = useRef(null);

  const deleteMediaItem = async (item) => {
    if (!projectId || !item?.id) return;
    const name = item.originalName || 'this file';
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${name}" from the media library? This cannot be undone.`)) {
      return;
    }
    setDeletingId(item.id);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/media/${item.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Delete failed');
      if (selected?.id === item.id) setSelected(null);
      await fetchPage();
    } catch (e) {
      setError(e?.message || 'Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchPage = async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (kind) params.set('kind', kind);
      if (folder) params.set('folder', folder);
      if (!folder && folder !== null && folder !== undefined && folder === '') params.delete('folder');
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('pageSize', '48');
      if (recentOnly) params.set('recent', '1');
      const res = await fetchJson(`/api/projects/${projectId}/media?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e?.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setFolder(initialFolder || '');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFolder]);

  useEffect(() => {
    if (!open) return;
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, q, kind, sort, folder, page, recentOnly, projectId]);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
  }, [open, view, q, kind, sort, folder, page, recentOnly]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.classList.add('bld-media-modal-open');
    root.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      root.classList.remove('bld-media-modal-open');
      root.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const items = useMemo(() => {
    const raw = Array.isArray(data?.items) ? data.items : [];
    if (!allowedKinds || !Array.isArray(allowedKinds) || !allowedKinds.length) return raw;
    const set = new Set(allowedKinds.map(String));
    return raw.filter((it) => set.has(String(it.kind)));
  }, [data, allowedKinds]);

  const rowVirtualizer = useVirtualizer({
    count: view === 'list' ? items.length : Math.ceil(items.length / MEDIA_GRID_COLS) || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (view === 'list' ? 68 : 248),
    overscan: 6,
  });

  const pick = () => {
    if (!selected) return;
    onPick?.(selected);
  };

  if (!open) return null;

  const modalTree = (
    <div className="bld-media-modal__backdrop" role="presentation" onClick={onClose}>
      <div className="bld-media-modal" role="dialog" aria-modal="true" aria-label="Media library" onClick={(e) => e.stopPropagation()}>
        <div className="bld-media-modal__head">
          <div className="bld-media-modal__title">Media Library</div>
          <button type="button" className="bld-media-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="bld-media-modal__toolbar">
          <input className="bld-media-modal__search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="bld-media-modal__select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="svg">SVG</option>
            <option value="document">Documents</option>
          </select>
          <select className="bld-media-modal__select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created_desc">Newest</option>
            <option value="created_asc">Oldest</option>
            <option value="name_asc">Name A→Z</option>
            <option value="size_desc">Largest</option>
            <option value="size_asc">Smallest</option>
          </select>
          <button type="button" className={`bld-chip ${view === 'grid' ? 'is-active' : ''}`} onClick={() => setView('grid')}>
            Grid
          </button>
          <button type="button" className={`bld-chip ${view === 'list' ? 'is-active' : ''}`} onClick={() => setView('list')}>
            List
          </button>
          <label className="bld-media-modal__toggle">
            <input type="checkbox" checked={recentOnly} onChange={(e) => setRecentOnly(e.target.checked)} />
            <span>Recent</span>
          </label>
        </div>

        <div className="bld-media-modal__body">
          <div className="bld-media-modal__left">
            <div className="bld-media-modal__sectionTitle">Folders</div>
            <div className="bld-media-folders">
              <button type="button" className={`bld-media-folder ${folder ? '' : 'is-active'}`} onClick={() => { setFolder(''); setPage(1); }}>
                All media
              </button>
              <button type="button" className={`bld-media-folder ${folder === 'Recent' ? 'is-active' : ''}`} onClick={() => { setFolder('Recent'); setPage(1); }}>
                Recent uploads
              </button>
              <button
                type="button"
                className={`bld-media-folder ${folder === 'brand-logos' ? 'is-active' : ''}`}
                onClick={() => {
                  setFolder('brand-logos');
                  setPage(1);
                }}
              >
                Brand logos
              </button>
              <button type="button" className={`bld-media-folder ${folder === 'Brand' ? 'is-active' : ''}`} onClick={() => { setFolder('Brand'); setPage(1); }}>
                Brand
              </button>
              <button type="button" className={`bld-media-folder ${folder === 'Docs' ? 'is-active' : ''}`} onClick={() => { setFolder('Docs'); setPage(1); }}>
                Docs
              </button>
            </div>

            <UploadQueue
              projectId={projectId}
              folder={folder || ''}
              onUploaded={() => fetchPage()}
              onUploadedItem={(item) => {
                if (!autoPickOnUpload || !item?.publicUrl) return;
                onPick?.(item);
                onClose?.();
              }}
            />
          </div>

          <div className="bld-media-modal__main">
            {error ? <div className="bld-media-modal__error">{error}</div> : null}
            <div ref={parentRef} className="bld-media-modal__scroller">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const idx = virtualRow.index;
                  const top = virtualRow.start;
                  if (view === 'list') {
                    const it = items[idx];
                    if (!it) return null;
                    const isSel = selected?.id === it.id;
                    return (
                      <div
                        key={it.id}
                        className={`bld-media-row ${isSel ? 'is-selected' : ''}`}
                        style={{ position: 'absolute', top, left: 0, right: 0, height: virtualRow.size }}
                        onClick={() => setSelected(it)}
                        onDoubleClick={() => {
                          setSelected(it);
                          if (mode === 'pick') pick();
                        }}
                      >
                        <div className="bld-media-row__thumb" aria-hidden>
                          {it.thumbUrl ? <img src={it.thumbUrl} alt="" loading="lazy" /> : <span>{kindIcon(it.kind)}</span>}
                        </div>
                        <div className="bld-media-row__meta">
                          <div className="bld-media-row__name" title={it.originalName}>{it.originalName}</div>
                          <div className="bld-media-row__sub">
                            {it.kind} · {it.mimeType} · {humanBytes(it.bytes)}
                          </div>
                        </div>
                        <MediaDeleteButton
                          label={`Delete ${it.originalName}`}
                          busy={deletingId === it.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMediaItem(it);
                          }}
                        />
                      </div>
                    );
                  }

                  const start = idx * MEDIA_GRID_COLS;
                  const rowItems = items.slice(start, start + MEDIA_GRID_COLS);
                  return (
                    <div
                      key={virtualRow.key}
                      className="bld-media-gridRow"
                      style={{ position: 'absolute', top, left: 0, right: 0, height: virtualRow.size }}
                    >
                      {rowItems.map((it) => {
                        const isSel = selected?.id === it.id;
                        return (
                          <div
                            key={it.id}
                            className={`bld-media-card ${isSel ? 'is-selected' : ''}`}
                            onClick={() => setSelected(it)}
                            onDoubleClick={() => {
                              setSelected(it);
                              if (mode === 'pick') pick();
                            }}
                            title={it.originalName}
                          >
                            <div className="bld-media-card__thumb" aria-hidden>
                              {it.thumbUrl ? (
                                <img src={it.thumbUrl || it.publicUrl} alt="" loading="lazy" />
                              ) : (
                                <span>{kindIcon(it.kind)}</span>
                              )}
                              <MediaDeleteButton
                                label={`Delete ${it.originalName}`}
                                busy={deletingId === it.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMediaItem(it);
                                }}
                              />
                            </div>
                            <div className="bld-media-card__name">{it.originalName}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bld-media-modal__footer">
              <div className="bld-media-modal__pager">
                <button type="button" className="bld-chip" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                  Prev
                </button>
                <span className="bld-media-modal__page">
                  Page {data?.page || page} · {data?.total || 0} items
                </span>
                <button
                  type="button"
                  className="bld-chip"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading || (data?.page || page) * (data?.pageSize || 48) >= (data?.total || 0)}
                >
                  Next
                </button>
              </div>
              <div className="bld-media-modal__actions">
                {selected ? (
                  <button
                    type="button"
                    className="bld-btn bld-btn--danger"
                    disabled={Boolean(deletingId)}
                    onClick={() => deleteMediaItem(selected)}
                  >
                    Delete selected
                  </button>
                ) : null}
                <button type="button" className="bld-btn" onClick={onClose}>
                  Close
                </button>
                {mode === 'pick' ? (
                  <button type="button" className="bld-btn bld-btn--primary" onClick={pick} disabled={!selected}>
                    {pickLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const portalRoot = getMediaModalPortalRoot();
  if (!portalRoot) return null;
  return createPortal(modalTree, portalRoot);
}

