import { applyBindingsToAny, applyBindingsToString } from '../cms/cmsBindings.js';
import { generateSchemaJsonLd } from './seoSchemaGenerator.js';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function normalizeKeywords(input) {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  const s = str(input).trim();
  if (!s) return [];
  return s.split(/[,;]+/).map((k) => k.trim()).filter(Boolean);
}

function normalizeGoogleBot(input) {
  const g = isPlainObject(input) ? input : {};
  const out = {};
  const mip = str(g['max-image-preview'] || g.maxImagePreview).trim();
  if (mip === 'large' || mip === 'standard' || mip === 'none') out['max-image-preview'] = mip;
  const ms = g['max-snippet'] ?? g.maxSnippet;
  if (ms != null && ms !== '') out['max-snippet'] = Number(ms);
  const mvp = g['max-video-preview'] ?? g.maxVideoPreview;
  if (mvp != null && mvp !== '') out['max-video-preview'] = Number(mvp);
  return out;
}

function normalizeRobots(input) {
  const r = isPlainObject(input) ? input : {};
  const index = r.index === false ? false : true;
  const follow = r.follow === false ? false : true;
  const googleBot = normalizeGoogleBot(r.googleBot || r.google);
  return {
    index,
    follow,
    ...(Object.keys(googleBot).length ? { googleBot } : {}),
  };
}

export function normalizeProjectSeo(projectConfig) {
  const cfg = isPlainObject(projectConfig) ? projectConfig : {};
  const seo = isPlainObject(cfg.seo) ? cfg.seo : {};
  return {
    siteTitle: str(seo.siteTitle || seo.siteName || cfg?.name || cfg?.title || ''),
    siteName: str(seo.siteName || seo.siteTitle || cfg?.name || ''),
    siteTagline: str(seo.siteTagline || ''),
    companyName: str(seo.companyName || ''),
    defaultAuthor: str(seo.defaultAuthor || ''),
    defaultPublisher: str(seo.defaultPublisher || ''),
    language: str(seo.language || 'en'),
    country: str(seo.country || ''),
    titleTemplate: str(seo.titleTemplate || '{{title}} | {{siteTitle}}'),
    defaultMetaTitle: str(seo.defaultMetaTitle || ''),
    defaultDescription: str(seo.defaultDescription || ''),
    defaultKeywords: normalizeKeywords(seo.defaultKeywords),
    defaultOgImage: str(seo.defaultOgImage || ''),
    defaultOgTitle: str(seo.defaultOgTitle || ''),
    defaultOgDescription: str(seo.defaultOgDescription || ''),
    twitterCard: str(seo.twitterCard || 'summary_large_image'),
    twitterSite: str(seo.twitterSite || ''),
    twitterCreator: str(seo.twitterCreator || ''),
    favicon: str(seo.favicon || ''),
    canonicalDomain: str(seo.canonicalDomain || ''),
    socialProfiles: Array.isArray(seo.socialProfiles) ? seo.socialProfiles.map(String).filter(Boolean) : [],
    robots: normalizeRobots(seo.robots),
    indexingEnabled: seo.indexingEnabled === false ? false : true,
  };
}

export function normalizePageSeo(pageSeo) {
  const seo = isPlainObject(pageSeo) ? pageSeo : {};
  return {
    title: str(seo.title || ''),
    description: str(seo.description || ''),
    keywords: normalizeKeywords(seo.keywords),
    focusKeyword: str(seo.focusKeyword || ''),
    ogTitle: str(seo.ogTitle || ''),
    ogDescription: str(seo.ogDescription || ''),
    ogImage: str(seo.ogImage || ''),
    twitterCard: str(seo.twitterCard || ''),
    twitterTitle: str(seo.twitterTitle || ''),
    twitterDescription: str(seo.twitterDescription || ''),
    twitterImage: str(seo.twitterImage || ''),
    canonicalUrl: str(seo.canonicalUrl || ''),
    noindex: seo.noindex === true,
    nofollow: seo.nofollow === true,
    schemaType: str(seo.schemaType || ''),
    schemaJsonLd: seo.schemaJsonLd ?? null,
    titleTemplate: str(seo.titleTemplate || ''),
    descriptionTemplate: str(seo.descriptionTemplate || ''),
    ogTitleTemplate: str(seo.ogTitleTemplate || ''),
    ogImageTemplate: str(seo.ogImageTemplate || ''),
    canonicalTemplate: str(seo.canonicalTemplate || ''),
    schemaTemplate: seo.schemaTemplate ?? null,
  };
}

/** CMS item-level SEO overrides (cms_items.seo_json) */
export function normalizeCmsItemSeo(itemSeo) {
  const seo = isPlainObject(itemSeo) ? itemSeo : {};
  return {
    title: str(seo.title || ''),
    description: str(seo.description || ''),
    keywords: normalizeKeywords(seo.keywords),
    focusKeyword: str(seo.focusKeyword || ''),
    canonicalUrl: str(seo.canonicalUrl || ''),
    ogImage: str(seo.ogImage || ''),
    ogTitle: str(seo.ogTitle || ''),
    ogDescription: str(seo.ogDescription || ''),
    twitterTitle: str(seo.twitterTitle || ''),
    twitterDescription: str(seo.twitterDescription || ''),
    twitterImage: str(seo.twitterImage || ''),
    schemaType: str(seo.schemaType || ''),
    noindex: seo.noindex === true,
    nofollow: seo.nofollow === true,
    schemaTemplate: seo.schemaTemplate ?? null,
    schemaJsonLd: seo.schemaJsonLd ?? null,
  };
}

function mergePageWithItemSeo(pageSeo, itemSeo) {
  if (!itemSeo) return pageSeo;
  const merged = { ...pageSeo };
  for (const [key, val] of Object.entries(itemSeo)) {
    if (val === '' || val == null) continue;
    if (Array.isArray(val) && !val.length) continue;
    merged[key] = val;
  }
  return merged;
}

function applyTemplate(tpl, ctx) {
  const s = str(tpl);
  if (!s) return '';
  return applyBindingsToString(s, ctx);
}

function clampMeta(value, maxLen) {
  const s = str(value).trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen - 1).trimEnd() : s;
}

function ensureAbsoluteCanonical(canonicalDomain, pathOrUrl) {
  const v = str(pathOrUrl).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const domain = str(canonicalDomain).trim().replace(/\/+$/, '');
  if (!domain) return v.startsWith('/') ? v : `/${v}`;
  const path = v.startsWith('/') ? v : `/${v}`;
  return `${domain}${path}`;
}

/**
 * Resolves Next.js Metadata by merging:
 * - project seo defaults (projects.config_json.seo)
 * - page seo overrides (pages.seo_json)
 * - optional CMS item seo (cms_items.seo_json) — overrides page fields
 * - optional CMS bindings context ({ item, sys })
 *
 * Page-level SEO overrides project-level SEO.
 * This does NOT touch renderTree; it only computes metadata for routes.
 */
export function resolveSeoMetadata({
  projectConfig,
  pageName,
  currentPath,
  pageSeo,
  cmsContext,
  cmsItemSeo,
}) {
  const projectSeo = normalizeProjectSeo(projectConfig);
  const itemFromContext = isPlainObject(cmsContext?.item) ? normalizeCmsItemSeo(cmsContext.item.seo) : null;
  const explicitItemSeo = cmsItemSeo ? normalizeCmsItemSeo(cmsItemSeo) : null;
  const seo = mergePageWithItemSeo(
    normalizePageSeo(pageSeo),
    explicitItemSeo || (Object.values(itemFromContext || {}).some(Boolean) ? itemFromContext : null)
  );

  const item = isPlainObject(cmsContext?.item) ? cmsContext.item : null;
  const ctx = {
    title: seo.title || item?.title || pageName || '',
    siteTitle: projectSeo.siteTitle || '',
    slug: item?.slug || '',
    category: item?.data?.category || '',
    page: { title: pageName || '', slug: currentPath || '' },
    ...(isPlainObject(cmsContext) ? cmsContext : {}),
  };

  const titleFromTpl = seo.titleTemplate
    ? applyTemplate(seo.titleTemplate, ctx)
    : seo.title
      ? applyBindingsToString(seo.title, ctx)
      : projectSeo.titleTemplate
        ? applyTemplate(projectSeo.titleTemplate, { ...ctx, title: pageName || ctx.title || '' })
        : projectSeo.defaultMetaTitle
          ? applyTemplate(projectSeo.defaultMetaTitle, ctx)
          : '';
  const title = clampMeta(
    titleFromTpl ||
      applyBindingsToString(pageName || '', ctx) ||
      applyBindingsToString(projectSeo.siteTitle || '', ctx),
    70
  );

  const description =
    clampMeta(
      applyTemplate(seo.descriptionTemplate, ctx) ||
        applyBindingsToString(seo.description || '', ctx) ||
        applyBindingsToString(projectSeo.defaultDescription || '', ctx),
      160
    ) || '';

  const keywords = seo.keywords.length ? seo.keywords : projectSeo.defaultKeywords;

  const ogTitle =
    clampMeta(
      applyTemplate(seo.ogTitleTemplate, ctx) ||
        applyBindingsToString(seo.ogTitle || '', ctx) ||
        applyBindingsToString(projectSeo.defaultOgTitle || '', ctx) ||
        title,
      70
    ) || title;
  const ogDescription =
    clampMeta(
      applyTemplate(seo.descriptionTemplate, ctx) ||
        applyBindingsToString(seo.ogDescription || '', ctx) ||
        applyBindingsToString(projectSeo.defaultOgDescription || '', ctx) ||
        description,
      200
    ) || description;
  const ogImage =
    applyTemplate(seo.ogImageTemplate, ctx) ||
    applyBindingsToString(seo.ogImage || '', ctx) ||
    applyBindingsToString(projectSeo.defaultOgImage || '', ctx) ||
    '';

  const twitterTitle =
    clampMeta(applyBindingsToString(seo.twitterTitle || '', ctx) || ogTitle, 70) || ogTitle;
  const twitterDescription =
    clampMeta(applyBindingsToString(seo.twitterDescription || '', ctx) || ogDescription, 200) || ogDescription;
  const twitterImage =
    applyBindingsToString(seo.twitterImage || '', ctx) || ogImage;
  const twitterCard = seo.twitterCard || projectSeo.twitterCard || 'summary_large_image';

  const canonicalRaw =
    applyTemplate(seo.canonicalTemplate, ctx) ||
    applyBindingsToString(seo.canonicalUrl || '', ctx) ||
    (currentPath ? currentPath : '');
  const canonical = ensureAbsoluteCanonical(projectSeo.canonicalDomain, canonicalRaw);

  const noindex = !projectSeo.indexingEnabled || seo.noindex === true;
  const nofollow = seo.nofollow === true;

  const robots = {
    index: !noindex && projectSeo.robots.index !== false,
    follow: !nofollow && projectSeo.robots.follow !== false,
    ...(projectSeo.robots.googleBot && Object.keys(projectSeo.robots.googleBot).length
      ? { googleBot: { ...projectSeo.robots.googleBot } }
      : {}),
  };

  let schemaJsonLd = seo.schemaJsonLd ?? null;
  if (seo.schemaTemplate != null) {
    const templated = applyTemplate(
      typeof seo.schemaTemplate === 'string' ? seo.schemaTemplate : JSON.stringify(seo.schemaTemplate),
      ctx
    );
    try {
      schemaJsonLd = templated ? JSON.parse(templated) : null;
    } catch {
      schemaJsonLd = null;
    }
  }
  if (schemaJsonLd != null && isPlainObject(cmsContext)) {
    schemaJsonLd = applyBindingsToAny(schemaJsonLd, ctx);
  }
  if (!schemaJsonLd && seo.schemaType) {
    schemaJsonLd = generateSchemaJsonLd({
      schemaType: seo.schemaType,
      projectSeo,
      pageSeo: seo,
      pageName,
      canonical,
      cmsContext,
    });
  }

  const metadata = {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
      ...(canonical ? { url: canonical } : {}),
      locale: projectSeo.language || undefined,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      ...(twitterImage ? { images: [twitterImage] } : {}),
      ...(projectSeo.twitterSite ? { site: projectSeo.twitterSite } : {}),
      ...(projectSeo.twitterCreator ? { creator: projectSeo.twitterCreator } : {}),
    },
    ...(projectSeo.favicon
      ? {
          icons: {
            icon: [projectSeo.favicon],
          },
        }
      : {}),
  };

  return { metadata, schemaJsonLd };
}
