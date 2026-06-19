'use client';

import { SEO_SCHEMA_TYPES } from '@/lib/seo/seoConstants';

export const TITLE_TARGET = { min: 15, max: 70 };
export const DESC_TARGET = { min: 50, max: 160 };

export function charCountClass(len, { min, max }) {
  if (!len) return 'seo-cc__count--empty';
  if (len < min) return 'seo-cc__count--short';
  if (len > max) return 'seo-cc__count--long';
  return 'seo-cc__count--ok';
}

export function SeoSection({ title, subtitle, children }) {
  return (
    <section className="proj-seo__section">
      <div className="proj-seo__section-head">
        <h2 className="proj-seo__section-title">{title}</h2>
        {subtitle ? <p className="proj-seo__section-sub">{subtitle}</p> : null}
      </div>
      <div className="proj-seo__section-body">{children}</div>
    </section>
  );
}

export function SeoField({
  label,
  hint,
  htmlFor,
  children,
  full,
  counter,
}) {
  return (
    <div className={`proj-seo__field${full ? ' proj-seo__field--full' : ''}`}>
      <div className="seo-cc__field-head">
        <label htmlFor={htmlFor}>{label}</label>
        {counter != null ? <span className={counter.className}>{counter.text}</span> : null}
      </div>
      {children}
      {hint ? <p className="proj-seo__hint">{hint}</p> : null}
    </div>
  );
}

export function IndexingBadge({ status }) {
  const map = {
    indexable: { label: 'Indexable', className: 'seo-cc__badge--good' },
    noindex: { label: 'noindex', className: 'seo-cc__badge--warn' },
    nofollow: { label: 'nofollow', className: 'seo-cc__badge--warn' },
    'project-blocked': { label: 'Blocked', className: 'seo-cc__badge--bad' },
  };
  const item = map[status] || { label: status || '—', className: '' };
  return <span className={`seo-cc__badge ${item.className}`}>{item.label}</span>;
}

export function ScoreBadge({ score }) {
  const n = Number(score) || 0;
  const className = n >= 80 ? 'seo-cc__badge--good' : n >= 50 ? 'seo-cc__badge--warn' : 'seo-cc__badge--bad';
  return <span className={`seo-cc__badge ${className}`}>{n}</span>;
}

export const EMPTY_PAGE_SEO = {
  title: '',
  description: '',
  keywords: '',
  secondaryKeywords: '',
  focusKeyword: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterCard: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  canonicalUrl: '',
  schemaType: '',
  schemaTemplate: '',
  schemaFieldValues: {},
  noindex: false,
  nofollow: false,
  sitemapExclude: false,
  author: '',
  publisher: '',
  breadcrumbTitle: '',
  languageOverride: '',
  countryOverride: '',
  redirectAfterPublish: '',
  customHeadTags: '',
  maxSnippet: '',
  maxImagePreview: '',
  maxVideoPreview: '',
  noarchive: false,
  nosnippet: false,
  noimageindex: false,
};

export function pageSeoFormFromApi(seo = {}) {
  const raw = seo && typeof seo === 'object' ? seo : {};
  const keywords = Array.isArray(raw.keywords) ? raw.keywords.join(', ') : raw.keywords || '';
  const secondaryKeywords = Array.isArray(raw.secondaryKeywords)
    ? raw.secondaryKeywords.join(', ')
    : raw.secondaryKeywords || '';
  const schema = raw.schemaTemplate ?? raw.schemaJsonLd ?? null;
  return {
    ...EMPTY_PAGE_SEO,
    title: raw.title || '',
    description: raw.description || '',
    keywords,
    secondaryKeywords,
    focusKeyword: raw.focusKeyword || '',
    ogTitle: raw.ogTitle || '',
    ogDescription: raw.ogDescription || '',
    ogImage: raw.ogImage || '',
    twitterCard: raw.twitterCard || '',
    twitterTitle: raw.twitterTitle || '',
    twitterDescription: raw.twitterDescription || '',
    twitterImage: raw.twitterImage || '',
    canonicalUrl: raw.canonicalUrl || '',
    schemaType: raw.schemaType || '',
    schemaFieldValues: raw.schemaFieldValues && typeof raw.schemaFieldValues === 'object' ? raw.schemaFieldValues : {},
    schemaTemplate: schema == null ? '' : typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2),
    noindex: raw.noindex === true,
    nofollow: raw.nofollow === true,
    sitemapExclude: raw.sitemapExclude === true,
    author: raw.author || '',
    publisher: raw.publisher || '',
    breadcrumbTitle: raw.breadcrumbTitle || '',
    languageOverride: raw.languageOverride || '',
    countryOverride: raw.countryOverride || '',
    redirectAfterPublish: raw.redirectAfterPublish || '',
    customHeadTags: raw.customHeadTags || '',
    maxSnippet: raw.maxSnippet ?? '',
    maxImagePreview: raw.maxImagePreview || '',
    maxVideoPreview: raw.maxVideoPreview ?? '',
    noarchive: raw.noarchive === true,
    nosnippet: raw.nosnippet === true,
    noimageindex: raw.noimageindex === true,
  };
}

export function pageSeoToPayload(form) {
  let schemaTemplate = null;
  const raw = String(form.schemaTemplate || '').trim();
  if (raw) {
    try {
      schemaTemplate = JSON.parse(raw);
    } catch {
      schemaTemplate = raw;
    }
  }
  return {
    title: form.title,
    description: form.description,
    keywords: String(form.keywords || '')
      .split(/[,;]+/)
      .map((k) => k.trim())
      .filter(Boolean),
    secondaryKeywords: String(form.secondaryKeywords || '')
      .split(/[,;]+/)
      .map((k) => k.trim())
      .filter(Boolean),
    focusKeyword: form.focusKeyword,
    ogTitle: form.ogTitle,
    ogDescription: form.ogDescription,
    ogImage: form.ogImage,
    twitterCard: form.twitterCard,
    twitterTitle: form.twitterTitle,
    twitterDescription: form.twitterDescription,
    twitterImage: form.twitterImage,
    canonicalUrl: form.canonicalUrl,
    schemaType: form.schemaType,
    schemaFieldValues: form.schemaFieldValues && typeof form.schemaFieldValues === 'object' ? form.schemaFieldValues : {},
    schemaTemplate,
    schemaJsonLd: null,
    noindex: Boolean(form.noindex),
    nofollow: Boolean(form.nofollow),
    sitemapExclude: Boolean(form.sitemapExclude),
    author: form.author,
    publisher: form.publisher,
    breadcrumbTitle: form.breadcrumbTitle,
    languageOverride: form.languageOverride,
    countryOverride: form.countryOverride,
    redirectAfterPublish: form.redirectAfterPublish,
    customHeadTags: form.customHeadTags,
    maxSnippet: form.maxSnippet === '' || form.maxSnippet == null ? null : Number(form.maxSnippet),
    maxImagePreview: form.maxImagePreview || '',
    maxVideoPreview: form.maxVideoPreview === '' || form.maxVideoPreview == null ? null : Number(form.maxVideoPreview),
    noarchive: Boolean(form.noarchive),
    nosnippet: Boolean(form.nosnippet),
    noimageindex: Boolean(form.noimageindex),
  };
}

export function SchemaTypeSelect({ value, onChange, id = 'schema-type' }) {
  return (
    <select id={id} className="seo-cc__input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Auto / none</option>
      {SEO_SCHEMA_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
