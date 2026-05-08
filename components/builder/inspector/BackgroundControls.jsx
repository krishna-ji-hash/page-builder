'use client';

import { useMemo, useState } from 'react';
import MediaLibraryModal from '@/components/builder/media/MediaLibraryModal';

function previewStyle(url) {
  if (!url) return {};
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export default function BackgroundControls({ form, onUpdate, projectId }) {
  const [open, setOpen] = useState(false);
  const canUseMedia = useMemo(() => Number.isInteger(Number(projectId)) && Number(projectId) > 0, [projectId]);

  const bgImageUrl = String(form.bgImageUrl || '');
  const bgImageAlt = String(form.bgImageAlt || '');
  const bgImageTitle = String(form.bgImageTitle || '');

  return (
    <div className="bld-control-stack">
      <div className="bld-field">
        <label className="bld-label">Background Color</label>
        <input
          type="color"
          className="bld-input"
          value={form.bgColor || '#ffffff'}
          onChange={(e) => onUpdate('bgColor', e.target.value)}
        />
      </div>

      <div className="bld-field">
        <label className="bld-label">Background Image</label>
        <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'center' }}>
          <input
            className="bld-input"
            value={bgImageUrl}
            onChange={(e) => onUpdate('bgImageUrl', e.target.value)}
            placeholder="https://…"
          />
          <button type="button" className="bld-chip" disabled={!canUseMedia} onClick={() => setOpen(true)}>
            Choose
          </button>
          <button
            type="button"
            className="bld-chip bld-chip--danger"
            disabled={!bgImageUrl}
            onClick={() => {
              onUpdate('bgImageUrl', '');
              onUpdate('bgImageAlt', '');
              onUpdate('bgImageTitle', '');
            }}
          >
            Clear
          </button>
        </div>
        <p className="bld-field-note">Manual URL stays supported. Media Library enforces image-only for backgrounds.</p>
      </div>

      {bgImageUrl ? (
        <div className="bld-field">
          <label className="bld-label">Preview</label>
          <div
            className="bld-media-inlinePreview"
            style={previewStyle(bgImageUrl)}
            aria-label="Background image preview"
          />
        </div>
      ) : null}

      {bgImageUrl ? (
        <>
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
          // Safety: only allow images/SVG for backgrounds.
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

