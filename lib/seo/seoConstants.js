/** Enterprise SEO — shared constants */

export const SEO_SCHEMA_TYPES = Object.freeze([
  'WebPage',
  'Organization',
  'LocalBusiness',
  'Service',
  'FAQ',
  'Article',
  'BlogPosting',
  'Product',
  'Breadcrumb',
  'Review',
]);

export const TWITTER_CARD_TYPES = Object.freeze(['summary', 'summary_large_image']);

export const ROBOTS_IMAGE_PREVIEW = Object.freeze(['large', 'standard', 'none']);

export const SEO_AUDIT_CATEGORIES = Object.freeze(['seo', 'content', 'accessibility', 'performance']);

export const SEO_AUDIT_SEVERITY = Object.freeze({
  critical: 3,
  warning: 2,
  passed: 0,
});
