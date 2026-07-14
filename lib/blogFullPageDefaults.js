/** Full blog page — hero, category tabs, featured, grid, guides, newsletter, CTA. */

import {
  siteBlogPostsForBuilderWidget,
  findSiteBlogPostByTitle,
  resolveSiteBlogPost,
  siteBlogPostHref,
} from './siteBlogPosts.js';

export const BLOG_FULL_PAGE_CATEGORIES = [
  { id: 'all', label: 'All Posts', icon: 'grid' },
  { id: 'shipping-guide', label: 'Shipping Guide', icon: 'shipping' },
  { id: 'courier-partners', label: 'Courier Partners', icon: 'courier' },
  { id: 'cod-wallet', label: 'COD & Wallet', icon: 'wallet' },
  { id: 'tracking', label: 'Tracking', icon: 'tracking' },
  { id: 'ecommerce', label: 'eCommerce', icon: 'cart' },
  { id: 'integrations', label: 'Integrations', icon: 'integrations' },
  { id: 'billing', label: 'Billing', icon: 'billing' },
];

export const DEFAULT_BLOG_POSTS = siteBlogPostsForBuilderWidget();

export const DEFAULT_BLOG_GUIDES = [
  {
    id: 'guide-1',
    title: 'Complete Guide to eCommerce Shipping',
    text: 'Basics of shipping, courier selection and fulfillment.',
    icon: '📦',
  },
  {
    id: 'guide-2',
    title: 'How to Print Shipping Labels and AWB',
    text: 'Learn label, manifest and AWB generation flow.',
    icon: '🏷️',
  },
  {
    id: 'guide-3',
    title: 'COD vs Prepaid Shipping Explained',
    text: 'Understand collection, remittance and reconciliation.',
    icon: '💰',
  },
  {
    id: 'guide-4',
    title: 'How Courier Serviceability Works',
    text: 'Know how pin code coverage and zones are mapped.',
    icon: '🗺️',
  },
];

export const DEFAULT_BLOG_FULL_PAGE_PROPS = {
  heroPill: '📚 Dispatch Knowledge Hub',
  heroTitle: 'Logistics Insights, Shipping Tips & Industry Updates',
  heroSubtitle:
    'Practical guides for eCommerce sellers and operations teams to improve shipping, courier selection, COD management, tracking, fulfillment and logistics automation.',
  searchPlaceholder: 'Search blogs, guides or shipping topics...',
  popularTopics: [
    { label: 'Shipping' },
    { label: 'COD' },
    { label: 'Courier Integration' },
    { label: 'Tracking' },
    { label: 'RTO' },
  ],
  heroStats: [
    { id: 'stat-1', value: '50+', label: 'Shipping Guides' },
    { id: 'stat-2', value: '20+', label: 'Integration Topics' },
    { id: 'stat-3', value: 'Weekly', label: 'Industry Updates' },
  ],
  heroNoteTitle: 'New Guide Published',
  heroNoteText: 'Reduce RTO using smarter courier allocation.',
  categories: BLOG_FULL_PAGE_CATEGORIES,
  featured: {
    badge: '★ Featured Article',
    title: 'How to Choose the Best Courier Partner for Your eCommerce Business',
    description:
      'Learn how to compare courier partners based on pricing, pin code serviceability, delivery speed, COD support, RTO performance and tracking reliability.',
    metaCategory: 'Logistics Guide',
    readTime: '6 min read',
    updated: 'Updated Today',
    image:
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1100&q=80',
    overlayTitle: 'Courier Selection Framework',
    overlaySubtitle: 'Cost • TAT • Coverage',
    buttonLabel: 'Read Featured Guide →',
    buttonHref: '/blog/courier-rate-comparison',
    slug: 'courier-rate-comparison',
    body:
      'Learn how to compare courier partners based on pricing, pin code serviceability, delivery speed, COD support, RTO performance and tracking reliability.\n\nChoosing the right courier partner impacts delivery speed, customer satisfaction and logistics cost. Use serviceability checks, rate cards and SLA data before finalizing partners for each shipment zone.',
  },
  latestKicker: 'Latest Articles',
  latestTitle: 'Fresh logistics guides for better operations',
  latestSubtitle:
    'Explore practical content to improve shipping speed, reduce RTO and manage courier operations.',
  latestViewAllLabel: 'View All Articles →',
  latestViewAllHref: '#',
  posts: DEFAULT_BLOG_POSTS,
  guidesKicker: 'Popular Guides',
  guidesTitle: 'Most useful shipping resources',
  guidesSubtitle: 'Quick guides your team can use for everyday logistics operations.',
  guidesViewAllLabel: 'View All Guides →',
  guidesViewAllHref: '#',
  guides: DEFAULT_BLOG_GUIDES,
  newsletterTitle: 'Get logistics tips directly in your inbox',
  newsletterSubtitle:
    'Subscribe to receive shipping guides, courier updates, COD insights and eCommerce logistics tips from Dispatch Solutions.',
  newsletterPlaceholder: 'Enter your email address',
  newsletterButtonLabel: 'Subscribe',
  ctaPill: '🚀 Dispatch Solutions',
  ctaTitle: 'Ready to simplify your shipping operations?',
  ctaSubtitle:
    'Manage orders, courier partners, AWB, labels, tracking, COD, wallet and billing from one powerful logistics dashboard.',
  ctaPrimaryLabel: 'Book a Demo →',
  ctaPrimaryHref: '/demo',
  ctaSecondaryLabel: 'Contact Sales →',
  ctaSecondaryHref: '/contact',
};

const CATEGORY_IDS = new Set(BLOG_FULL_PAGE_CATEGORIES.map((c) => c.id).filter((id) => id !== 'all'));

/** Use default only when the key is absent — empty string means user removed the value. */
export function resolveOptionalTextProp(props, key, defaultValue) {
  const bag = props && typeof props === 'object' ? props : {};
  if (Object.prototype.hasOwnProperty.call(bag, key)) {
    return String(bag[key] ?? '').trim();
  }
  return String(defaultValue ?? '').trim();
}

export function slugifyBlogText(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96) || 'article'
  );
}

export function defaultBlogPostBody(description) {
  const intro = String(description || '').trim();
  if (!intro) return 'Add your full article content here.';
  return `${intro}\n\nLogistics teams use these practices to improve delivery speed, reduce RTO and manage courier partners from one dashboard. You can replace this text with your full article in the builder.`;
}

/**
 * @param {{ slug?: string, title?: string, href?: string }} post
 */
export function defaultBlogPostHref(post) {
  const custom = String(post?.href || '').trim();
  if (custom && custom !== '#') return custom;
  const slug = String(post?.slug || slugifyBlogText(post?.title)).trim() || 'article';
  return `/blog/${slug}`;
}

export function normalizeBlogCategory(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  return {
    id: String(t.id || `cat-${index + 1}`).trim() || `cat-${index + 1}`,
    label: String(t.label || t.name || 'Category').trim(),
    icon: String(t.icon || 'grid').trim(),
  };
}

export function normalizeBlogCategories(categories) {
  if (!Array.isArray(categories) || !categories.length) return BLOG_FULL_PAGE_CATEGORIES;
  const out = categories.filter((c) => c && typeof c === 'object').map(normalizeBlogCategory);
  return out.some((c) => c.id === 'all')
    ? out
    : [{ id: 'all', label: 'All Posts', icon: 'grid' }, ...out];
}

export function normalizeBlogPost(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  const id = String(t.id || `post-${index + 1}`).trim() || `post-${index + 1}`;
  const categoryRaw = String(t.category || 'shipping-guide').trim().toLowerCase();
  const category = CATEGORY_IDS.has(categoryRaw) ? categoryRaw : 'shipping-guide';
  const title = String(t.title || `Article ${index + 1}`).trim();
  const description = String(t.description || t.desc || '').trim();
  const explicitSlug = String(t.slug || '').trim();
  const slug = explicitSlug || slugifyBlogText(title) || `article-${index + 1}`;
  const siteMatch = resolveSiteBlogPost(slug) || findSiteBlogPostByTitle(title);
  const canonicalSlug = explicitSlug || String(siteMatch?.slug || slug).trim();
  const body = String(t.body || t.content || defaultBlogPostBody(description)).trim();
  const hrefRaw = String(t.href || '').trim();
  const href = siteMatch
    ? siteBlogPostHref(siteMatch.slug)
    : hrefRaw && hrefRaw !== '#'
      ? hrefRaw
      : defaultBlogPostHref({ slug: canonicalSlug, title });
  const content = Array.isArray(t.content) ? t.content : undefined;
  return {
    id,
    slug: canonicalSlug,
    category,
    readTime: String(t.readTime || t.read_time || '5 min read').trim(),
    publishedDate: String(t.publishedDate || t.published_date || '').trim(),
    title,
    description,
    body,
    image: String(t.image || t.img || '').trim(),
    href,
    ...(content ? { content } : {}),
  };
}

export function normalizeBlogPosts(posts) {
  if (!Array.isArray(posts) || !posts.length) {
    return DEFAULT_BLOG_POSTS.map((p, i) => normalizeBlogPost(p, i));
  }
  const out = posts.filter((x) => x && typeof x === 'object').map((p, i) => normalizeBlogPost(p, i));
  return out.length ? out : DEFAULT_BLOG_POSTS.map((p, i) => normalizeBlogPost(p, i));
}

export function normalizeBlogGuide(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  return {
    id: String(t.id || `guide-${index + 1}`).trim() || `guide-${index + 1}`,
    title: String(t.title || `Guide ${index + 1}`).trim(),
    text: String(t.text || t.description || '').trim(),
    icon: String(t.icon || '📦').trim(),
  };
}

export function normalizeBlogGuides(guides) {
  if (!Array.isArray(guides) || !guides.length) {
    return DEFAULT_BLOG_GUIDES.map((g, i) => normalizeBlogGuide(g, i));
  }
  const out = guides.filter((x) => x && typeof x === 'object').map((g, i) => normalizeBlogGuide(g, i));
  return out.length ? out : DEFAULT_BLOG_GUIDES.map((g, i) => normalizeBlogGuide(g, i));
}

export function resolveBlogFullPageProps(props) {
  const p = props && typeof props === 'object' ? props : {};
  const categories = normalizeBlogCategories(p.categories);
  const posts = normalizeBlogPosts(p.posts);
  const guides = normalizeBlogGuides(p.guides);
  const featuredRaw = p.featured && typeof p.featured === 'object' ? p.featured : {};
  const defaultFeatured = DEFAULT_BLOG_FULL_PAGE_PROPS.featured;
  return {
    heroPill: String(p.heroPill || DEFAULT_BLOG_FULL_PAGE_PROPS.heroPill).trim(),
    heroTitle: String(p.heroTitle || DEFAULT_BLOG_FULL_PAGE_PROPS.heroTitle).trim(),
    heroSubtitle: String(p.heroSubtitle || DEFAULT_BLOG_FULL_PAGE_PROPS.heroSubtitle).trim(),
    searchPlaceholder: String(p.searchPlaceholder || DEFAULT_BLOG_FULL_PAGE_PROPS.searchPlaceholder).trim(),
    popularTopics:
      Array.isArray(p.popularTopics) && p.popularTopics.length
        ? p.popularTopics
            .filter((x) => x && typeof x === 'object')
            .map((x) => ({ label: String(x.label || '').trim() }))
            .filter((x) => x.label)
        : DEFAULT_BLOG_FULL_PAGE_PROPS.popularTopics,
    heroStats:
      Array.isArray(p.heroStats) && p.heroStats.length
        ? p.heroStats
            .filter((x) => x && typeof x === 'object')
            .map((x, i) => ({
              id: String(x.id || `stat-${i + 1}`),
              value: String(x.value || '').trim(),
              label: String(x.label || '').trim(),
            }))
            .filter((x) => x.value && x.label)
        : DEFAULT_BLOG_FULL_PAGE_PROPS.heroStats,
    heroNoteTitle: resolveOptionalTextProp(p, 'heroNoteTitle', DEFAULT_BLOG_FULL_PAGE_PROPS.heroNoteTitle),
    heroNoteText: resolveOptionalTextProp(p, 'heroNoteText', DEFAULT_BLOG_FULL_PAGE_PROPS.heroNoteText),
    categories,
    featured: {
      badge: String(featuredRaw.badge || defaultFeatured.badge).trim(),
      title: String(featuredRaw.title || defaultFeatured.title).trim(),
      description: String(featuredRaw.description || defaultFeatured.description).trim(),
      metaCategory: String(featuredRaw.metaCategory || defaultFeatured.metaCategory).trim(),
      readTime: String(featuredRaw.readTime || defaultFeatured.readTime).trim(),
      updated: String(featuredRaw.updated || defaultFeatured.updated).trim(),
      image: String(featuredRaw.image || defaultFeatured.image).trim(),
      overlayTitle: String(featuredRaw.overlayTitle || defaultFeatured.overlayTitle).trim(),
      overlaySubtitle: String(featuredRaw.overlaySubtitle || defaultFeatured.overlaySubtitle).trim(),
      buttonLabel: String(featuredRaw.buttonLabel || defaultFeatured.buttonLabel).trim(),
      buttonHref: String(featuredRaw.buttonHref || defaultFeatured.buttonHref).trim(),
      slug: String(featuredRaw.slug || defaultFeatured.slug || slugifyBlogText(featuredRaw.title || defaultFeatured.title)).trim(),
      body: String(
        featuredRaw.body ||
          defaultFeatured.body ||
          defaultBlogPostBody(featuredRaw.description || defaultFeatured.description)
      ).trim(),
    },
    latestKicker: String(p.latestKicker || DEFAULT_BLOG_FULL_PAGE_PROPS.latestKicker).trim(),
    latestTitle: String(p.latestTitle || DEFAULT_BLOG_FULL_PAGE_PROPS.latestTitle).trim(),
    latestSubtitle: String(p.latestSubtitle || DEFAULT_BLOG_FULL_PAGE_PROPS.latestSubtitle).trim(),
    latestViewAllLabel: String(p.latestViewAllLabel || DEFAULT_BLOG_FULL_PAGE_PROPS.latestViewAllLabel).trim(),
    latestViewAllHref: String(p.latestViewAllHref || DEFAULT_BLOG_FULL_PAGE_PROPS.latestViewAllHref).trim(),
    posts,
    guidesKicker: String(p.guidesKicker || DEFAULT_BLOG_FULL_PAGE_PROPS.guidesKicker).trim(),
    guidesTitle: String(p.guidesTitle || DEFAULT_BLOG_FULL_PAGE_PROPS.guidesTitle).trim(),
    guidesSubtitle: String(p.guidesSubtitle || DEFAULT_BLOG_FULL_PAGE_PROPS.guidesSubtitle).trim(),
    guidesViewAllLabel: String(p.guidesViewAllLabel || DEFAULT_BLOG_FULL_PAGE_PROPS.guidesViewAllLabel).trim(),
    guidesViewAllHref: String(p.guidesViewAllHref || DEFAULT_BLOG_FULL_PAGE_PROPS.guidesViewAllHref).trim(),
    guides,
    newsletterTitle: String(p.newsletterTitle || DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterTitle).trim(),
    newsletterSubtitle: String(p.newsletterSubtitle || DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterSubtitle).trim(),
    newsletterPlaceholder: String(p.newsletterPlaceholder || DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterPlaceholder).trim(),
    newsletterButtonLabel: String(p.newsletterButtonLabel || DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterButtonLabel).trim(),
    ctaPill: String(p.ctaPill || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaPill).trim(),
    ctaTitle: String(p.ctaTitle || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaTitle).trim(),
    ctaSubtitle: String(p.ctaSubtitle || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaSubtitle).trim(),
    ctaPrimaryLabel: String(p.ctaPrimaryLabel || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaPrimaryLabel).trim(),
    ctaPrimaryHref: String(p.ctaPrimaryHref || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaPrimaryHref).trim(),
    ctaSecondaryLabel: String(p.ctaSecondaryLabel || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaSecondaryLabel).trim(),
    ctaSecondaryHref: String(p.ctaSecondaryHref || DEFAULT_BLOG_FULL_PAGE_PROPS.ctaSecondaryHref).trim(),
  };
}

export function patchBlogPosts(posts, index, patch) {
  const list = Array.isArray(posts) ? [...posts] : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  list[index] = normalizeBlogPost({ ...(list[index] || {}), ...patch }, index);
  return list;
}

export function patchBlogPostById(posts, postId, patch) {
  const list = normalizeBlogPosts(posts);
  const index = list.findIndex((p) => p.id === postId);
  if (index < 0) return list;
  return patchBlogPosts(list, index, patch);
}

export function appendBlogPost(posts, category = 'shipping-guide') {
  const list = normalizeBlogPosts(posts);
  const used = new Set(list.map((p) => p.id));
  let n = list.length + 1;
  let id = `post-${n}`;
  while (used.has(id)) {
    n += 1;
    id = `post-${n}`;
  }
  const cat = CATEGORY_IDS.has(category) ? category : 'shipping-guide';
  return [
    ...list,
    normalizeBlogPost(
      {
        id,
        category: cat,
        title: 'New article title',
        description: 'Add a short description for this article.',
        body: defaultBlogPostBody('Add a short description for this article.'),
        readTime: '5 min read',
        image: DEFAULT_BLOG_POSTS[0]?.image || '',
        href: '',
      },
      n - 1
    ),
  ];
}

export function removeBlogPostAt(posts, index) {
  const list = normalizeBlogPosts(posts);
  if (list.length <= 1) return list;
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
  return list.filter((_, i) => i !== index).map((p, i) => normalizeBlogPost(p, i));
}

export function patchBlogGuides(guides, index, patch) {
  const list = Array.isArray(guides) ? [...guides] : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  list[index] = normalizeBlogGuide({ ...(list[index] || {}), ...patch }, index);
  return list;
}

export function appendBlogGuide(guides) {
  const list = normalizeBlogGuides(guides);
  const used = new Set(list.map((g) => g.id));
  let n = list.length + 1;
  let id = `guide-${n}`;
  while (used.has(id)) {
    n += 1;
    id = `guide-${n}`;
  }
  return [
    ...list,
    normalizeBlogGuide(
      { id, title: 'New guide', text: 'Guide description.', icon: '📦' },
      n - 1
    ),
  ];
}

export function removeBlogGuideAt(guides, index) {
  const list = normalizeBlogGuides(guides);
  if (list.length <= 1) return list;
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
  return list.filter((_, i) => i !== index).map((g, i) => normalizeBlogGuide(g, i));
}

export function patchBlogCategoryLabel(categories, categoryId, label) {
  const list = normalizeBlogCategories(categories);
  const next = String(label ?? '').trim();
  return list.map((c) => (c.id === categoryId ? { ...c, label: next || c.label } : c));
}

export function blogCategoryOptions(categories) {
  return normalizeBlogCategories(categories).filter((c) => c.id !== 'all');
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 * @param {string} key
 * @param {unknown} value
 */
export function applyBlogFullPageContentPatch(props, key, value) {
  const resolved = resolveBlogFullPageProps(props);
  const k = String(key || '');

  const scalarKeys = [
    'heroPill',
    'heroTitle',
    'heroSubtitle',
    'searchPlaceholder',
    'heroNoteTitle',
    'heroNoteText',
    'latestKicker',
    'latestTitle',
    'latestSubtitle',
    'latestViewAllLabel',
    'guidesKicker',
    'guidesTitle',
    'guidesSubtitle',
    'guidesViewAllLabel',
    'newsletterTitle',
    'newsletterSubtitle',
    'newsletterPlaceholder',
    'newsletterButtonLabel',
    'ctaPill',
    'ctaTitle',
    'ctaSubtitle',
    'ctaPrimaryLabel',
    'ctaSecondaryLabel',
  ];
  if (scalarKeys.includes(k)) {
    return { [k]: String(value ?? '') };
  }
  if (k === 'ctaPrimaryHref') return { ctaPrimaryHref: String(value ?? '') };
  if (k === 'ctaSecondaryHref') return { ctaSecondaryHref: String(value ?? '') };
  if (k === 'latestViewAllHref') return { latestViewAllHref: String(value ?? '') };
  if (k === 'guidesViewAllHref') return { guidesViewAllHref: String(value ?? '') };

  if (k.startsWith('featured.')) {
    const field = k.slice('featured.'.length);
    return { featured: { ...resolved.featured, [field]: String(value ?? '') } };
  }
  if (k.startsWith('categoryLabel:')) {
    const id = k.slice('categoryLabel:'.length);
    return { categories: patchBlogCategoryLabel(resolved.categories, id, String(value ?? '')) };
  }
  if (k.startsWith('popularTopic:')) {
    const index = Number(k.slice('popularTopic:'.length));
    const topics = [...resolved.popularTopics];
    if (!Number.isInteger(index) || index < 0 || index >= topics.length) return {};
    topics[index] = { label: String(value ?? '') };
    return { popularTopics: topics.filter((t) => t.label) };
  }
  if (k.startsWith('heroStatValue:')) {
    const id = k.slice('heroStatValue:'.length);
    return {
      heroStats: resolved.heroStats.map((s) =>
        s.id === id ? { ...s, value: String(value ?? '') } : s
      ),
    };
  }
  if (k.startsWith('heroStatLabel:')) {
    const id = k.slice('heroStatLabel:'.length);
    return {
      heroStats: resolved.heroStats.map((s) =>
        s.id === id ? { ...s, label: String(value ?? '') } : s
      ),
    };
  }
  if (k.startsWith('guideTitle:')) {
    const id = k.slice('guideTitle:'.length);
    const index = resolved.guides.findIndex((g) => g.id === id);
    if (index < 0) return {};
    return { guides: patchBlogGuides(resolved.guides, index, { title: String(value ?? '') }) };
  }
  if (k.startsWith('guideText:')) {
    const id = k.slice('guideText:'.length);
    const index = resolved.guides.findIndex((g) => g.id === id);
    if (index < 0) return {};
    return { guides: patchBlogGuides(resolved.guides, index, { text: String(value ?? '') }) };
  }
  if (k.startsWith('postBody:')) {
    const postId = k.slice('postBody:'.length);
    const index = resolved.posts.findIndex((p) => p.id === postId);
    if (index < 0) return {};
    return { posts: patchBlogPosts(resolved.posts, index, { body: String(value ?? '') }) };
  }
  if (k === 'featured.body') {
    return { featured: { ...resolved.featured, body: String(value ?? '') } };
  }
  if (k === 'heroNote.clear') {
    return { heroNoteTitle: '', heroNoteText: '' };
  }
  if (k === 'heroNote.restore') {
    return {
      heroNoteTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.heroNoteTitle,
      heroNoteText: DEFAULT_BLOG_FULL_PAGE_PROPS.heroNoteText,
    };
  }

  return { [k]: value };
}
