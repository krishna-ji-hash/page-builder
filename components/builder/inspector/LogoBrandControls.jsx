'use client';

import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';
import { brandLogoDisplayUrls, normalizeBrandLogoProps } from '@/lib/headerLogo';

function LogoUrlField({
  id,
  label,
  hint,
  value,
  previewUrl,
  previewBg = '#f1f5f9',
  canUseMedia,
  mediaDisabledHint = '',
  onUrlChange,
  onClear,
  onOpenMedia,
  onUpload,
}) {
  return (
    <div className="bld-field">
      <label className="bld-label" htmlFor={id}>
        {label}
      </label>
      {hint ? <p className="bld-field-note" style={{ marginTop: 0 }}>{hint}</p> : null}
      {!canUseMedia && mediaDisabledHint ? (
        <p className="bld-field-note">{mediaDisabledHint}</p>
      ) : null}
      <input id={id} className="bld-input" value={value || ''} onChange={(e) => onUrlChange(e.target.value)} />
      <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="bld-chip"
          disabled={!canUseMedia}
          title={canUseMedia ? 'Pick from Media Library' : mediaDisabledHint || 'Media Library unavailable'}
          onClick={onOpenMedia}
        >
          Media Library
        </button>
        <label className="bld-chip" style={{ cursor: 'pointer', textAlign: 'center', margin: 0 }}>
          Upload
          <input type="file" accept="image/*" className="bld-sr-only" onChange={onUpload} />
        </label>
      </div>
      {previewUrl ? (
        <>
          <div
            className="bld-media-inlinePreview bld-brand-logo-preview"
            style={{
              marginTop: 8,
              backgroundColor: previewBg,
              backgroundImage: `url("${previewUrl}")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <button type="button" className="bld-chip bld-chip--danger" onClick={onClear}>
              Remove
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function LogoBrandControls({
  form,
  onChange,
  canUseMedia,
  mediaDisabledHint = '',
  onOpenMedia,
  onLogoFileUpload,
  logoMediaError = '',
}) {
  const normalized = normalizeBrandLogoProps({
    lightLogoUrl: form.lightLogoUrl,
    darkLogoUrl: form.darkLogoUrl,
    src: form.src,
    meta: { logoTheme: form.logoTheme },
  });
  const { light, dark, useDual } = brandLogoDisplayUrls(normalized);

  return (
    <>
      {logoMediaError ? (
        <p className="bld-field-error" role="alert">
          {logoMediaError}
        </p>
      ) : null}
      <div className="bld-field">
        <label className="bld-label">Both logos preview</label>
        <p className="bld-field-note">
          Light site preset shows the light logo; dark site preset shows the dark logo. Toggle site theme under
          Project / Brand to check both on the canvas.
        </p>
        <div className="bld-brand-logo-dual-preview">
          <div className="bld-brand-logo-dual-preview__cell" data-preview-tone="light">
            <span className="bld-brand-logo-dual-preview__label">Light site</span>
            <div
              className="bld-brand-logo-dual-preview__frame"
              style={light ? { backgroundImage: `url("${light}")` } : undefined}
            >
              {!light ? <span className="bld-brand-logo-dual-preview__empty">No light logo</span> : null}
            </div>
          </div>
          <div className="bld-brand-logo-dual-preview__cell" data-preview-tone="dark">
            <span className="bld-brand-logo-dual-preview__label">Dark site</span>
            <div
              className="bld-brand-logo-dual-preview__frame bld-brand-logo-dual-preview__frame--dark"
              style={dark ? { backgroundImage: `url("${dark}")` } : undefined}
            >
              {!dark ? <span className="bld-brand-logo-dual-preview__empty">No dark logo</span> : null}
            </div>
          </div>
        </div>
        {useDual ? (
          <p className="bld-field-note">Both variants are set — the canvas swaps them when you change the site theme.</p>
        ) : null}
      </div>
      <LogoUrlField
        id="brand-logo-light"
        label="Light site logo"
        hint="Shown when the site theme is Light (usually a dark/colored mark on a light header)."
        value={form.lightLogoUrl || ''}
        previewUrl={form.lightLogoUrl || ''}
        previewBg="#f8fafc"
        canUseMedia={canUseMedia}
        mediaDisabledHint={mediaDisabledHint}
        onUrlChange={(v) => onChange('lightLogoUrl', v)}
        onClear={() => onChange('lightLogoUrl', '')}
        onOpenMedia={() => onOpenMedia('logoLight')}
        onUpload={(e) => onLogoFileUpload('lightLogoUrl', e)}
      />
      <LogoUrlField
        id="brand-logo-dark"
        label="Dark site logo"
        hint="Media Library: upload, then file is applied automatically — or pick an image and click Use as dark logo."
        value={form.darkLogoUrl || ''}
        previewUrl={form.darkLogoUrl || ''}
        previewBg="#0f172a"
        canUseMedia={canUseMedia}
        mediaDisabledHint={mediaDisabledHint}
        onUrlChange={(v) => onChange('darkLogoUrl', v)}
        onClear={() => onChange('darkLogoUrl', '')}
        onOpenMedia={() => onOpenMedia('logoDark')}
        onUpload={(e) => onLogoFileUpload('darkLogoUrl', e)}
      />
      <div className="bld-field">
        <label className="bld-label" htmlFor="brand-logo-theme">
          Logo theme mode
        </label>
        <select
          id="brand-logo-theme"
          className="bld-input"
          value={form.logoTheme || 'auto'}
          onChange={(e) => onChange('logoTheme', e.target.value)}
        >
          <option value="auto">Auto — follow site light / dark preset (header)</option>
          <option value="site">Always follow site preset</option>
          <option value="light">Always light-site logo</option>
          <option value="dark">Always dark-site logo</option>
        </select>
        <p className="bld-field-note">
          Auto on a header logo switches with Project → Light / Dark. Use “match header background” only if the header
          bar color differs from the site theme.
        </p>
      </div>
      <div className="bld-field">
        <label className="bld-label" htmlFor="brand-logo-alt">
          Alt text
        </label>
        <input
          id="brand-logo-alt"
          className="bld-input"
          value={form.logoAlt || ''}
          onChange={(e) => onChange('logoAlt', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label" htmlFor="brand-logo-link">
          Logo link
        </label>
        <input
          id="brand-logo-link"
          className="bld-input"
          value={form.logoLink || ''}
          onChange={(e) => onChange('logoLink', e.target.value)}
          placeholder="/"
        />
      </div>
      <div className="bld-field-grid">
        <InspectorNumField
          id="brand-logo-w"
          label="Width (px)"
          min={48}
          max={400}
          value={form.logoWidth ?? 160}
          onChange={inspectorNumStringChange(onChange, 'logoWidth')}
        />
        <div className="bld-field">
          <label className="bld-label" htmlFor="brand-logo-h">
            Height
          </label>
          <input
            id="brand-logo-h"
            className="bld-input"
            value={form.logoHeight === 'auto' || form.logoHeight == null ? 'auto' : String(form.logoHeight)}
            onChange={(e) => onChange('logoHeight', e.target.value)}
            placeholder="auto"
          />
        </div>
      </div>
    </>
  );
}
