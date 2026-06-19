'use client';

import { SEO_SCHEMA_TYPES } from '@/lib/seo/seoConstants';

export async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const base = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    const detail =
      typeof data?.details === 'string'
        ? data.details
        : data?.details != null
          ? JSON.stringify(data.details)
          : '';
    throw new Error(detail && !base.includes(detail) ? `${base}: ${detail}` : base);
  }
  return data;
}

export const SEO_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'defaults', label: 'Project Defaults' },
  { id: 'pages', label: 'Pages' },
  { id: 'blog', label: 'Blog SEO' },
  { id: 'schema', label: 'Schema' },
  { id: 'sitemap', label: 'Sitemap' },
  { id: 'robots', label: 'Robots' },
  { id: 'redirects', label: 'Redirects' },
  { id: 'audit', label: 'Audit' },
  { id: 'enterprise', label: 'Enterprise Suite' },
  { id: 'llm', label: 'LLM SEO' },
  { id: 'ai', label: 'AI Automation' },
  { id: 'social', label: 'Social Preview' },
  { id: 'search-console', label: 'Search Console Ready' },
];

export const EMPTY_DEFAULTS = {
  siteTitle: '',
  siteName: '',
  siteTagline: '',
  companyName: '',
  defaultAuthor: '',
  defaultPublisher: '',
  language: 'en',
  country: '',
  titleTemplate: '{{title}} | {{siteTitle}}',
  defaultMetaTitle: '',
  defaultDescription: '',
  defaultKeywords: '',
  defaultOgImage: '',
  defaultOgTitle: '',
  defaultOgDescription: '',
  twitterCard: 'summary_large_image',
  twitterSite: '',
  twitterCreator: '',
  favicon: '',
  canonicalDomain: '',
  indexingEnabled: true,
  robotsIndex: true,
  robotsFollow: true,
  robotsMode: 'allow_all',
  robotsDisallowPaths: '',
  crawlDelay: '',
  maxImagePreview: 'large',
  maxSnippet: -1,
  maxVideoPreview: -1,
  schemaTemplates: {},
};

export const GLOBAL_SCHEMA_KEYS = ['Organization', 'WebSite', 'LocalBusiness', 'Breadcrumb'];
export const PAGE_SCHEMA_KEYS = ['WebPage', 'Service', 'FAQ', 'Product', 'Article', 'BlogPosting'];

export { SEO_SCHEMA_TYPES };

export function previewTitle(template, siteTitle, pageTitle = 'Home') {
  const tpl = template || '{{title}} | {{siteTitle}}';
  const site = siteTitle || 'My Company';
  return tpl.replace(/\{\{title\}\}/g, pageTitle).replace(/\{\{siteTitle\}\}/g, site);
}

export function seoFromApi(seo = {}) {
  const templates = seo.schemaTemplates && typeof seo.schemaTemplates === 'object' ? seo.schemaTemplates : {};
  return {
    ...EMPTY_DEFAULTS,
    siteTitle: seo.siteTitle || seo.siteName || '',
    siteName: seo.siteName || seo.siteTitle || '',
    siteTagline: seo.siteTagline || '',
    companyName: seo.companyName || '',
    defaultAuthor: seo.defaultAuthor || '',
    defaultPublisher: seo.defaultPublisher || '',
    language: seo.language || 'en',
    country: seo.country || '',
    titleTemplate: seo.titleTemplate || EMPTY_DEFAULTS.titleTemplate,
    defaultMetaTitle: seo.defaultMetaTitle || '',
    defaultDescription: seo.defaultDescription || '',
    defaultKeywords: Array.isArray(seo.defaultKeywords) ? seo.defaultKeywords.join(', ') : seo.defaultKeywords || '',
    defaultOgImage: seo.defaultOgImage || '',
    defaultOgTitle: seo.defaultOgTitle || '',
    defaultOgDescription: seo.defaultOgDescription || '',
    twitterCard: seo.twitterCard || 'summary_large_image',
    twitterSite: seo.twitterSite || '',
    twitterCreator: seo.twitterCreator || '',
    favicon: seo.favicon || '',
    canonicalDomain: seo.canonicalDomain || '',
    indexingEnabled: seo.indexingEnabled !== false,
    robotsIndex: seo.robots?.index !== false,
    robotsFollow: seo.robots?.follow !== false,
    robotsMode: seo.robotsMode || 'allow_all',
    robotsDisallowPaths: Array.isArray(seo.robotsDisallowPaths) ? seo.robotsDisallowPaths.join('\n') : '',
    crawlDelay: seo.crawlDelay ?? '',
    maxImagePreview: seo.robots?.googleBot?.['max-image-preview'] || 'large',
    maxSnippet: seo.robots?.googleBot?.['max-snippet'] ?? -1,
    maxVideoPreview: seo.robots?.googleBot?.['max-video-preview'] ?? -1,
    schemaTemplates: templates,
  };
}

export function defaultsToPayload(form) {
  const googleBot = {};
  if (form.maxImagePreview) googleBot['max-image-preview'] = form.maxImagePreview;
  if (form.maxSnippet != null && form.maxSnippet !== '' && Number(form.maxSnippet) >= 0) {
    googleBot['max-snippet'] = Number(form.maxSnippet);
  }
  if (form.maxVideoPreview != null && form.maxVideoPreview !== '' && Number(form.maxVideoPreview) >= 0) {
    googleBot['max-video-preview'] = Number(form.maxVideoPreview);
  }
  return {
    siteTitle: form.siteTitle,
    siteName: form.siteName || form.siteTitle,
    siteTagline: form.siteTagline,
    companyName: form.companyName,
    defaultAuthor: form.defaultAuthor,
    defaultPublisher: form.defaultPublisher,
    language: form.language,
    country: form.country,
    titleTemplate: form.titleTemplate,
    defaultMetaTitle: form.defaultMetaTitle,
    defaultDescription: form.defaultDescription,
    defaultKeywords: form.defaultKeywords
      .split(/[,;]+/)
      .map((k) => k.trim())
      .filter(Boolean),
    defaultOgImage: form.defaultOgImage,
    defaultOgTitle: form.defaultOgTitle,
    defaultOgDescription: form.defaultOgDescription,
    twitterCard: form.twitterCard,
    twitterSite: form.twitterSite,
    twitterCreator: form.twitterCreator,
    favicon: form.favicon,
    canonicalDomain: form.canonicalDomain,
    indexingEnabled: Boolean(form.indexingEnabled),
    robotsMode: form.robotsMode || 'allow_all',
    robotsDisallowPaths: form.robotsDisallowPaths
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
    crawlDelay: form.crawlDelay !== '' && form.crawlDelay != null ? Number(form.crawlDelay) : null,
    schemaTemplates: form.schemaTemplates || {},
    robots: {
      index: Boolean(form.robotsIndex),
      follow: Boolean(form.robotsFollow),
      ...(Object.keys(googleBot).length ? { googleBot } : {}),
    },
  };
}

export function ScoreRing({ score, label }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const color = pct >= 80 ? 'var(--ps-good)' : pct >= 50 ? 'var(--ps-warn)' : '#e07a7a';
  return (
    <div className="seo-hub__score-card">
      <div className="seo-hub__score-ring" style={{ '--score': pct, '--score-color': color }}>
        <span>{pct}</span>
      </div>
      <span className="seo-hub__score-label">{label}</span>
    </div>
  );
}

export function IssueList({ issues }) {
  if (!issues?.length) return <p className="seo-hub__empty">All checks passed.</p>;
  return (
    <ul className="seo-hub__issues">
      {issues.map((issue, index) => (
        <li
          key={issue.id ? `${issue.id}-${index}` : `issue-${index}`}
          className={`seo-hub__issue seo-hub__issue--${issue.severity}`}
        >
          <span>{issue.label}</span>
          <span className="seo-hub__issue-badge">{issue.severity}</span>
        </li>
      ))}
    </ul>
  );
}

export function SerpPreview({ title, description, url }) {
  return (
    <div className="seo-cc__serp">
      <div className="seo-cc__serp-url">{url || 'https://example.com/page'}</div>
      <div className="seo-cc__serp-title">{title || 'Page title'}</div>
      <div className="seo-cc__serp-desc">{description || 'Meta description preview…'}</div>
    </div>
  );
}

export function SocialCardPreview({ title, description, image, network }) {
  return (
    <div className={`seo-cc__social seo-cc__social--${network}`}>
      <p className="seo-cc__social-label">{network}</p>
      {image ? <div className="seo-cc__social-img" style={{ backgroundImage: `url(${image})` }} /> : null}
      <div className="seo-cc__social-body">
        <strong>{title || 'OG title'}</strong>
        <p>{description || 'Social description preview'}</p>
      </div>
    </div>
  );
}
