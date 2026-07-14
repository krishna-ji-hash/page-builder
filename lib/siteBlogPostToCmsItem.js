/**
 * Map canonical site blog posts into CMS blog item create/update payloads.
 */
import { serializeBlogContentToBody } from './blogPostContent.js';

/**
 * @param {import('./siteBlogPosts.js').SiteBlogPost} post
 * @param {{ author?: string, tags?: string[] }} [opts]
 */
export function siteBlogPostToCmsItemPayload(post, opts = {}) {
  const title = String(post?.title || '').trim();
  const slug = String(post?.slug || '').trim();
  const description = String(post?.description || '').trim();
  const content = Array.isArray(post?.content) ? post.content : [];

  return {
    status: 'published',
    title,
    slug,
    data: {
      excerpt: description,
      content: serializeBlogContentToBody(content),
      contentBlocks: content.map((block) => ({
        heading: String(block?.heading || '').trim(),
        text: String(block?.text || '').trim(),
      })),
      featuredImage: String(post?.image || '').trim(),
      category: String(post?.category || 'Blog').trim() || 'Blog',
      readTime: String(post?.readTime || '5 min read').trim(),
      publishedDate: String(post?.publishedDate || '').trim(),
      tags: Array.isArray(opts.tags) ? opts.tags : [],
      author: String(opts.author || 'Dispatch Team').trim(),
    },
    seo: {
      title: title ? `${title} | Dispatch Solutions Blog` : '',
      description,
      focusKeyword: '',
      canonicalUrl: '',
      ogImage: String(post?.image || '').trim(),
      schemaType: 'BlogPosting',
      noindex: false,
    },
  };
}
