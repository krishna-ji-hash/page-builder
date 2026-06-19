import { SEO_SCHEMA_TYPES } from './seoConstants.js';
import { ensureAbsoluteUrl, resolveSiteOrigin } from './absoluteUrl.js';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function pickType(requested) {
  const t = str(requested).trim();
  return SEO_SCHEMA_TYPES.includes(t) ? t : '';
}

/**
 * Auto-generate JSON-LD when schemaType is set and no custom schemaTemplate/json exists.
 * Does not touch renderTree — output is consumed by route metadata + JsonLd component.
 */
export function generateSchemaJsonLd({
  schemaType,
  projectSeo = {},
  pageSeo = {},
  pageName = '',
  canonical = '',
  cmsContext = null,
}) {
  const type = pickType(schemaType || pageSeo.schemaType);
  if (!type) return null;

  const item = isPlainObject(cmsContext?.item) ? cmsContext.item : null;
  const title = str(pageSeo.title || item?.title || pageName || projectSeo.siteTitle);
  const description = str(
    pageSeo.description || projectSeo.defaultDescription || projectSeo.siteTagline || title
  );
  const url = str(canonical);
  const siteName = str(projectSeo.siteTitle || projectSeo.siteName);
  const origin = resolveSiteOrigin(projectSeo);
  const image = ensureAbsoluteUrl(origin, str(pageSeo.ogImage || projectSeo.defaultOgImage));

  const org = {
    '@type': 'Organization',
    name: str(projectSeo.companyName || siteName),
    url: ensureAbsoluteUrl(origin, str(projectSeo.canonicalDomain || url || '/')),
    ...(image ? { logo: image } : {}),
  };

  switch (type) {
    case 'Organization':
      return { '@context': 'https://schema.org', ...org };

    case 'WebPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        ...(url ? { url } : {}),
        isPartOf: { '@type': 'WebSite', name: siteName, ...(url ? { url: projectSeo.canonicalDomain || url } : {}) },
      };

    case 'Service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: title,
        description,
        provider: org,
        ...(url ? { url } : {}),
      };

    case 'LocalBusiness':
      return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: str(projectSeo.companyName || siteName),
        description,
        ...(url ? { url } : {}),
        ...(image ? { image } : {}),
      };

    case 'Article':
    case 'BlogPosting':
      return {
        '@context': 'https://schema.org',
        '@type': type,
        headline: title,
        description,
        ...(url ? { mainEntityOfPage: url, url } : {}),
        ...(image ? { image } : {}),
        author: {
          '@type': 'Person',
          name: str(pageSeo.author || projectSeo.defaultAuthor || siteName),
        },
        publisher: {
          '@type': 'Organization',
          name: str(projectSeo.defaultPublisher || projectSeo.companyName || siteName),
        },
        datePublished: item?.publishedAt || undefined,
        dateModified: item?.updatedAt || undefined,
      };

    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description,
        ...(url ? { url } : {}),
        ...(image ? { image } : {}),
      };

    case 'FAQ':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: title,
        ...(url ? { url } : {}),
      };

    case 'Breadcrumb':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: siteName || 'Home', item: projectSeo.canonicalDomain || url },
          { '@type': 'ListItem', position: 2, name: title, ...(url ? { item: url } : {}) },
        ],
      };

    case 'Review':
      return {
        '@context': 'https://schema.org',
        '@type': 'Review',
        name: title,
        reviewBody: description,
        itemReviewed: { '@type': 'Thing', name: title },
      };

    default:
      return null;
  }
}
