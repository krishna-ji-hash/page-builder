export const BLOG_POST_TEMPLATE_SLUG = 'blog-post';
export const BLOG_POST_TEMPLATE_TITLE = 'Blog Article Template';

export function isBlogPostTemplatePage(page) {
  return String(page?.slug || '').trim() === BLOG_POST_TEMPLATE_SLUG;
}
