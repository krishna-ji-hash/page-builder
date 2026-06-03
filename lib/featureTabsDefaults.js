/** Default panels for Dispatch Solutions-style feature tabs (section template + tabs widget). */

const TAB_IMAGE_DEFAULTS = [
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
];

export const DEFAULT_FEATURE_TABS = [
  {
    id: 'delivery-success',
    label: 'Delivery Success System',
    heading: 'Delivery-First RTO Control',
    paragraph:
      'Reduce RTO with structured NDR workflows, smart reattempts, and proactive buyer communication — so more orders convert to successful deliveries instead of costly returns.',
    bullets: [
      'Structured NDR actions',
      '3–5 reattempt workflows',
      'Free NDR calling + follow-ups',
    ],
    imageSrc: TAB_IMAGE_DEFAULTS[0],
    imageAlt: 'Delivery success — support agent and NDR workflow highlights',
  },
  {
    id: 'ai-courier',
    label: 'AI Courier Allocation',
    heading: 'AI Courier Allocation for eCommerce Shipping',
    paragraph:
      "Dispatch Solutions' AI courier selection engine auto-assigns the best courier for every shipment based on lane performance, delivery speed, COD risk, pincode serviceability, and shipping cost — so you get higher delivery success rates with fewer NDR exceptions and lower RTO.",
    bullets: [
      'WhatsApp COD confirmation before dispatch',
      'Checkout address intelligence',
      'Reliable ETA for buyers',
    ],
    imageSrc: TAB_IMAGE_DEFAULTS[1],
    imageAlt: 'AI courier allocation dashboard',
  },
  {
    id: 'enterprise-tech',
    label: 'Best Tech for Enterprise Businesses',
    heading: 'Enterprise-Grade Shipping Operations',
    paragraph:
      'Bulk workflows, standardized ops, performance visibility, and COD controls built for high-volume sellers — manage B2B, B2C, and international shipments from one aggregator dashboard.',
    bullets: [
      'Bulk workflows + standardized ops',
      'Performance + COD visibility',
      'Multi-channel order imports',
    ],
    imageSrc: TAB_IMAGE_DEFAULTS[2],
    imageAlt: 'Enterprise shipping dashboard and operations',
  },
  {
    id: 'trust-support',
    label: 'Trust & Support',
    heading: 'Free Order Verification + Dedicated KAM',
    paragraph:
      'Boost delivery success with free pre-dispatch order verification via WhatsApp, SMS, and email. When something goes wrong, your dedicated Key Account Manager handles escalations, pickup issues, and courier disputes directly.',
    bullets: [
      'Pre-dispatch buyer verification',
      'Dedicated KAM for escalations',
      'No ticket queues or chatbot loops',
    ],
    imageSrc: TAB_IMAGE_DEFAULTS[3],
    imageAlt: 'Dedicated account manager support',
  },
];

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function bulletsFromUnknown(raw) {
  if (Array.isArray(raw)) return raw.map((b) => String(b || '').trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(/\n/)
      .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * @param {unknown} tab
 * @param {number} index
 */
export function normalizeFeatureTab(tab, index = 0) {
  const t = tab && typeof tab === 'object' ? tab : {};
  const id = String(t.id || `tab-${index + 1}`).trim() || `tab-${index + 1}`;
  const fallbackImg = TAB_IMAGE_DEFAULTS[index % TAB_IMAGE_DEFAULTS.length] || '/builder-placeholder.svg';
  const imageSrcRaw = String(t.imageSrc || t.image || '').trim();
  const imageSrc =
    !imageSrcRaw || imageSrcRaw === '/builder-placeholder.svg' ? fallbackImg : imageSrcRaw;
  const heightRaw = Number(t.imageHeightPx);
  return {
    id,
    label: String(t.label || `Tab ${index + 1}`).trim() || `Tab ${index + 1}`,
    heading: String(t.heading || '').trim(),
    paragraph: String(t.paragraph || t.body || '').trim(),
    bullets: bulletsFromUnknown(t.bullets),
    imageSrc,
    imageAlt: String(t.imageAlt || t.label || 'Tab illustration').trim(),
    imageHeightPx: Number.isFinite(heightRaw) && heightRaw > 0 ? Math.min(800, Math.floor(heightRaw)) : null,
  };
}

/**
 * @param {unknown} tabs
 * @returns {ReturnType<typeof normalizeFeatureTab>[]}
 */
export function normalizeFeatureTabs(tabs) {
  if (!Array.isArray(tabs)) return DEFAULT_FEATURE_TABS.map((t, i) => normalizeFeatureTab(t, i));
  const out = tabs
    .filter((t) => t && typeof t === 'object')
    .map((t, index) => normalizeFeatureTab(t, index));
  return out.length ? out : DEFAULT_FEATURE_TABS.map((t, i) => normalizeFeatureTab(t, i));
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 */
export function resolveFeatureTabsProps(props) {
  const p = props && typeof props === 'object' ? props : {};
  const tabs = normalizeFeatureTabs(p.tabs);
  const activeTabId = String(p.activeTabId || tabs[0]?.id || '').trim();
  const validActive = tabs.some((t) => t.id === activeTabId) ? activeTabId : tabs[0]?.id;
  const imageFitRaw = String(p.imageFit || 'cover').trim().toLowerCase();
  const imageFit = imageFitRaw === 'contain' || imageFitRaw === 'fill' ? imageFitRaw : 'cover';
  const heightGlobal = Number(p.imageHeightPx);
  const imageHeightPx =
    Number.isFinite(heightGlobal) && heightGlobal > 0 ? Math.min(800, Math.floor(heightGlobal)) : 360;
  const alignRaw = String(p.tabAlign || 'center').trim().toLowerCase();
  const tabAlign = alignRaw === 'left' || alignRaw === 'stretch' ? alignRaw : 'center';
  return { tabs, activeTabId: validActive, imageFit, imageHeightPx, tabAlign };
}

/**
 * @param {ReturnType<typeof normalizeFeatureTab>[]} tabs
 * @param {number} index
 * @param {Record<string, unknown>} patch
 */
export function patchFeatureTabs(tabs, index, patch) {
  const list = Array.isArray(tabs) ? [...tabs] : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  const merged = { ...(list[index] || {}), ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, 'bullets')) {
    merged.bullets = bulletsFromUnknown(patch.bullets);
  }
  list[index] = normalizeFeatureTab(merged, index);
  return list;
}

/** @param {ReturnType<typeof normalizeFeatureTab>[]} tabs */
export function newFeatureTabFromList(tabs) {
  const list = Array.isArray(tabs) ? tabs : [];
  const n = list.length + 1;
  const base = list[list.length - 1] || DEFAULT_FEATURE_TABS[0];
  const id = `tab-${Date.now().toString(36)}`;
  return normalizeFeatureTab(
    {
      id,
      label: `New tab ${n}`,
      heading: 'New heading',
      paragraph: 'Add your description here.',
      bullets: ['Bullet point'],
      imageSrc: base?.imageSrc || TAB_IMAGE_DEFAULTS[0],
      imageAlt: 'Tab illustration',
    },
    n - 1
  );
}

/** @param {ReturnType<typeof normalizeFeatureTab>[]} tabs */
export function addBulletToActiveTab(tabs, activeTabId) {
  const list = Array.isArray(tabs) ? [...tabs] : [];
  const idx = list.findIndex((t) => t.id === activeTabId);
  if (idx < 0) return list;
  const tab = list[idx];
  const bullets = [...(tab.bullets || []), 'New bullet'];
  return patchFeatureTabs(list, idx, { bullets });
}
