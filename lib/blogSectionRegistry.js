/**
 * Individual blog hub section templates — hero, tabs, featured, grid, guides, newsletter, CTA.
 * Each maps to a compound widget that renders one slice of BlogFullPage via `sectionOnly`.
 */
import {
  BLOG_FULL_PAGE_CATEGORIES,
  DEFAULT_BLOG_FULL_PAGE_PROPS,
  DEFAULT_BLOG_GUIDES,
  DEFAULT_BLOG_POSTS,
  resolveBlogFullPageProps,
} from '@/lib/blogFullPageDefaults.js';

/** @typedef {'hero'|'tabs'|'featured'|'articles'|'guides'|'newsletter'|'cta'} BlogSectionKey */

/**
 * @typedef {Object} BlogSectionDef
 * @property {string} nodeType
 * @property {string} templateId
 * @property {BlogSectionKey} sectionKey
 * @property {string} label
 * @property {string} shortLabel
 * @property {string} icon
 * @property {string} description
 * @property {() => Record<string, unknown>} defaultProps
 * @property {boolean} supportsPosts
 */

/** @type {BlogSectionDef[]} */
export const BLOG_SECTION_DEFS = [
  {
    nodeType: 'blog_hub_hero',
    templateId: 'blogHubHero',
    sectionKey: 'hero',
    label: 'Blog Hub Hero',
    shortLabel: 'Blog Hero',
    icon: 'B①',
    description: 'Knowledge hub hero with search, popular topics and stats.',
    defaultProps: () => ({
      heroPill: DEFAULT_BLOG_FULL_PAGE_PROPS.heroPill,
      heroTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.heroTitle,
      heroSubtitle: DEFAULT_BLOG_FULL_PAGE_PROPS.heroSubtitle,
      searchPlaceholder: DEFAULT_BLOG_FULL_PAGE_PROPS.searchPlaceholder,
      popularTopics: DEFAULT_BLOG_FULL_PAGE_PROPS.popularTopics,
      heroStats: DEFAULT_BLOG_FULL_PAGE_PROPS.heroStats,
      heroNoteTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.heroNoteTitle,
      heroNoteText: DEFAULT_BLOG_FULL_PAGE_PROPS.heroNoteText,
    }),
    supportsPosts: false,
  },
  {
    nodeType: 'blog_category_tabs',
    templateId: 'blogCategoryTabs',
    sectionKey: 'tabs',
    label: 'Blog Category Tabs',
    shortLabel: 'Blog Tabs',
    icon: 'B②',
    description: 'Horizontal category filter tabs for blog content.',
    defaultProps: () => ({
      categories: BLOG_FULL_PAGE_CATEGORIES,
    }),
    supportsPosts: false,
  },
  {
    nodeType: 'blog_featured_article',
    templateId: 'blogFeaturedArticle',
    sectionKey: 'featured',
    label: 'Blog Featured Article',
    shortLabel: 'Featured',
    icon: 'B③',
    description: 'Large featured article card with image overlay.',
    defaultProps: () => ({
      featured: { ...DEFAULT_BLOG_FULL_PAGE_PROPS.featured },
    }),
    supportsPosts: false,
  },
  {
    nodeType: 'blog_articles_grid',
    templateId: 'blogArticlesGrid',
    sectionKey: 'articles',
    label: 'Blog Articles Grid',
    shortLabel: 'Articles',
    icon: 'B④',
    description: 'Latest articles grid with category filter and read-more detail.',
    defaultProps: () => ({
      categories: BLOG_FULL_PAGE_CATEGORIES,
      latestKicker: DEFAULT_BLOG_FULL_PAGE_PROPS.latestKicker,
      latestTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.latestTitle,
      latestSubtitle: DEFAULT_BLOG_FULL_PAGE_PROPS.latestSubtitle,
      latestViewAllLabel: DEFAULT_BLOG_FULL_PAGE_PROPS.latestViewAllLabel,
      latestViewAllHref: DEFAULT_BLOG_FULL_PAGE_PROPS.latestViewAllHref,
      posts: DEFAULT_BLOG_POSTS,
    }),
    supportsPosts: true,
  },
  {
    nodeType: 'blog_guides_section',
    templateId: 'blogGuidesSection',
    sectionKey: 'guides',
    label: 'Blog Guides',
    shortLabel: 'Guides',
    icon: 'B⑤',
    description: 'Popular shipping guides row with icons.',
    defaultProps: () => ({
      guidesKicker: DEFAULT_BLOG_FULL_PAGE_PROPS.guidesKicker,
      guidesTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.guidesTitle,
      guidesSubtitle: DEFAULT_BLOG_FULL_PAGE_PROPS.guidesSubtitle,
      guidesViewAllLabel: DEFAULT_BLOG_FULL_PAGE_PROPS.guidesViewAllLabel,
      guidesViewAllHref: DEFAULT_BLOG_FULL_PAGE_PROPS.guidesViewAllHref,
      guides: DEFAULT_BLOG_GUIDES,
    }),
    supportsPosts: false,
  },
  {
    nodeType: 'blog_newsletter_section',
    templateId: 'blogNewsletterSection',
    sectionKey: 'newsletter',
    label: 'Blog Newsletter',
    shortLabel: 'Newsletter',
    icon: 'B⑥',
    description: 'Email signup strip for logistics tips.',
    defaultProps: () => ({
      newsletterTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterTitle,
      newsletterSubtitle: DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterSubtitle,
      newsletterPlaceholder: DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterPlaceholder,
      newsletterButtonLabel: DEFAULT_BLOG_FULL_PAGE_PROPS.newsletterButtonLabel,
    }),
    supportsPosts: false,
  },
  {
    nodeType: 'blog_final_cta',
    templateId: 'blogFinalCta',
    sectionKey: 'cta',
    label: 'Blog Final CTA',
    shortLabel: 'Blog CTA',
    icon: 'B⑦',
    description: 'Bottom call-to-action for demo and contact.',
    defaultProps: () => ({
      ctaPill: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaPill,
      ctaTitle: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaTitle,
      ctaSubtitle: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaSubtitle,
      ctaPrimaryLabel: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaPrimaryLabel,
      ctaPrimaryHref: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaPrimaryHref,
      ctaSecondaryLabel: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaSecondaryLabel,
      ctaSecondaryHref: DEFAULT_BLOG_FULL_PAGE_PROPS.ctaSecondaryHref,
    }),
    supportsPosts: false,
  },
];

export const BLOG_SECTION_NODE_TYPES = new Set(BLOG_SECTION_DEFS.map((d) => d.nodeType));

const BLOG_SECTION_BY_NODE = new Map(BLOG_SECTION_DEFS.map((d) => [d.nodeType, d]));
const BLOG_SECTION_BY_TEMPLATE = new Map(BLOG_SECTION_DEFS.map((d) => [d.templateId, d]));

/** @param {string | null | undefined} nodeType */
export function getBlogSectionDef(nodeType) {
  return BLOG_SECTION_BY_NODE.get(String(nodeType || '')) || null;
}

/** @param {string | null | undefined} templateId */
export function getBlogSectionDefByTemplate(templateId) {
  return BLOG_SECTION_BY_TEMPLATE.get(String(templateId || '')) || null;
}

/** @param {string | null | undefined} nodeType */
export function isBlogSectionNodeType(nodeType) {
  return BLOG_SECTION_NODE_TYPES.has(String(nodeType || ''));
}

/** @param {string | null | undefined} nodeType */
export function isAnyBlogWidgetNodeType(nodeType) {
  const t = String(nodeType || '');
  return t === 'blog_full_page' || isBlogSectionNodeType(t);
}

/**
 * @param {import('@/lib/blogFullPageDefaults.js').resolveBlogFullPageProps extends Function ? Parameters<typeof resolveBlogFullPageProps>[0] : Record<string, unknown>} props
 */
export function resolveBlogSectionWidgetProps(props) {
  return resolveBlogFullPageProps(props);
}

/** @returns {Record<string, import('@/lib/builder/widgetRegistry.js').WidgetDefinition>} */
export function buildBlogSectionWidgetRegistryEntries() {
  /** @type {Record<string, import('@/lib/builder/widgetRegistry.js').WidgetDefinition>} */
  const out = {};
  for (const def of BLOG_SECTION_DEFS) {
    out[def.nodeType] = {
      type: def.nodeType,
      label: def.label,
      allowedParents: ['stack'],
      defaultProps: def.defaultProps(),
      supportsData: false,
      supportsActions: false,
    };
  }
  return out;
}

/** @param {import('@/lib/builderHierarchy.js').TreeNode | null | undefined} root */
export function findDescendantBlogWidgetNode(root) {
  if (!root || typeof root !== 'object') return null;
  if (isAnyBlogWidgetNodeType(root.nodeType)) return root;
  const kids = Array.isArray(root.children) ? root.children : [];
  for (const child of kids) {
    const found = findDescendantBlogWidgetNode(child);
    if (found) return found;
  }
  return null;
}
