'use client';

import { uploadProjectMediaFile } from '@/lib/media/uploadProjectMedia';

export default function CourierPartnerCardControls({
  imageNode,
  labelNode,
  projectId,
  canUseMedia,
  onChange,
  onOpenMedia,
}) {
  const src = String(imageNode?.props?.src || '').trim();
  const alt = String(imageNode?.props?.alt || '').trim();
  const labelText = String(labelNode?.props?.text || '').trim();

  const uploadFile = async (file) => {
    if (!file?.type?.startsWith('image/')) return;
    if (canUseMedia) {
      try {
        const { publicUrl, altText, title } = await uploadProjectMediaFile(Number(projectId), file, {
          folder: 'images',
        });
        const patch = { src: publicUrl };
        if (!alt) patch.alt = altText || title || String(file.name || '').replace(/\.[^.]+$/, '') || '';
        onChange('courierPartnerImagePatch', patch);
        return;
      } catch {
        /* fall through */
      }
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      const patch = { src: url };
      if (!alt) patch.alt = String(file.name || '').replace(/\.[^.]+$/, '');
      onChange('courierPartnerImagePatch', patch);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <p className="bld-field-note" style={{ marginBottom: 12 }}>
        Edit this partner card&apos;s logo and name. You can also click the label or image on the canvas.
      </p>
      {labelNode ? (
        <div className="bld-field">
          <label className="bld-label">Partner name</label>
          <input
            className="bld-input"
            value={labelText}
            onChange={(e) => onChange('courierPartnerLabelText', e.target.value)}
            placeholder="Courier name"
          />
        </div>
      ) : null}
      {imageNode ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Logo upload</label>
            <input
              type="file"
              accept="image/*"
              className="bld-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
                e.target.value = '';
              }}
            />
          </div>
          {canUseMedia ? (
            <div className="bld-field">
              <label className="bld-label">Media Library</label>
              <button
                type="button"
                className="bld-chip"
                onClick={() => onOpenMedia?.({ target: 'courierPartnerImage', allowedKinds: ['image', 'svg'] })}
              >
                Choose from Media
              </button>
            </div>
          ) : null}
          <div className="bld-field">
            <label className="bld-label">Logo URL</label>
            <input
              className="bld-input"
              value={src}
              onChange={(e) => onChange('courierPartnerImageSrc', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Logo alt text</label>
            <input
              className="bld-input"
              value={alt}
              onChange={(e) => onChange('courierPartnerImageAlt', e.target.value)}
            />
          </div>
          {src ? (
            <div className="bld-field">
              <label className="bld-label">Preview</label>
              <div
                className="bld-media-inlinePreview"
                style={{
                  backgroundImage: `url("${src}")`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  minHeight: 72,
                }}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
