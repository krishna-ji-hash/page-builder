/**
 * Pure mappers for first-class blog_posts → public/widget shapes.
 */
import { serializeBlogContentToBody } from './blogPostContent.js';
import { buildAutoBlogSchemaJsonLd } from './blogAutoSchema.js';
import { blogSchemaToPageSeoFields, normalizeBlogSchemaType } from './blogSchemaMarkup.js';

/**
 * Map DB post → public detail shape expected by blog article template.
 */
export function blogPostToDetailPost(post) {
  if (!post) return null;
  const published =
    post.publishedAt != null
      ? new Date(post.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
  const schemaType = normalizeBlogSchemaType(post.schemaType);
  let schemaSeo = blogSchemaToPageSeoFields(schemaType, post.schemaJsonLd);
  if (schemaType !== 'custom') {
    const auto = buildAutoBlogSchemaJsonLd({
      enableArticleSchema: post.enableArticleSchema !== false,
      enableFaqSchema: Boolean(post.enableFaqSchema),
      title: post.title,
      seoTitle: post.seoTitle,
      excerpt: post.excerpt,
      seoDescription: post.seoDescription,
      featuredImage: post.featuredImage,
      ogImage: post.ogImage,
      socialImage: post.socialImage,
      canonicalUrl: post.canonicalUrl,
      slug: post.slug,
      authorName: post.author?.name,
      faqs: post.faqs,
    });
    if (auto) {
      schemaSeo = { schemaType: '', schemaJsonLd: auto };
    }
  }
  return {
    slug: post.slug,
    title: post.title,
    description: post.excerpt || '',
    category: post.category?.name || 'Blog',
    categorySlug: post.category?.slug || '',
    readTime: post.readTime || '5 min read',
    publishedDate: published,
    image: post.featuredImage || '',
    content: post.contentJson || [],
    contentHtml: post.contentHtml || '',
    faqs: post.faqs || [],
    keyTakeaways: post.keyTakeaways || [],
    author: post.author
      ? {
          name: post.author.name,
          designation: post.author.designation,
          bio: post.author.bio,
          avatar: post.author.avatar,
        }
      : null,
    tags: (post.tags || []).map((t) => t.name),
    seo: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || '',
      canonicalUrl: post.canonicalUrl || '',
      ogImage: post.socialImage || post.ogImage || post.featuredImage || '',
      ogTitle: post.ogTitle || post.seoTitle || post.title || '',
      ogDescription: post.ogDescription || post.seoDescription || post.excerpt || '',
      keywords: String(post.metaKeywords || post.focusKeywords || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      robots: post.robots || 'index,follow',
      noindex: String(post.robots || '').includes('noindex'),
      nofollow: String(post.robots || '').includes('nofollow'),
      schemaType: schemaType,
      schemaJsonLd: post.schemaJsonLd || null,
      engineSchemaType: schemaSeo.schemaType,
      engineSchemaJsonLd: schemaSeo.schemaJsonLd,
      enableArticleSchema: post.enableArticleSchema !== false,
      enableFaqSchema: Boolean(post.enableFaqSchema),
    },
    featuredImageAlt: post.featuredImageAlt || '',
    featuredImageCaption: post.featuredImageCaption || '',
    visibility: post.visibility || 'public',
    internalLinks: post.internalLinks || [],
    externalLinks: post.externalLinks || [],
    tocItems: post.tocItems || [],
    href: `/blog/${post.slug}`,
    blogPostId: post.id,
  };
}

export function blogPostToWidgetPost(post) {
  const detail = blogPostToDetailPost(post);
  if (!detail) return null;
  return {
    id: `blog-${post.id}`,
    slug: detail.slug,
    title: detail.title,
    description: detail.description,
    body: serializeBlogContentToBody(detail.content),
    content: detail.content,
    image: detail.image,
    category: detail.category,
    readTime: detail.readTime,
    publishedDate: detail.publishedDate,
    href: detail.href,
  };
}
