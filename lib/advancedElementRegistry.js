/**
 * Additional widgets for the "Advanced elements" sidebar section.
 * Existing ELEMENT_CARDS in BuilderSidebar are unchanged; these are appended only.
 */
import { BATCH2_EXTRA_CARDS, BATCH2_WEBSITE_WIDGETS } from '@/lib/advancedElementRegistryBatch2.js';

const stackOnly = ['stack'];

export const EXTRA_ADVANCED_ELEMENT_CARDS = [
  { id: 'icon', label: 'Icon', icon: '◇', supported: true },
  { id: 'icon_box', label: 'Icon Box', icon: '▣', supported: true },
  { id: 'content_card', label: 'Card', icon: '▢', supported: true },
  { id: 'spacer', label: 'Spacer', icon: '↕', supported: true },
  { id: 'accordion', label: 'Accordion', icon: 'ACC', supported: true },
  { id: 'modal', label: 'Modal', icon: 'M', supported: true },
  { id: 'video_embed', label: 'Video Embed', icon: '▶', supported: true },
  { id: 'map_embed', label: 'Map Embed', icon: '⌖', supported: true },
  { id: 'social_icons', label: 'Social Icons', icon: '◎', supported: true },
  ...BATCH2_EXTRA_CARDS,
];

const desktop = (patch) => ({ desktop: { ...patch } });

const DEFAULT_SOCIAL_LINKS = [
  { id: 'social-1', label: 'LinkedIn', href: 'https://linkedin.com', icon: 'in' },
  { id: 'social-2', label: 'Twitter', href: 'https://twitter.com', icon: 'x' },
  { id: 'social-3', label: 'Instagram', href: 'https://instagram.com', icon: 'ig' },
];

/** @type {Record<string, object>} */
export const ADVANCED_WEBSITE_WIDGETS = {
  icon: {
    type: 'icon',
    label: 'Icon',
    allowedParents: stackOnly,
    defaultProps: { symbol: '★', ariaLabel: 'Icon', sizePx: 40, color: '#4f46e5' },
    defaultStyle_json: desktop({
      layout: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
      typography: { fontSize: '40px', lineHeight: '1', textAlign: 'center' },
      colors: { textColor: '#4f46e5' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  icon_box: {
    type: 'icon_box',
    label: 'Icon Box',
    allowedParents: stackOnly,
    defaultProps: {
      symbol: '★',
      title: 'Fast delivery',
      text: 'Ship to 19,000+ pincodes with one dashboard.',
      align: 'center',
    },
    defaultStyle_json: desktop({
      layout: { flexDirection: 'column', gap: 10, alignItems: 'center' },
      spacing: { padding: '20px 18px' },
      border: { radius: '14px', width: '1px', color: 'rgba(15,23,42,0.08)' },
      background: { backgroundColor: '#f8fafc' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  content_card: {
    type: 'content_card',
    label: 'Card',
    allowedParents: stackOnly,
    defaultProps: {
      title: 'Card title',
      body: 'Short description for this card. Edit in the inspector.',
      imageSrc: '/builder-placeholder.svg',
      imageAlt: 'Card image',
      buttonText: 'Learn more',
      buttonHref: '#',
      showImage: true,
      showButton: true,
    },
    defaultStyle_json: desktop({
      layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch', width: '100%' },
      border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.08)' },
      background: { backgroundColor: '#ffffff' },
      effects: { boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    allowedParents: stackOnly,
    defaultProps: { heightPx: 48 },
    defaultStyle_json: desktop({
      layout: { display: 'block', flexShrink: 0 },
      size: { width: '100%', height: '48px' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  modal: {
    type: 'modal',
    label: 'Modal',
    allowedParents: stackOnly,
    defaultProps: {
      triggerLabel: 'Open modal',
      title: 'Modal title',
      body: '',
      previewOpen: true,
      showTitle: true,
      showClose: true,
      closeOnBackdrop: true,
      dialogWidthPx: 560,
      dialogMaxWidthPx: 720,
      dialogMinHeightPx: 160,
      dialogMaxHeightPx: 560,
    },
    defaultStyle_json: desktop({ layout: { width: '100%' } }),
    supportsData: false,
    supportsActions: false,
  },
  video_embed: {
    type: 'video_embed',
    label: 'Video Embed',
    allowedParents: stackOnly,
    defaultProps: {
      embedUrl: '',
      title: 'Product demo',
      aspectRatio: '16 / 9',
    },
    defaultStyle_json: desktop({
      layout: { width: '100%' },
      border: { radius: '14px', width: '1px', color: 'rgba(15,23,42,0.1)' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  map_embed: {
    type: 'map_embed',
    label: 'Map Embed',
    allowedParents: stackOnly,
    defaultProps: {
      embedUrl: '',
      address: 'Tower B2, Spaze-I-Tech Park, Sector 49, Gurugram',
      heightPx: 320,
    },
    defaultStyle_json: desktop({
      layout: { width: '100%' },
      border: { radius: '14px', width: '1px', color: 'rgba(15,23,42,0.1)' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  social_icons: {
    type: 'social_icons',
    label: 'Social Icons',
    allowedParents: stackOnly,
    defaultProps: {
      links: DEFAULT_SOCIAL_LINKS,
      sizePx: 40,
      gapPx: 12,
      variant: 'filled',
    },
    defaultStyle_json: desktop({
      layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
    }),
    supportsData: false,
    supportsActions: false,
  },
  ...BATCH2_WEBSITE_WIDGETS,
};

export const ADVANCED_BLOCK_NODE_TYPES = Object.keys(ADVANCED_WEBSITE_WIDGETS);
