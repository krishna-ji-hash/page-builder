'use client';

import { useMemo, useRef, useState } from 'react';
import MediaLibraryModal from '@/components/builder/media/MediaLibraryModal';

function bgImageCssUrl(url) {
  if (!url) return undefined;
  const safe = String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `url("${safe}")`;
}

/** True when the stored value should paint as fully transparent in CSS. */
function isTransparentBackground(color) {
  if (color == null || color === '') return false;
  const s = String(color).trim().toLowerCase().replace(/\s/g, '');
  if (s === 'transparent') return true;
  if (s === 'rgba(0,0,0,0)' || s === 'hsla(0,0%,0%,0)') return true;
  const m = /^#([0-9a-f]{8})$/i.exec(s);
  if (m && m[1].slice(6, 8).toLowerCase() === '00') return true;
  return false;
}

/** `#rrggbb` only — native color input rejects `transparent`. */
function hex6ForColorInput(color) {
  const s = String(color || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    const h = s.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return '#94a3b8';
}

export default function BackgroundControls({ form, onUpdate, projectId, selectedNode = null }) {
  const [open, setOpen] = useState(false);
  const [showUrlAdvanced, setShowUrlAdvanced] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const canUseMedia = useMemo(() => Number.isInteger(Number(projectId)) && Number(projectId) > 0, [projectId]);

  const bgImageUrl = String(form.bgImageUrl || '');
  const bgImageAlt = String(form.bgImageAlt || '');
  const bgImageTitle = String(form.bgImageTitle || '');
  const bgSize = String(form.bgSize || 'cover');
  const bgPosition = String(form.bgPosition || 'center center');
  const bgRepeat = String(form.bgRepeat || 'no-repeat');
  const bgTransparent = isTransparentBackground(form.bgColor);

  const handleFilePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (src) {
        onUpdate('bgImageUrl', src);
        if (!String(form.bgImageAlt || '').trim()) {
          onUpdate('bgImageAlt', file.name.replace(/\.[^.]+$/, ''));
        }
      }
      setIsReadingFile(false);
      event.target.value = '';
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    onUpdate('bgImageUrl', '');
    onUpdate('bgImageAlt', '');
    onUpdate('bgImageTitle', '');
  };

  return (
    <div className="bld-control-stack">
      {selectedNode?.nodeType === 'row' ? (
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          <strong>Section background</strong> — full row uses this color or image (builder and live).
        </p>
      ) : null}
      <div className="bld-field">
        <label className="bld-label">Background Color</label>
        <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            className="bld-input"
            aria-label="Solid background color"
            value={hex6ForColorInput(form.bgColor)}
            onChange={(e) => onUpdate('bgColor', e.target.value)}
          />
          <button
            type="button"
            className="bld-chip"
            aria-pressed={bgTransparent}
            onClick={() => onUpdate('bgColor', 'transparent')}
            title="No fill — parent or page background shows through"
          >
            Transparent
          </button>
        </div>
        {bgTransparent ? (
          <p className="bld-field-note" style={{ marginTop: 6, marginBottom: 0 }}>
            Background is transparent. Use the color swatch to pick a solid fill again.
          </p>
        ) : null}
      </div>

      <div className="bld-field">
        <label className="bld-label">Background image</label>
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Upload from device or choose from media — URL field available below.
        </p>
        <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="bld-chip"
            disabled={isReadingFile}
            onClick={() => fileInputRef.current?.click()}
          >
            {isReadingFile ? 'Reading…' : 'Upload image'}
          </button>
          <button type="button" className="bld-chip" disabled={!canUseMedia || isReadingFile} onClick={() => setOpen(true)}>
            Choose from Media
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          aria-hidden
          onChange={handleFilePick}
        />
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            className="bld-chip bld-chip--danger"
            disabled={!bgImageUrl}
            onClick={clearImage}
          >
            Remove background image
          </button>
        </div>
      </div>

      <div className="bld-field">
        <button type="button" className="bld-chip" onClick={() => setShowUrlAdvanced((v) => !v)}>
          {showUrlAdvanced ? '▾ Hide' : '▸'} Paste image URL (advanced)
        </button>
        {showUrlAdvanced ? (
          <div style={{ marginTop: 8 }}>
            <input
              className="bld-input"
              value={bgImageUrl}
              onChange={(e) => onUpdate('bgImageUrl', e.target.value)}
              placeholder="https://… or data URL"
            />
            <p className="bld-field-note">Advanced only — prefer upload or Media Library.</p>
          </div>
        ) : null}
      </div>

      {bgImageUrl ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Background size</label>
            <select className="bld-input" value={bgSize} onChange={(e) => onUpdate('bgSize', e.target.value)}>
              <option value="cover">cover</option>
              <option value="contain">contain</option>
              <option value="auto">auto</option>
              <option value="100% 100%">100% 100% (stretch)</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Background position</label>
            <select className="bld-input" value={bgPosition} onChange={(e) => onUpdate('bgPosition', e.target.value)}>
              <option value="center center">center</option>
              <option value="top center">top</option>
              <option value="bottom center">bottom</option>
              <option value="center left">left</option>
              <option value="center right">right</option>
              <option value="top left">top left</option>
              <option value="top right">top right</option>
              <option value="bottom left">bottom left</option>
              <option value="bottom right">bottom right</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Background repeat</label>
            <select className="bld-input" value={bgRepeat} onChange={(e) => onUpdate('bgRepeat', e.target.value)}>
              <option value="no-repeat">no-repeat</option>
              <option value="repeat">repeat</option>
              <option value="repeat-x">repeat-x</option>
              <option value="repeat-y">repeat-y</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Preview</label>
            <div
              className="bld-media-inlinePreview"
              style={{
                backgroundColor: bgTransparent ? 'transparent' : form.bgColor || '#f1f5f9',
                backgroundImage: [
                  bgTransparent ? 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%)' : null,
                  bgImageCssUrl(bgImageUrl),
                ]
                  .filter(Boolean)
                  .join(', '),
                backgroundSize: bgTransparent ? `12px 12px, ${bgSize}` : bgSize,
                backgroundPosition: bgTransparent ? `0 0, ${bgPosition}` : bgPosition,
                backgroundRepeat: bgTransparent ? `repeat, ${bgRepeat}` : bgRepeat,
              }}
              aria-label="Background image preview"
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Image Title (optional)</label>
            <input className="bld-input" value={bgImageTitle} onChange={(e) => onUpdate('bgImageTitle', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Image Alt (optional)</label>
            <input className="bld-input" value={bgImageAlt} onChange={(e) => onUpdate('bgImageAlt', e.target.value)} />
          </div>
        </>
      ) : null}

      <MediaLibraryModal
        open={open}
        projectId={Number(projectId) || 0}
        allowedKinds={['image', 'svg']}
        onClose={() => setOpen(false)}
        onPick={(item) => {
          const kind = String(item?.kind || '');
          if (kind !== 'image' && kind !== 'svg') return;
          if (!item?.publicUrl) return;
          onUpdate('bgImageUrl', item.publicUrl);
          if (!bgImageAlt.trim() && item.altText) onUpdate('bgImageAlt', item.altText);
          if (!bgImageTitle.trim() && item.title) onUpdate('bgImageTitle', item.title);
          setOpen(false);
        }}
      />
    </div>
  );
}
