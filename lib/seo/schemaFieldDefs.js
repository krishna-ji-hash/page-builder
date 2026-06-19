import { SEO_SCHEMA_TYPES } from './seoConstants.js';

/** Structured schema fields shown in the builder SEO modal (tokens allowed). */
export const SCHEMA_FIELD_DEFS = {
  WebPage: [
    { key: 'name', label: 'Page name', token: '{{title}}' },
    { key: 'description', label: 'Description', token: '{{description}}' },
    { key: 'url', label: 'URL', token: '{{url}}' },
  ],
  Article: [
    { key: 'headline', label: 'Headline', token: '{{title}}' },
    { key: 'description', label: 'Description', token: '{{description}}' },
    { key: 'author', label: 'Author', token: '{{siteTitle}}' },
    { key: 'image', label: 'Image', token: '{{image}}' },
  ],
  BlogPosting: [
    { key: 'headline', label: 'Headline', token: '{{title}}' },
    { key: 'description', label: 'Description', token: '{{description}}' },
    { key: 'author', label: 'Author', token: '{{siteTitle}}' },
    { key: 'image', label: 'Image', token: '{{image}}' },
    { key: 'mainEntityOfPage', label: 'Main entity URL', token: '{{url}}' },
  ],
  Product: [
    { key: 'name', label: 'Product name', token: '{{title}}' },
    { key: 'description', label: 'Description', token: '{{description}}' },
    { key: 'image', label: 'Image', token: '{{image}}' },
    { key: 'sku', label: 'SKU', token: '{{item.data.sku}}' },
    { key: 'price', label: 'Price', token: '{{item.data.price}}' },
  ],
  Service: [
    { key: 'name', label: 'Service name', token: '{{title}}' },
    { key: 'description', label: 'Description', token: '{{description}}' },
    { key: 'provider', label: 'Provider', token: '{{siteTitle}}' },
  ],
  Organization: [
    { key: 'name', label: 'Organization name', token: '{{siteTitle}}' },
    { key: 'url', label: 'URL', token: '{{url}}' },
    { key: 'logo', label: 'Logo', token: '{{image}}' },
  ],
  LocalBusiness: [
    { key: 'name', label: 'Business name', token: '{{siteTitle}}' },
    { key: 'url', label: 'URL', token: '{{url}}' },
    { key: 'telephone', label: 'Phone', token: '{{item.data.phone}}' },
    { key: 'streetAddress', label: 'Street', token: '{{item.data.address}}' },
  ],
  FAQ: [
    { key: 'name', label: 'Page name', token: '{{title}}' },
    { key: 'question', label: 'Sample question', token: '{{item.data.question}}' },
    { key: 'answer', label: 'Sample answer', token: '{{item.data.answer}}' },
  ],
  Breadcrumb: [
    { key: 'homeName', label: 'Home label', token: '{{siteTitle}}' },
    { key: 'pageName', label: 'Current page', token: '{{title}}' },
    { key: 'pageUrl', label: 'Current URL', token: '{{url}}' },
  ],
  Review: [
    { key: 'name', label: 'Review title', token: '{{title}}' },
    { key: 'reviewBody', label: 'Review body', token: '{{description}}' },
    { key: 'itemReviewed', label: 'Item reviewed', token: '{{title}}' },
  ],
};

export function defaultSchemaFieldValues(schemaType) {
  const defs = SCHEMA_FIELD_DEFS[schemaType] || [];
  return Object.fromEntries(defs.map((d) => [d.key, d.token]));
}

export function buildSchemaTemplateFromFields(schemaType, values = {}) {
  const type = String(schemaType || '').trim();
  if (!type || !SEO_SCHEMA_TYPES.includes(type)) return null;

  const v = (key, fallback) => {
    const raw = values[key];
    return raw != null && String(raw).trim() ? String(raw).trim() : fallback;
  };

  switch (type) {
    case 'WebPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: v('name', '{{title}}'),
        description: v('description', '{{description}}'),
        url: v('url', '{{url}}'),
      };
    case 'Article':
    case 'BlogPosting':
      return {
        '@context': 'https://schema.org',
        '@type': type,
        headline: v('headline', '{{title}}'),
        description: v('description', '{{description}}'),
        author: { '@type': 'Person', name: v('author', '{{siteTitle}}') },
        image: v('image', '{{image}}'),
        mainEntityOfPage: v('mainEntityOfPage', '{{url}}'),
      };
    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: v('name', '{{title}}'),
        description: v('description', '{{description}}'),
        image: v('image', '{{image}}'),
        sku: v('sku', '{{item.data.sku}}'),
        offers: {
          '@type': 'Offer',
          price: v('price', '{{item.data.price}}'),
          availability: 'https://schema.org/InStock',
          url: '{{url}}',
        },
      };
    case 'Service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: v('name', '{{title}}'),
        description: v('description', '{{description}}'),
        provider: { '@type': 'Organization', name: v('provider', '{{siteTitle}}') },
        url: '{{url}}',
      };
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: v('name', '{{siteTitle}}'),
        url: v('url', '{{url}}'),
        logo: v('logo', '{{image}}'),
      };
    case 'LocalBusiness':
      return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: v('name', '{{siteTitle}}'),
        url: v('url', '{{url}}'),
        telephone: v('telephone', '{{item.data.phone}}'),
        address: {
          '@type': 'PostalAddress',
          streetAddress: v('streetAddress', '{{item.data.address}}'),
        },
      };
    case 'FAQ':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: v('name', '{{title}}'),
        mainEntity: [
          {
            '@type': 'Question',
            name: v('question', '{{item.data.question}}'),
            acceptedAnswer: { '@type': 'Answer', text: v('answer', '{{item.data.answer}}') },
          },
        ],
      };
    case 'Breadcrumb':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: v('homeName', '{{siteTitle}}'), item: '/' },
          { '@type': 'ListItem', position: 2, name: v('pageName', '{{title}}'), item: v('pageUrl', '{{url}}') },
        ],
      };
    case 'Review':
      return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        name: v('name', '{{title}}'),
        reviewBody: v('reviewBody', '{{description}}'),
        itemReviewed: { '@type': 'Thing', name: v('itemReviewed', '{{title}}') },
      };
    default:
      return null;
  }
}
