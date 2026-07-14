/**
 * Blog detail sections — hero, article body, sidebar, bottom CTA.
 * Each maps to BlogDetailPage via `sectionOnly`.
 */
import {
  DEFAULT_BLOG_DETAIL_PAGE_PROPS,
  DEFAULT_BLOG_DETAIL_TAKEAWAYS,
  resolveBlogDetailPageProps,
} from '@/lib/blogDetailPageDefaults.js';

/** @typedef {'hero'|'article'|'sidebar'|'cta'} BlogDetailSectionKey */

/**
 * @typedef {Object} BlogDetailSectionDef
 * @property {string} nodeType
 * @property {string} templateId
 * @property {BlogDetailSectionKey} sectionKey
 * @property {string} label
 * @property {string} shortLabel
 * @property {string} icon
 * @property {string} description
 * @property {() => Record<string, unknown>} defaultProps
 */

/** @type {BlogDetailSectionDef[]} */
export const BLOG_DETAIL_SECTION_DEFS = [
  {
    nodeType: 'blog_detail_hero',
    templateId: 'blogDetailHero',
    sectionKey: 'hero',
    label: 'Blog Detail Hero',
    shortLabel: 'Detail Hero',
    icon: 'BD①',
    description: 'Article hero with back link, category badge, title, summary and feature image.',
    defaultProps: () => ({
      category: DEFAULT_BLOG_DETAIL_PAGE_PROPS.category,
      readTime: DEFAULT_BLOG_DETAIL_PAGE_PROPS.readTime,
      publishedDate: DEFAULT_BLOG_DETAIL_PAGE_PROPS.publishedDate,
      title: DEFAULT_BLOG_DETAIL_PAGE_PROPS.title,
      description: DEFAULT_BLOG_DETAIL_PAGE_PROPS.description,
      image: DEFAULT_BLOG_DETAIL_PAGE_PROPS.image,
      blogListHref: DEFAULT_BLOG_DETAIL_PAGE_PROPS.blogListHref,
      homeHref: DEFAULT_BLOG_DETAIL_PAGE_PROPS.homeHref,
      homeLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.homeLabel,
      blogLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.blogLabel,
      authorLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.authorLabel,
    }),
  },
  {
    nodeType: 'blog_detail_article',
    templateId: 'blogDetailArticle',
    sectionKey: 'article',
    label: 'Blog Detail Article',
    shortLabel: 'Article Body',
    icon: 'BD②',
    description: 'Article content blocks and key takeaways card.',
    defaultProps: () => ({
      content: DEFAULT_BLOG_DETAIL_PAGE_PROPS.content.map((block) => ({ ...block })),
      takeaways: [...DEFAULT_BLOG_DETAIL_TAKEAWAYS],
    }),
  },
  {
    nodeType: 'blog_detail_sidebar',
    templateId: 'blogDetailSidebar',
    sectionKey: 'sidebar',
    label: 'Blog Detail Sidebar',
    shortLabel: 'Sidebar',
    icon: 'BD③',
    description: 'Sticky right rail with lead form, newsletter and help CTA.',
    defaultProps: () => ({
      blogListHref: DEFAULT_BLOG_DETAIL_PAGE_PROPS.blogListHref,
      leadFormTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.leadFormTitle,
      leadFormSubmitLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.leadFormSubmitLabel,
      newsletterTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.newsletterTitle,
      newsletterSubtitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.newsletterSubtitle,
      newsletterPlaceholder: DEFAULT_BLOG_DETAIL_PAGE_PROPS.newsletterPlaceholder,
      newsletterButtonLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.newsletterButtonLabel,
      helpCtaTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.helpCtaTitle,
      helpCtaText: DEFAULT_BLOG_DETAIL_PAGE_PROPS.helpCtaText,
      helpCtaLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.helpCtaLabel,
      helpCtaHref: DEFAULT_BLOG_DETAIL_PAGE_PROPS.helpCtaHref,
    }),
  },
  {
    nodeType: 'blog_detail_bottom_cta',
    templateId: 'blogDetailBottomCta',
    sectionKey: 'cta',
    label: 'Blog Detail CTA',
    shortLabel: 'Detail CTA',
    icon: 'BD④',
    description: 'Bottom related blogs grid section.',
    defaultProps: () => ({
      relatedTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.relatedTitle,
    }),
  },
];

export const BLOG_DETAIL_SECTION_NODE_TYPES = new Set(BLOG_DETAIL_SECTION_DEFS.map((d) => d.nodeType));

const BLOG_DETAIL_SECTION_BY_NODE = new Map(BLOG_DETAIL_SECTION_DEFS.map((d) => [d.nodeType, d]));
const BLOG_DETAIL_SECTION_BY_TEMPLATE = new Map(BLOG_DETAIL_SECTION_DEFS.map((d) => [d.templateId, d]));

/** @param {string | null | undefined} nodeType */
export function getBlogDetailSectionDef(nodeType) {
  return BLOG_DETAIL_SECTION_BY_NODE.get(String(nodeType || '')) || null;
}

/** @param {string | null | undefined} templateId */
export function getBlogDetailSectionDefByTemplate(templateId) {
  return BLOG_DETAIL_SECTION_BY_TEMPLATE.get(String(templateId || '')) || null;
}

/** @param {string | null | undefined} nodeType */
export function isBlogDetailSectionNodeType(nodeType) {
  return BLOG_DETAIL_SECTION_NODE_TYPES.has(String(nodeType || ''));
}

/** @param {string | null | undefined} nodeType */
export function isAnyBlogDetailWidgetNodeType(nodeType) {
  const t = String(nodeType || '');
  return t === 'blog_detail_page' || isBlogDetailSectionNodeType(t);
}

export function resolveBlogDetailSectionWidgetProps(props) {
  return resolveBlogDetailPageProps(props);
}

/** @returns {Record<string, import('@/lib/builder/widgetRegistry.js').WidgetDefinition>} */
export function buildBlogDetailSectionWidgetRegistryEntries() {
  /** @type {Record<string, import('@/lib/builder/widgetRegistry.js').WidgetDefinition>} */
  const out = {};
  for (const def of BLOG_DETAIL_SECTION_DEFS) {
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
export function findDescendantBlogDetailWidgetNode(root) {
  if (!root || typeof root !== 'object') return null;
  if (isAnyBlogDetailWidgetNodeType(root.nodeType)) return root;
  const kids = Array.isArray(root.children) ? root.children : [];
  for (const child of kids) {
    const found = findDescendantBlogDetailWidgetNode(child);
    if (found) return found;
  }
  return null;
}
