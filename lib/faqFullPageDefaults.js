/** Full FAQ page section — hero, category tabs, accordion grid, support CTA. */

export const FAQ_FULL_PAGE_CATEGORIES = [
  { id: 'all', label: 'All FAQs', icon: 'grid' },
  { id: 'shipping', label: 'Shipping', icon: 'shipping' },
  { id: 'tracking', label: 'Tracking', icon: 'tracking' },
  { id: 'cod', label: 'COD & Wallet', icon: 'wallet' },
  { id: 'courier', label: 'Courier Partners', icon: 'courier' },
  { id: 'integrations', label: 'Integrations', icon: 'integrations' },
  { id: 'billing', label: 'Billing', icon: 'billing' },
  { id: 'support', label: 'Support', icon: 'support' },
];

export const DEFAULT_FAQ_FULL_PAGE_ITEMS = [
  {
    id: 'faq-1',
    category: 'shipping',
    question: 'What is Dispatch Solutions?',
    answer:
      'Dispatch Solutions is a logistics aggregator platform that helps businesses manage shipments, compare courier partners, generate AWB, print labels, track orders and handle delivery operations from one dashboard.',
  },
  {
    id: 'faq-2',
    category: 'tracking',
    question: 'How can I track my shipment?',
    answer:
      'You can track your shipment using AWB or LR number from the tracking page or directly from your Dispatch Solutions dashboard.',
  },
  {
    id: 'faq-3',
    category: 'courier',
    question: 'Can I choose courier partners manually?',
    answer:
      'Yes, you can manually select courier partners or use smart courier recommendation based on price, serviceability, delivery speed and shipment requirements.',
  },
  {
    id: 'faq-4',
    category: 'cod',
    question: 'How does COD remittance work?',
    answer:
      'COD amount is collected by courier partners and updated in your COD report. You can view to-be-remitted and remitted COD details from your dashboard.',
  },
  {
    id: 'faq-5',
    category: 'integrations',
    question: 'Can I integrate Shopify or WooCommerce?',
    answer:
      'Yes, Dispatch Solutions supports ecommerce integrations like Shopify, WooCommerce and other OMS/WMS platforms to sync orders and manage shipments smoothly.',
  },
  {
    id: 'faq-6',
    category: 'cod',
    question: 'What happens if wallet balance is low?',
    answer:
      'If wallet balance is insufficient, shipment booking or label generation may be restricted until the wallet is recharged.',
  },
  {
    id: 'faq-7',
    category: 'billing',
    question: 'Where can I check my billing report?',
    answer:
      'You can check billing reports from your dashboard, including shipment charges, COD charges, wallet deductions and courier-wise billing details.',
  },
  {
    id: 'faq-8',
    category: 'support',
    question: 'How can I contact support?',
    answer:
      'You can contact the Dispatch Solutions support team for shipment, billing, tracking, COD, wallet and integration-related assistance.',
  },
];

export const DEFAULT_FAQ_FULL_PAGE_PROPS = {
  heroTitle: 'Frequently Asked Questions',
  heroSubtitle:
    'Find quick answers about shipping, tracking, COD, billing, integrations and more. Can\'t find what you need? We\'re here to help.',
  searchPlaceholder: 'Search your question here...',
  popularSearches: [
    { label: 'Track Order', query: 'track' },
    { label: 'COD Remittance', query: 'cod' },
    { label: 'Wallet', query: 'wallet' },
    { label: 'Integrations', query: 'integrat' },
  ],
  categoryEyebrow: 'FAQ Categories',
  categoryTitle: 'Find answers by topic',
  categorySubtitle:
    'Select a category to quickly browse questions related to shipping, tracking, COD, billing, integrations and support.',
  accordionEyebrow: 'Questions & Answers',
  accordionTitle: 'Frequently Asked Questions',
  accordionSubtitle:
    'Get clear answers about shipping, tracking, COD, wallet, billing, courier partners and integrations.',
  categories: FAQ_FULL_PAGE_CATEGORIES,
  items: DEFAULT_FAQ_FULL_PAGE_ITEMS,
  openItemId: 'faq-1',
  ctaTitle: 'Still have questions?',
  ctaSubtitle:
    'Our support team is available to help you with shipping, billing, tracking, COD, wallet and integration queries.',
  ctaFeatures: [
    { id: 'quick', label: 'Quick Response', icon: 'shield' },
    { id: 'expert', label: 'Expert Support', icon: 'user' },
    { id: 'reliable', label: 'Reliable Assistance', icon: 'check' },
  ],
  ctaPrimary: { label: 'Contact Support', href: '/contact' },
  ctaSecondary: { label: 'Book a Demo', href: '/demo' },
};

const CATEGORY_IDS = new Set(FAQ_FULL_PAGE_CATEGORIES.map((c) => c.id).filter((id) => id !== 'all'));

/**
 * @param {unknown} item
 * @param {number} index
 */
export function normalizeFaqFullPageItem(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  const id = String(t.id || `faq-${index + 1}`).trim() || `faq-${index + 1}`;
  const categoryRaw = String(t.category || 'shipping').trim().toLowerCase();
  const category = CATEGORY_IDS.has(categoryRaw) ? categoryRaw : 'shipping';
  return {
    id,
    category,
    question: String(t.question || t.label || `Question ${index + 1}`).trim(),
    answer: String(t.answer || t.body || t.text || '').trim(),
  };
}

/**
 * @param {unknown} items
 */
export function normalizeFaqFullPageItems(items) {
  if (!Array.isArray(items)) {
    return DEFAULT_FAQ_FULL_PAGE_ITEMS.map((item, i) => normalizeFaqFullPageItem(item, i));
  }
  const out = items.filter((x) => x && typeof x === 'object').map((item, i) => normalizeFaqFullPageItem(item, i));
  return out.length ? out : DEFAULT_FAQ_FULL_PAGE_ITEMS.map((item, i) => normalizeFaqFullPageItem(item, i));
}

/**
 * @param {unknown} categories
 */
export function normalizeFaqFullPageCategories(categories) {
  if (!Array.isArray(categories) || !categories.length) return FAQ_FULL_PAGE_CATEGORIES;
  const out = categories
    .filter((c) => c && typeof c === 'object')
    .map((c, i) => ({
      id: String(c.id || `cat-${i + 1}`).trim() || `cat-${i + 1}`,
      label: String(c.label || c.title || 'Category').trim(),
      icon: String(c.icon || 'grid').trim(),
    }));
  const hasAll = out.some((c) => c.id === 'all');
  return hasAll ? out : [{ id: 'all', label: 'All FAQs', icon: 'grid' }, ...out];
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 */
export function resolveFaqFullPageProps(props) {
  const p = props && typeof props === 'object' ? props : {};
  const items = normalizeFaqFullPageItems(p.items);
  const categories = normalizeFaqFullPageCategories(p.categories);
  const openIdRaw = String(p.openItemId ?? '').trim();
  const openItemId = items.some((it) => it.id === openIdRaw) ? openIdRaw : items[0]?.id || '';
  return {
    heroTitle: String(p.heroTitle || DEFAULT_FAQ_FULL_PAGE_PROPS.heroTitle).trim(),
    heroSubtitle: String(p.heroSubtitle || DEFAULT_FAQ_FULL_PAGE_PROPS.heroSubtitle).trim(),
    searchPlaceholder: String(p.searchPlaceholder || DEFAULT_FAQ_FULL_PAGE_PROPS.searchPlaceholder).trim(),
    popularSearches: Array.isArray(p.popularSearches) && p.popularSearches.length
      ? p.popularSearches
          .filter((x) => x && typeof x === 'object')
          .map((x) => ({
            label: String(x.label || '').trim(),
            query: String(x.query || x.label || '').trim().toLowerCase(),
          }))
          .filter((x) => x.label)
      : DEFAULT_FAQ_FULL_PAGE_PROPS.popularSearches,
    categoryEyebrow: String(p.categoryEyebrow || DEFAULT_FAQ_FULL_PAGE_PROPS.categoryEyebrow).trim(),
    categoryTitle: String(p.categoryTitle || DEFAULT_FAQ_FULL_PAGE_PROPS.categoryTitle).trim(),
    categorySubtitle: String(p.categorySubtitle || DEFAULT_FAQ_FULL_PAGE_PROPS.categorySubtitle).trim(),
    accordionEyebrow: String(p.accordionEyebrow || DEFAULT_FAQ_FULL_PAGE_PROPS.accordionEyebrow).trim(),
    accordionTitle: String(p.accordionTitle || DEFAULT_FAQ_FULL_PAGE_PROPS.accordionTitle).trim(),
    accordionSubtitle: String(p.accordionSubtitle || DEFAULT_FAQ_FULL_PAGE_PROPS.accordionSubtitle).trim(),
    categories,
    items,
    openItemId,
    ctaTitle: String(p.ctaTitle || DEFAULT_FAQ_FULL_PAGE_PROPS.ctaTitle).trim(),
    ctaSubtitle: String(p.ctaSubtitle || DEFAULT_FAQ_FULL_PAGE_PROPS.ctaSubtitle).trim(),
    ctaFeatures: Array.isArray(p.ctaFeatures) && p.ctaFeatures.length
      ? p.ctaFeatures
          .filter((x) => x && typeof x === 'object')
          .map((x, i) => ({
            id: String(x.id || `feat-${i + 1}`),
            label: String(x.label || '').trim(),
            icon: String(x.icon || 'check').trim(),
          }))
          .filter((x) => x.label)
      : DEFAULT_FAQ_FULL_PAGE_PROPS.ctaFeatures,
    ctaPrimary: {
      label: String(p.ctaPrimary?.label || DEFAULT_FAQ_FULL_PAGE_PROPS.ctaPrimary.label).trim(),
      href: String(p.ctaPrimary?.href || DEFAULT_FAQ_FULL_PAGE_PROPS.ctaPrimary.href).trim(),
    },
    ctaSecondary: {
      label: String(p.ctaSecondary?.label || DEFAULT_FAQ_FULL_PAGE_PROPS.ctaSecondary.label).trim(),
      href: String(p.ctaSecondary?.href || DEFAULT_FAQ_FULL_PAGE_PROPS.ctaSecondary.href).trim(),
    },
  };
}

/**
 * @param {ReturnType<typeof normalizeFaqFullPageItem>[]} items
 * @param {number} index
 * @param {Record<string, unknown>} patch
 */
export function patchFaqFullPageItems(items, index, patch) {
  const list = Array.isArray(items) ? [...items] : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  list[index] = normalizeFaqFullPageItem({ ...(list[index] || {}), ...patch }, index);
  return list;
}

export function appendFaqFullPageItem(items, category = 'shipping') {
  const list = Array.isArray(items) ? [...items] : [];
  const used = new Set(list.map((it) => String(it?.id || '')));
  let n = list.length + 1;
  let id = `faq-${n}`;
  while (used.has(id)) {
    n += 1;
    id = `faq-${n}`;
  }
  const categoryRaw = String(category || 'shipping').trim().toLowerCase();
  const resolvedCategory = categoryRaw === 'all' ? 'shipping' : CATEGORY_IDS.has(categoryRaw) ? categoryRaw : 'shipping';
  return [
    ...list,
    normalizeFaqFullPageItem(
      {
        id,
        category: resolvedCategory,
        question: 'New question',
        answer: 'Type your answer here.',
      },
      n - 1
    ),
  ];
}

/**
 * @param {ReturnType<typeof normalizeFaqFullPageItem>[]} items
 * @param {number} index
 */
export function removeFaqFullPageItemAt(items, index) {
  const list = Array.isArray(items) ? [...items] : [];
  if (list.length <= 1) return list;
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
  const next = list.filter((_, i) => i !== index);
  return next.map((item, i) => normalizeFaqFullPageItem(item, i));
}

/** Category options for inspector (excludes "all"). */
export function faqFullPageCategoryOptions(categories) {
  const list = normalizeFaqFullPageCategories(categories);
  return list.filter((c) => c.id !== 'all');
}

/**
 * @param {ReturnType<typeof normalizeFaqFullPageCategories>} categories
 * @param {string} categoryId
 * @param {string} label
 */
export function patchFaqFullPageCategoryLabel(categories, categoryId, label) {
  const list = normalizeFaqFullPageCategories(categories);
  const nextLabel = String(label ?? '').trim();
  return list.map((c) =>
    c.id === categoryId ? { ...c, label: nextLabel || c.label } : c
  );
}

/**
 * @param {unknown} popularSearches
 * @param {number} index
 * @param {{ label?: string, query?: string }} patch
 */
export function patchFaqFullPagePopularSearch(popularSearches, index, patch) {
  const base = resolveFaqFullPageProps({ popularSearches }).popularSearches;
  const list = [...base];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  const cur = list[index] || {};
  const label = patch.label != null ? String(patch.label).trim() : String(cur.label || '');
  const query =
    patch.query != null
      ? String(patch.query).trim().toLowerCase()
      : label.toLowerCase() || String(cur.query || '');
  list[index] = { label, query };
  return list.filter((x) => x.label);
}

/**
 * @param {unknown} ctaFeatures
 * @param {string} featureId
 * @param {string} label
 */
export function patchFaqFullPageCtaFeatureLabel(ctaFeatures, featureId, label) {
  const base = resolveFaqFullPageProps({ ctaFeatures }).ctaFeatures;
  const nextLabel = String(label ?? '').trim();
  return base.map((f) => (f.id === featureId ? { ...f, label: nextLabel || f.label } : f));
}

/**
 * Builder canvas / inspector content patch → node props fragment.
 * @param {Record<string, unknown> | null | undefined} props
 * @param {string} key
 * @param {unknown} value
 */
export function applyFaqFullPageContentPatch(props, key, value) {
  const resolved = resolveFaqFullPageProps(props);
  const k = String(key || '');

  if (
    k === 'heroTitle' ||
    k === 'heroSubtitle' ||
    k === 'searchPlaceholder' ||
    k === 'categoryEyebrow' ||
    k === 'ctaTitle' ||
    k === 'ctaSubtitle'
  ) {
    return { [k]: String(value ?? '') };
  }
  if (k === 'ctaPrimaryLabel') {
    return { ctaPrimary: { ...resolved.ctaPrimary, label: String(value ?? '') } };
  }
  if (k === 'ctaSecondaryLabel') {
    return { ctaSecondary: { ...resolved.ctaSecondary, label: String(value ?? '') } };
  }
  if (k.startsWith('categoryLabel:')) {
    const categoryId = k.slice('categoryLabel:'.length);
    return {
      categories: patchFaqFullPageCategoryLabel(resolved.categories, categoryId, String(value ?? '')),
    };
  }
  if (k.startsWith('popularSearchLabel:')) {
    const index = Number(k.slice('popularSearchLabel:'.length));
    return {
      popularSearches: patchFaqFullPagePopularSearch(resolved.popularSearches, index, {
        label: String(value ?? ''),
        query: String(value ?? ''),
      }),
    };
  }
  if (k.startsWith('ctaFeatureLabel:')) {
    const featureId = k.slice('ctaFeatureLabel:'.length);
    return {
      ctaFeatures: patchFaqFullPageCtaFeatureLabel(resolved.ctaFeatures, featureId, String(value ?? '')),
    };
  }
  return { [k]: value };
}
