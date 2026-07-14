/**
 * Pure helpers for resolving blog posts from builder widget trees (no server imports).
 */
import {
  BLOG_FULL_PAGE_CATEGORIES,
  normalizeBlogPost,
  normalizeBlogPosts,
  resolveBlogFullPageProps,
} from './blogFullPageDefaults.js';
import {
  normalizeBlogContentBlocks,
  parseBlogBodyToContentBlocks,
} from './blogPostContent.js';

function walkNodes(nodes, visitor) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    visitor(node);
    if (Array.isArray(node?.children) && node.children.length) {
      walkNodes(node.children, visitor);
    }
  }
}

function categoryLabelFromId(categoryId) {
  const id = String(categoryId || '').trim();
  const match = BLOG_FULL_PAGE_CATEGORIES.find((cat) => cat.id === id);
  return match?.label || id || 'Blog';
}

/**
 * @param {unknown[]} nodes
 * @returns {ReturnType<typeof normalizeBlogPost>[]}
 */
export function extractWidgetPostsFromPageTree(nodes) {
  /** @type {Record<string, unknown>[]} */
  const collected = [];

  walkNodes(nodes, (node) => {
    if (node?.nodeType === 'blog_full_page') {
      const resolved = resolveBlogFullPageProps(node.props);
      const featuredFromProps =
        node.props?.featured && typeof node.props.featured === 'object' ? node.props.featured : null;
      if (featuredFromProps && String(featuredFromProps.title || '').trim()) {
        collected.push({
          id: `featured-${resolved.featured.slug || 'featured'}`,
          slug: resolved.featured.slug,
          category: resolved.featured.metaCategory || 'shipping-guide',
          readTime: resolved.featured.readTime,
          title: resolved.featured.title,
          description: resolved.featured.description,
          body: resolved.featured.body,
          image: resolved.featured.image,
          href: resolved.featured.buttonHref,
        });
      }
      if (Array.isArray(resolved.posts)) collected.push(...resolved.posts);
      return;
    }
    if (node?.nodeType === 'blog_articles_grid' && Array.isArray(node.props?.posts)) {
      collected.push(...node.props.posts);
    }
  });

  return normalizeBlogPosts(collected);
}

export function dedupePostsBySlug(posts) {
  const seen = new Set();
  /** @type {ReturnType<typeof normalizeBlogPost>[]} */
  const out = [];
  for (const post of posts) {
    const slug = String(post?.slug || '').trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(post);
  }
  return out;
}

/**
 * @param {import('@/lib/siteBlogPosts').SiteBlogPost | Record<string, unknown>} post
 */
export function widgetPostToDetailPost(post) {
  const normalized = normalizeBlogPost(post);
  const rawContent = post && typeof post === 'object' ? post.content : null;
  const content = Array.isArray(rawContent) && rawContent.length
    ? normalizeBlogContentBlocks(rawContent)
    : parseBlogBodyToContentBlocks(normalized.body, {
        title: normalized.title,
        description: normalized.description,
      });

  return {
    slug: normalized.slug,
    title: normalized.title,
    description: normalized.description,
    category: categoryLabelFromId(normalized.category),
    categoryId: normalized.category,
    readTime: normalized.readTime,
    publishedDate: String(post?.publishedDate || normalized.publishedDate || '').trim(),
    image: normalized.image,
    content,
    href: normalized.href,
  };
}

function slugifyBlogTitle(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || ''
  );
}

/**
 * @param {ReturnType<typeof normalizeBlogPost>[]} posts
 * @param {string} slug
 */
export function findWidgetPostBySlug(posts, slug) {
  const raw = String(slug || '').trim();
  if (!raw || !Array.isArray(posts) || !posts.length) return null;
  const lowered = raw.toLowerCase();

  for (const post of posts) {
    if (String(post.slug || '').toLowerCase() === lowered) return post;
    if (slugifyBlogTitle(post.title) === lowered) return post;
  }

  for (const post of posts) {
    const postSlug = String(post.slug || '').toLowerCase();
    if (lowered.startsWith(`${postSlug}-`) || lowered.includes(postSlug)) return post;
  }

  return null;
}
