/** Map inspector form keys → node props for advanced element types. */
import {
  advancedElementFormFromPropsBatch2,
  advancedElementPatchFromFormKeyBatch2,
} from '@/lib/advancedElementInspectorBatch2.js';
import { normalizeMapEmbedUrlForStorage } from '@/lib/mapEmbedUrl.js';

export function advancedElementFormFromProps(props = {}, pickPending) {
  return {
    iconSymbol: props.symbol ?? '★',
    iconAriaLabel: props.ariaLabel ?? 'Icon',
    iconBoxSymbol: props.symbol ?? '★',
    iconBoxTitle: props.title ?? '',
    iconBoxText: props.text ?? '',
    iconBoxAlign: props.align ?? 'center',
    contentCardTitle: props.title ?? '',
    contentCardBody: props.body ?? '',
    contentCardImageSrc: props.imageSrc ?? '',
    contentCardImageAlt: props.imageAlt ?? '',
    contentCardButtonText: props.buttonText ?? '',
    contentCardButtonHref: props.buttonHref ?? '#',
    spacerHeightPx: Number(props.heightPx) > 0 ? Number(props.heightPx) : 48,
    modalTriggerLabel: props.triggerLabel ?? 'Open modal',
    modalTitle: props.title ?? '',
    modalBody: props.body ?? '',
    modalPreviewOpen: Boolean(props.previewOpen),
    modalShowTitle: props.showTitle !== false,
    modalShowClose: props.showClose !== false,
    modalCloseOnBackdrop: props.closeOnBackdrop !== false,
    modalDialogWidthPx: Number(props.dialogWidthPx) > 0 ? Number(props.dialogWidthPx) : 560,
    modalDialogMaxWidthPx: Number(props.dialogMaxWidthPx) > 0 ? Number(props.dialogMaxWidthPx) : 720,
    modalDialogMinHeightPx: Number(props.dialogMinHeightPx) > 0 ? Number(props.dialogMinHeightPx) : 160,
    modalDialogMaxHeightPx: Number(props.dialogMaxHeightPx) > 0 ? Number(props.dialogMaxHeightPx) : 560,
    videoEmbedUrl: props.embedUrl ?? '',
    videoEmbedTitle: props.title ?? '',
    videoEmbedAspectRatio: props.aspectRatio ?? '16 / 9',
    mapEmbedUrl: props.embedUrl ?? '',
    mapEmbedAddress: props.address ?? '',
    mapEmbedHeightPx: Number(props.heightPx) > 0 ? Number(props.heightPx) : 320,
    socialIconsVariant: props.variant ?? 'filled',
    socialIconsSizePx: Number(props.sizePx) > 0 ? Number(props.sizePx) : 40,
    socialIconsGapPx: Number(props.gapPx) > 0 ? Number(props.gapPx) : 12,
    socialIconsJson: JSON.stringify(Array.isArray(props.links) ? props.links : [], null, 2),
    ...advancedElementFormFromPropsBatch2(props, pickPending),
  };
}

/**
 * @returns {{ patch: object, stylePatch?: object } | null}
 */
export function advancedElementPatchFromFormKey(nodeType, key, value) {
  switch (nodeType) {
    case 'icon':
      if (key === 'iconSymbol') return { patch: { symbol: value } };
      if (key === 'iconAriaLabel') return { patch: { ariaLabel: value } };
      break;
    case 'icon_box':
      if (key === 'iconBoxSymbol') return { patch: { symbol: value } };
      if (key === 'iconBoxTitle') return { patch: { title: value } };
      if (key === 'iconBoxText') return { patch: { text: value } };
      if (key === 'iconBoxAlign') return { patch: { align: value } };
      break;
    case 'content_card':
      if (key === 'contentCardTitle') return { patch: { title: value } };
      if (key === 'contentCardBody') return { patch: { body: value } };
      if (key === 'contentCardImageSrc') return { patch: { imageSrc: value } };
      if (key === 'contentCardImageAlt') return { patch: { imageAlt: value } };
      if (key === 'contentCardButtonText') return { patch: { buttonText: value } };
      if (key === 'contentCardButtonHref') return { patch: { buttonHref: value } };
      break;
    case 'spacer': {
      if (key !== 'spacerHeightPx') break;
      const h = Math.max(4, Math.min(400, Number(value) || 48));
      return { patch: { heightPx: h }, stylePatch: { desktop: { size: { width: '100%', height: `${h}px` } } } };
    }
    case 'modal':
      if (key === 'modalTriggerLabel') return { patch: { triggerLabel: value } };
      if (key === 'modalTitle') return { patch: { title: value } };
      if (key === 'modalBody') return { patch: { body: value } };
      if (key === 'modalPreviewOpen') return { patch: { previewOpen: Boolean(value) } };
      if (key === 'modalShowTitle') return { patch: { showTitle: Boolean(value) } };
      if (key === 'modalShowClose') return { patch: { showClose: Boolean(value) } };
      if (key === 'modalCloseOnBackdrop') return { patch: { closeOnBackdrop: Boolean(value) } };
      if (key === 'modalDialogWidthPx') {
        const w = Math.max(280, Math.min(1200, Number(value) || 560));
        return { patch: { dialogWidthPx: w } };
      }
      if (key === 'modalDialogMaxWidthPx') {
        const w = Math.max(280, Math.min(1200, Number(value) || 720));
        return { patch: { dialogMaxWidthPx: w } };
      }
      if (key === 'modalDialogMinHeightPx') {
        const h = Math.max(80, Math.min(900, Number(value) || 160));
        return { patch: { dialogMinHeightPx: h } };
      }
      if (key === 'modalDialogMaxHeightPx') {
        const h = Math.max(120, Math.min(900, Number(value) || 560));
        return { patch: { dialogMaxHeightPx: h } };
      }
      break;
    case 'video_embed':
      if (key === 'videoEmbedUrl') return { patch: { embedUrl: value } };
      if (key === 'videoEmbedTitle') return { patch: { title: value } };
      if (key === 'videoEmbedAspectRatio') return { patch: { aspectRatio: value } };
      break;
    case 'map_embed': {
      if (key === 'mapEmbedUrl') {
        return { patch: { embedUrl: normalizeMapEmbedUrlForStorage(value) } };
      }
      if (key === 'mapEmbedAddress') return { patch: { address: value } };
      if (key === 'mapEmbedHeightPx') {
        const hp = Math.max(160, Math.min(600, Number(value) || 320));
        return { patch: { heightPx: hp } };
      }
      break;
    }
    case 'social_icons':
      if (key === 'socialIconsVariant') return { patch: { variant: value } };
      if (key === 'socialIconsSizePx') return { patch: { sizePx: Math.max(28, Math.min(64, Number(value) || 40)) } };
      if (key === 'socialIconsGapPx') return { patch: { gapPx: Math.max(4, Math.min(32, Number(value) || 12)) } };
      break;
    default:
      break;
  }
  const batch2 = advancedElementPatchFromFormKeyBatch2(nodeType, key, value);
  if (batch2) return batch2;
  return null;
}

/** Parse JSON inspector fields for advanced elements. Returns null if key is not a JSON field. */
export function tryParseAdvancedElementJson(nodeType, formKey, rawValue) {
  if (nodeType === 'social_icons' && formKey === 'socialIconsJson') {
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) throw new Error('Links JSON must be an array.');
    return { errorKey: 'socialIconsJson', propPatch: { links: parsed }, formKey };
  }
  if (nodeType === 'grid_block' && formKey === 'gridItemsJson') {
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) throw new Error('Grid items JSON must be an array.');
    return { errorKey: 'gridItemsJson', propPatch: { items: parsed }, formKey };
  }
  if (nodeType === 'feature_list' && formKey === 'featureListJson') {
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) throw new Error('Feature list JSON must be an array.');
    return { errorKey: 'featureListJson', propPatch: { items: parsed }, formKey };
  }
  if (nodeType === 'table_pro' && formKey === 'tableProHeadersJson') {
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) throw new Error('Headers JSON must be an array.');
    return { errorKey: 'tableProHeadersJson', propPatch: { headers: parsed }, formKey };
  }
  if (nodeType === 'table_pro' && formKey === 'tableProRowsJson') {
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) throw new Error('Rows JSON must be an array.');
    return { errorKey: 'tableProRowsJson', propPatch: { rows: parsed }, formKey };
  }
  return null;
}
