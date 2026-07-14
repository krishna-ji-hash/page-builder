/**
 * Blog detail page — /blog/[slug] template defaults and prop resolution.
 */
import { getSiteBlogPost, getAllSiteBlogPosts, siteBlogPostPublishedDate } from './siteBlogPosts.js';

export const DEFAULT_BLOG_DETAIL_TAKEAWAYS = [
  'Use courier data before selecting shipping partners.',
  'Track shipments, COD and billing from one dashboard.',
  'Automate manual logistics operations wherever possible.',
];

const firstPost = getAllSiteBlogPosts()[0];

export const DEFAULT_BLOG_DETAIL_PAGE_PROPS = {
  slug: firstPost?.slug || 'what-is-logistics-aggregator',
  category: firstPost?.category || 'Shipping Guide',
  readTime: firstPost?.readTime || '5 min read',
  publishedDate: 'May 20, 2026',
  title: firstPost?.title || 'Blog article title',
  description: firstPost?.description || 'Add a short article summary.',
  image: firstPost?.image || '',
  content: firstPost?.content?.length
    ? firstPost.content.map((block) => ({ ...block }))
    : [{ heading: 'Section heading', text: 'Add article body copy here.' }],
  blogListHref: '/blog',
  homeHref: '/',
  homeLabel: 'Home',
  blogLabel: 'Blog',
  authorLabel: 'Dispatch Solutions',
  tocTitle: 'Table of Contents',
  tocReadMoreLabel: 'Read more',
  leftRelatedTitle: 'Related Blogs',
  leftYouMightLikeTitle: 'You Might Like',
  leadFormTitle: 'Get Logistics Insights',
  leadFormSubmitLabel: 'Submit',
  newsletterTitle: 'Stay Updated',
  newsletterSubtitle: 'Subscribe for shipping tips and courier updates delivered to your inbox.',
  newsletterPlaceholder: 'Your email',
  newsletterButtonLabel: 'Subscribe',
  helpCtaTitle: 'Need help?',
  helpCtaText: 'Talk to our logistics experts.',
  helpCtaLabel: 'Contact Us',
  helpCtaHref: '/contact',
  shareTitle: 'Share this blog!',
  relatedTitle: 'More Related Blogs',
  takeaways: [...DEFAULT_BLOG_DETAIL_TAKEAWAYS],
};

function normalizeContentBlock(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  return {
    heading: String(t.heading || t.title || `Section ${index + 1}`).trim(),
    text: String(t.text || t.body || t.description || '').trim(),
  };
}

function normalizeContentBlocks(content) {
  if (!Array.isArray(content) || !content.length) {
    return DEFAULT_BLOG_DETAIL_PAGE_PROPS.content.map((block, index) => normalizeContentBlock(block, index));
  }
  return content.map(normalizeContentBlock);
}

function normalizeTakeaways(takeaways) {
  if (!Array.isArray(takeaways) || !takeaways.length) return [...DEFAULT_BLOG_DETAIL_TAKEAWAYS];
  return takeaways.map((item) => String(item || '').trim()).filter(Boolean);
}

/** @param {import('./siteBlogPosts').SiteBlogPost & { author?: { name?: string }, keyTakeaways?: string[], faqs?: { question: string, answer: string }[] }} post */
export function siteBlogPostToDetailProps(post, blogListHref = '/blog') {
  if (!post) return { ...DEFAULT_BLOG_DETAIL_PAGE_PROPS };
  const authorName =
    (post.author && typeof post.author === 'object' ? post.author.name : '') ||
    post.authorLabel ||
    DEFAULT_BLOG_DETAIL_PAGE_PROPS.authorLabel;
  return {
    slug: post.slug,
    category: post.category,
    readTime: post.readTime,
    publishedDate: siteBlogPostPublishedDate(post),
    title: post.title,
    description: post.description,
    image: post.image,
    content: post.content.map((block) => ({ ...block })),
    blogListHref,
    homeHref: DEFAULT_BLOG_DETAIL_PAGE_PROPS.homeHref,
    homeLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.homeLabel,
    blogLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.blogLabel,
    authorLabel: authorName,
    tocTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.tocTitle,
    tocReadMoreLabel: DEFAULT_BLOG_DETAIL_PAGE_PROPS.tocReadMoreLabel,
    leftRelatedTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.leftRelatedTitle,
    leftYouMightLikeTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.leftYouMightLikeTitle,
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
    shareTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.shareTitle,
    relatedTitle: DEFAULT_BLOG_DETAIL_PAGE_PROPS.relatedTitle,
    takeaways:
      Array.isArray(post.keyTakeaways) && post.keyTakeaways.length
        ? post.keyTakeaways.map((t) => String(t || '').trim()).filter(Boolean)
        : [...DEFAULT_BLOG_DETAIL_TAKEAWAYS],
    faqs: Array.isArray(post.faqs) ? post.faqs : [],
    author: post.author && typeof post.author === 'object' ? post.author : null,
  };
}

/** Merge live article data into a builder template without losing editable chrome. */
export function mergeBlogPostIntoDetailProps(templateProps, post, blogListHref = '/blog', catalogPosts = null) {
  const base = resolveBlogDetailPageProps(templateProps);
  const article = siteBlogPostToDetailProps(post, blogListHref);
  return {
    ...base,
    slug: article.slug,
    category: article.category,
    readTime: article.readTime,
    publishedDate: article.publishedDate,
    title: article.title,
    description: article.description,
    image: article.image,
    content: article.content,
    authorLabel: article.authorLabel,
    takeaways: article.takeaways,
    faqs: article.faqs,
    author: article.author,
    blogListHref: article.blogListHref,
    catalogPosts: Array.isArray(catalogPosts) && catalogPosts.length ? catalogPosts : base.catalogPosts,
  };
}

export function resolveBlogDetailPageProps(props) {
  const bag = props && typeof props === 'object' ? props : {};
  const defaults = DEFAULT_BLOG_DETAIL_PAGE_PROPS;
  return {
    slug: String(bag.slug || defaults.slug).trim(),
    category: String(bag.category || defaults.category).trim(),
    readTime: String(bag.readTime || defaults.readTime).trim(),
    publishedDate: String(bag.publishedDate || defaults.publishedDate).trim(),
    title: String(bag.title || defaults.title).trim(),
    description: String(bag.description || defaults.description).trim(),
    image: String(bag.image || defaults.image).trim(),
    content: normalizeContentBlocks(bag.content),
    blogListHref: String(bag.blogListHref || defaults.blogListHref).trim() || '/blog',
    homeHref: String(bag.homeHref || defaults.homeHref).trim() || '/',
    homeLabel: String(bag.homeLabel || defaults.homeLabel).trim(),
    blogLabel: String(bag.blogLabel || defaults.blogLabel).trim(),
    authorLabel: String(bag.authorLabel || defaults.authorLabel).trim(),
    tocTitle: String(bag.tocTitle || defaults.tocTitle).trim(),
    tocReadMoreLabel: String(bag.tocReadMoreLabel || defaults.tocReadMoreLabel).trim(),
    leftRelatedTitle: String(bag.leftRelatedTitle || defaults.leftRelatedTitle).trim(),
    leftYouMightLikeTitle: String(bag.leftYouMightLikeTitle || defaults.leftYouMightLikeTitle).trim(),
    leadFormTitle: String(bag.leadFormTitle || defaults.leadFormTitle).trim(),
    leadFormSubmitLabel: String(bag.leadFormSubmitLabel || defaults.leadFormSubmitLabel).trim(),
    newsletterTitle: String(bag.newsletterTitle || defaults.newsletterTitle).trim(),
    newsletterSubtitle: String(bag.newsletterSubtitle || defaults.newsletterSubtitle).trim(),
    newsletterPlaceholder: String(bag.newsletterPlaceholder || defaults.newsletterPlaceholder).trim(),
    newsletterButtonLabel: String(bag.newsletterButtonLabel || defaults.newsletterButtonLabel).trim(),
    helpCtaTitle: String(bag.helpCtaTitle || defaults.helpCtaTitle).trim(),
    helpCtaText: String(bag.helpCtaText || defaults.helpCtaText).trim(),
    helpCtaLabel: String(bag.helpCtaLabel || defaults.helpCtaLabel).trim(),
    helpCtaHref: String(bag.helpCtaHref || defaults.helpCtaHref).trim(),
    shareTitle: String(bag.shareTitle || defaults.shareTitle).trim(),
    relatedTitle: String(bag.relatedTitle || defaults.relatedTitle).trim(),
    takeaways: normalizeTakeaways(bag.takeaways),
    catalogPosts: Array.isArray(bag.catalogPosts) ? bag.catalogPosts : [],
  };
}

export function applyBlogDetailPageContentPatch(props, key, value) {
  const current = resolveBlogDetailPageProps(props);
  const k = String(key || '').trim();
  if (!k) return {};

  if (k === 'takeawaysJson') {
    try {
      const parsed = JSON.parse(String(value ?? '[]'));
      return { takeaways: normalizeTakeaways(parsed) };
    } catch {
      return {};
    }
  }

  if (k === 'contentJson') {
    try {
      const parsed = JSON.parse(String(value ?? '[]'));
      return { content: normalizeContentBlocks(parsed) };
    } catch {
      return {};
    }
  }

  const contentMatch = k.match(/^content\.(\d+)\.(heading|text)$/);
  if (contentMatch) {
    const index = Number(contentMatch[1]);
    const field = contentMatch[2];
    const next = current.content.map((block, i) =>
      i === index ? { ...block, [field]: String(value ?? '') } : block
    );
    return { content: next };
  }

  const takeawayMatch = k.match(/^takeaways\.(\d+)$/);
  if (takeawayMatch) {
    const index = Number(takeawayMatch[1]);
    const next = [...current.takeaways];
    next[index] = String(value ?? '');
    return { takeaways: normalizeTakeaways(next) };
  }

  if (Object.prototype.hasOwnProperty.call(current, k)) {
    return { [k]: value };
  }

  return {};
}

export function appendBlogDetailContentBlock(props) {
  const current = resolveBlogDetailPageProps(props);
  return {
    content: [...current.content, { heading: 'New section', text: 'Add section copy here.' }],
  };
}

export function removeBlogDetailContentBlockAt(props, index) {
  const current = resolveBlogDetailPageProps(props);
  if (current.content.length <= 1) return { content: current.content };
  const next = current.content.filter((_, i) => i !== index);
  return { content: next.length ? next : current.content };
}

export function getDefaultBlogDetailPreviewPost() {
  return getSiteBlogPost(DEFAULT_BLOG_DETAIL_PAGE_PROPS.slug) || getAllSiteBlogPosts()[0] || null;
}
