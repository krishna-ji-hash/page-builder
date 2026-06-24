'use client';

import AdvancedElementControlsBatch2 from '@/components/builder/inspector/AdvancedElementControlsBatch2';
import { InspectorNumField, InspectorNumInput, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';
import { ADVANCED_BLOCK_NODE_TYPES } from '@/lib/advancedElementRegistry';

/** Inspector fields for advanced element node types (lib/advancedElementRegistry.js). */

export default function AdvancedElementControls({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  canUseMedia = false,
  onOpenLogoMedia,
  onOpenContentCardMedia,
  onLogoFileUpload,
}) {
  const t = selectedNode?.nodeType;
  if (!t) return null;

  if (t === 'icon') {
    return (
      <>
        <div className="bld-field">
          <label className="bld-label">Symbol / emoji</label>
          <input className="bld-input" value={form.iconSymbol || ''} onChange={(e) => onChange('iconSymbol', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Accessible label</label>
          <input className="bld-input" value={form.iconAriaLabel || ''} onChange={(e) => onChange('iconAriaLabel', e.target.value)} />
        </div>
      </>
    );
  }

  if (t === 'icon_box') {
    return (
      <>
        <div className="bld-field">
          <label className="bld-label">Icon</label>
          <input className="bld-input" value={form.iconBoxSymbol || ''} onChange={(e) => onChange('iconBoxSymbol', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Title</label>
          <input className="bld-input" value={form.iconBoxTitle || ''} onChange={(e) => onChange('iconBoxTitle', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Text</label>
          <textarea className="bld-input bld-textarea" rows={3} value={form.iconBoxText || ''} onChange={(e) => onChange('iconBoxText', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Align</label>
          <select className="bld-input" value={form.iconBoxAlign || 'center'} onChange={(e) => onChange('iconBoxAlign', e.target.value)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </>
    );
  }

  if (t === 'content_card') {
    return (
      <>
        <div className="bld-field">
          <label className="bld-label">Title</label>
          <input className="bld-input" value={form.contentCardTitle || ''} onChange={(e) => onChange('contentCardTitle', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Body</label>
          <textarea className="bld-input bld-textarea" rows={4} value={form.contentCardBody || ''} onChange={(e) => onChange('contentCardBody', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Image URL</label>
          <input className="bld-input" value={form.contentCardImageSrc || ''} onChange={(e) => onChange('contentCardImageSrc', e.target.value)} />
          <button
            type="button"
            className="bld-chip"
            style={{ marginTop: 8 }}
            disabled={!canUseMedia}
            title={canUseMedia ? 'Choose from project media library' : 'Save project first'}
            onClick={() => onOpenContentCardMedia?.()}
          >
            Choose from Media
          </button>
        </div>
        <div className="bld-field">
          <label className="bld-label">Image alt</label>
          <input className="bld-input" value={form.contentCardImageAlt || ''} onChange={(e) => onChange('contentCardImageAlt', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Button label</label>
          <input className="bld-input" value={form.contentCardButtonText || ''} onChange={(e) => onChange('contentCardButtonText', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Button link</label>
          <input className="bld-input" value={form.contentCardButtonHref || ''} onChange={(e) => onChange('contentCardButtonHref', e.target.value)} />
        </div>
      </>
    );
  }

  if (t === 'spacer') {
    return (
      <InspectorNumField
        id="spacer-height"
        label="Height (px)"
        min={4}
        max={400}
        value={form.spacerHeightPx ?? 48}
        onChange={inspectorNumStringChange(onChange, 'spacerHeightPx')}
      />
    );
  }

  if (t === 'modal') {
    return (
      <>
        <p className="bld-sidebar__hint" style={{ marginBottom: 10 }}>
          Open <strong>Layers</strong> → expand this modal → select <strong>Modal content</strong> to add any advanced
          element inside. Quick-add from the sidebar also targets that stack automatically.
        </p>
        <div className="bld-field">
          <label className="bld-label">Trigger label</label>
          <input className="bld-input" value={form.modalTriggerLabel || ''} onChange={(e) => onChange('modalTriggerLabel', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">
            <input type="checkbox" checked={form.modalShowTitle !== false} onChange={(e) => onChange('modalShowTitle', e.target.checked)} />{' '}
            Show title
          </label>
        </div>
        <div className="bld-field">
          <label className="bld-label">Modal title</label>
          <input className="bld-input" value={form.modalTitle || ''} onChange={(e) => onChange('modalTitle', e.target.value)} />
        </div>
        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Dialog width (px)</label>
            <InspectorNumInput min={280} max={1200} value={form.modalDialogWidthPx ?? 560} onChange={inspectorNumStringChange(onChange, 'modalDialogWidthPx')} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Max width (px)</label>
            <InspectorNumInput min={280} max={1200} value={form.modalDialogMaxWidthPx ?? 720} onChange={inspectorNumStringChange(onChange, 'modalDialogMaxWidthPx')} />
          </div>
        </div>
        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Min height (px)</label>
            <InspectorNumInput min={80} max={900} value={form.modalDialogMinHeightPx ?? 160} onChange={inspectorNumStringChange(onChange, 'modalDialogMinHeightPx')} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Max height (px)</label>
            <InspectorNumInput min={120} max={900} value={form.modalDialogMaxHeightPx ?? 560} onChange={inspectorNumStringChange(onChange, 'modalDialogMaxHeightPx')} />
          </div>
        </div>
        <div className="bld-field">
          <label className="bld-label">
            <input type="checkbox" checked={form.modalShowClose !== false} onChange={(e) => onChange('modalShowClose', e.target.checked)} />{' '}
            Show close button
          </label>
        </div>
        <div className="bld-field">
          <label className="bld-label">
            <input type="checkbox" checked={form.modalCloseOnBackdrop !== false} onChange={(e) => onChange('modalCloseOnBackdrop', e.target.checked)} />{' '}
            Close on backdrop click (live site)
          </label>
        </div>
        <div className="bld-field">
          <label className="bld-label">Fallback text (only if modal content stack is empty)</label>
          <textarea className="bld-input bld-textarea" rows={3} value={form.modalBody || ''} onChange={(e) => onChange('modalBody', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">
            <input
              type="checkbox"
              checked={Boolean(form.modalPreviewOpen)}
              onChange={(e) => onChange('modalPreviewOpen', e.target.checked)}
            />{' '}
            Preview open in builder
          </label>
        </div>
      </>
    );
  }

  if (t === 'video_embed') {
    return (
      <>
        <div className="bld-field">
          <label className="bld-label">Embed URL</label>
          <input className="bld-input" value={form.videoEmbedUrl || ''} onChange={(e) => onChange('videoEmbedUrl', e.target.value)} placeholder="YouTube or iframe URL" />
        </div>
        <div className="bld-field">
          <label className="bld-label">Title</label>
          <input className="bld-input" value={form.videoEmbedTitle || ''} onChange={(e) => onChange('videoEmbedTitle', e.target.value)} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Aspect ratio</label>
          <input className="bld-input" value={form.videoEmbedAspectRatio || '16 / 9'} onChange={(e) => onChange('videoEmbedAspectRatio', e.target.value)} />
        </div>
      </>
    );
  }

  if (t === 'map_embed') {
    return (
      <>
        <div className="bld-field">
          <label className="bld-label">Map embed URL</label>
          <input
            className="bld-input"
            value={form.mapEmbedUrl || ''}
            onChange={(e) => onChange('mapEmbedUrl', e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=…"
          />
          <p className="bld-field-note" style={{ marginTop: 6, marginBottom: 0 }}>
            Paste the <strong>embed URL</strong> or the full <strong>&lt;iframe&gt;</strong> code from Google Maps → Share → Embed a map.
          </p>
        </div>
        <div className="bld-field">
          <label className="bld-label">Address label</label>
          <input className="bld-input" value={form.mapEmbedAddress || ''} onChange={(e) => onChange('mapEmbedAddress', e.target.value)} />
        </div>
        <InspectorNumField
          id="map-height"
          label="Height (px)"
          min={160}
          max={600}
          value={form.mapEmbedHeightPx ?? 320}
          onChange={inspectorNumStringChange(onChange, 'mapEmbedHeightPx')}
        />
      </>
    );
  }

  const batch2 = AdvancedElementControlsBatch2({
    selectedNode,
    form,
    onChange,
    jsonErrors,
    canUseMedia,
    onOpenLogoMedia,
    onLogoFileUpload,
  });
  if (batch2) return batch2;

  if (t === 'social_icons') {
    return (
      <>
        <div className="bld-field">
          <label className="bld-label">Variant</label>
          <select className="bld-input" value={form.socialIconsVariant || 'filled'} onChange={(e) => onChange('socialIconsVariant', e.target.value)}>
            <option value="filled">Filled</option>
            <option value="outline">Outline</option>
          </select>
        </div>
        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Icon size (px)</label>
            <InspectorNumInput min={28} max={64} value={form.socialIconsSizePx ?? 40} onChange={inspectorNumStringChange(onChange, 'socialIconsSizePx')} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Gap (px)</label>
            <InspectorNumInput min={4} max={32} value={form.socialIconsGapPx ?? 12} onChange={inspectorNumStringChange(onChange, 'socialIconsGapPx')} />
          </div>
        </div>
        <div className="bld-field">
          <label className="bld-label">Links JSON</label>
          <textarea
            className="bld-input bld-textarea"
            rows={8}
            value={form.socialIconsJson || '[]'}
            onChange={(e) => onChange('socialIconsJson', e.target.value)}
          />
          {jsonErrors.socialIconsJson ? <p className="bld-field-error">{jsonErrors.socialIconsJson}</p> : null}
        </div>
      </>
    );
  }

  return null;
}

export function isAdvancedElementNodeType(nodeType) {
  return ADVANCED_BLOCK_NODE_TYPES.includes(nodeType);
}
