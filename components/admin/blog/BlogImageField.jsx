'use client';

import { useRef, useState } from 'react';
import { normalizeMediaItemForBuilder, postProjectMediaUpload } from '@/lib/media/projectMediaApi';

function resolvePreviewSrc(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return raw;
  return raw;
}

/**
 * Featured / social / OG image field: URL + Upload + live image preview.
 */
export default function BlogImageField({
  projectId,
  label,
  value,
  onChange,
  hint = 'Paste a URL or upload from your device.',
  showUpload = true,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [imgBroken, setImgBroken] = useState(false);
  const previewSrc = resolvePreviewSrc(value);

  async function onUpload(fileList) {
    const file = fileList?.[0];
    if (!file || !projectId) return;
    setBusy(true);
    setError('');
    setImgBroken(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await postProjectMediaUpload(projectId, fd);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Upload failed');
      }
      const item = normalizeMediaItemForBuilder(data.item || data.media || data);
      const url = item?.publicUrl || item?.url || '';
      if (!url) throw new Error('Upload succeeded but no URL was returned');
      onChange(url);
    } catch (e) {
      setError(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="proj-blog__image-field">
      <label className="proj-blog__field">
        <span>{label}</span>
        <div className="proj-blog__image-row">
          <input
            value={value || ''}
            onChange={(e) => {
              setImgBroken(false);
              onChange(e.target.value);
            }}
            placeholder="https://… or /uploads/…"
          />
          {showUpload ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                hidden
                onChange={(e) => onUpload(e.target.files)}
              />
              <button
                type="button"
                className="proj-blog__upload-btn"
                disabled={busy || !projectId}
                onClick={() => inputRef.current?.click()}
              >
                {busy ? 'Uploading…' : 'Upload'}
              </button>
            </>
          ) : null}
        </div>
        <small className="proj-blog__hint">{hint}</small>
        {error ? <small className="proj-blog__field-warn">{error}</small> : null}
      </label>

      {previewSrc ? (
        <div className="proj-blog__image-preview-card">
          {imgBroken ? (
            <div className="proj-blog__image-preview-fallback">Image could not load — check the URL</div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="proj-blog__image-preview-img"
              src={previewSrc}
              alt={`${label || 'Image'} preview`}
              onError={() => setImgBroken(true)}
              onLoad={() => setImgBroken(false)}
            />
          )}
          <div className="proj-blog__image-preview-actions">
            <a href={previewSrc} target="_blank" rel="noreferrer">
              Open image
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
