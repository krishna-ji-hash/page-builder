/**
 * Pure helpers for CMS blog item mapping (no server imports — testable).
 */
import { normalizeBlogPosts } from './blogFullPageDefaults.js';
import { dedupePostsBySlug } from './publishedBlogPostUtils.js';
import {
  normalizeBlogContentBlocks,
  parseBlogBodyToContentBlocks,
} from './blogPostContent.js';

function mapNodeTree(nodes, mapper) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    const next = mapper(node);
    if (Array.isArray(next.children) && next.children.length) {
      return { ...next, children: mapNodeTree(next.children, mapper) };
    }
    return next;
  });
}

export function formatCmsBlogPublishedDate(item) {
  const explicit = String(item?.data?.publishedDate || '').trim();
  if (explicit) return explicit;
  const raw = item?.publishedAt || item?.updatedAt || item?.createdAt;
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * @param {object} item
 */
export function cmsItemToDetailPost(item) {
  const data = item?.data && typeof item.data === 'object' ? item.data : {};
  const content = Array.isArray(data.contentBlocks) && data.contentBlocks.length
    ? normalizeBlogContentBlocks(data.contentBlocks)
    : parseBlogBodyToContentBlocks(data.content, {
        title: item?.title,
        description: data.excerpt,
      });

  return {
    slug: String(item?.slug || '').trim(),
    title: String(item?.title || '').trim(),
    description: String(data.excerpt || '').trim(),
    category: String(data.category || 'Blog').trim() || 'Blog',
    readTime: String(data.readTime || '5 min read').trim(),
    publishedDate: formatCmsBlogPublishedDate(item),
    image: String(data.featuredImage || '').trim(),
    content,
    href: `/blog/${String(item?.slug || '').trim()}`,
    cmsItemId: item?.id ?? null,
  };
}

/**
 * @param {object} item
 */
export function cmsItemToWidgetPost(item) {
  const detail = cmsItemToDetailPost(item);
  return {
    id: `cms-${item?.id ?? detail.slug}`,
    slug: detail.slug,
    title: detail.title,
    description: detail.description,
    body: String(item?.data?.content || '').trim(),
    content: detail.content,
    image: detail.image,
    category: detail.category,
    readTime: detail.readTime,
    publishedDate: detail.publishedDate,
    href: detail.href,
  };
}

/**
 * Merge CMS posts into blog listing widgets (CMS wins on slug conflicts).
 * @param {object[]} nodes
 * @param {ReturnType<typeof normalizeBlogPosts>[number][]} cmsPosts
 */
export function mergeCmsPostsIntoBlogListingTree(nodes, cmsPosts) {
  const incoming = dedupePostsBySlug(normalizeBlogPosts(Array.isArray(cmsPosts) ? cmsPosts : []));
  if (!incoming.length || !Array.isArray(nodes) || !nodes.length) return nodes;

  return mapNodeTree(nodes, (node) => {
    if (node?.nodeType !== 'blog_full_page') return node;
    const props = node.props && typeof node.props === 'object' ? node.props : {};
    const existing = Array.isArray(props.posts) ? props.posts : [];
    const merged = dedupePostsBySlug([...incoming, ...existing]);
    return {
      ...node,
      props: {
        ...props,
        posts: merged,
      },
    };
  });
}
