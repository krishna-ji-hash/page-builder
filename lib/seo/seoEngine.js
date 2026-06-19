import { applyBindingsToAny, applyBindingsToString } from '../cms/cmsBindings.js';
import { generateSchemaJsonLd } from './seoSchemaGenerator.js';
import { ensureAbsoluteUrl, resolveSiteOrigin } from './absoluteUrl.js';
import { enrichSchemaJsonLd } from './schemaJsonLdUtils.js';

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
    robotsMode: str(seo.robotsMode || 'allow_all'),
    robotsDisallowPaths: Array.isArray(seo.robotsDisallowPaths)
      ? seo.robotsDisallowPaths.map(String).filter(Boolean)
      : [],
    crawlDelay: seo.crawlDelay != null && seo.crawlDelay !== '' ? Number(seo.crawlDelay) : null,
    schemaTemplates: isPlainObject(seo.schemaTemplates) ? seo.schemaTemplates : {},
    indexingEnabled: seo.indexingEnabled === false ? false : true,
  };
}

export function normalizePageSeo(pageSeo) {
  const seo = isPlainObject(pageSeo) ? pageSeo : {};
  const googleBot = normalizeGoogleBot(seo.googleBot || seo.robots?.googleBot || {});
  return {
    title: str(seo.title || ''),
    description: str(seo.description || ''),
    keywords: normalizeKeywords(seo.keywords),
    secondaryKeywords: normalizeKeywords(seo.secondaryKeywords),
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
    schemaFieldValues: isPlainObject(seo.schemaFieldValues) ? seo.schemaFieldValues : {},
    titleTemplate: str(seo.titleTemplate || ''),
    descriptionTemplate: str(seo.descriptionTemplate || ''),
    ogTitleTemplate: str(seo.ogTitleTemplate || ''),
    ogImageTemplate: str(seo.ogImageTemplate || ''),
    canonicalTemplate: str(seo.canonicalTemplate || ''),
    schemaTemplate: seo.schemaTemplate ?? null,
    sitemapExclude: seo.sitemapExclude === true,
    author: str(seo.author || ''),
    publisher: str(seo.publisher || ''),
    breadcrumbTitle: str(seo.breadcrumbTitle || ''),
    languageOverride: str(seo.languageOverride || ''),
    countryOverride: str(seo.countryOverride || ''),
    redirectAfterPublish: str(seo.redirectAfterPublish || ''),
    customHeadTags: str(seo.customHeadTags || ''),
    maxSnippet: seo.maxSnippet != null && seo.maxSnippet !== '' ? Number(seo.maxSnippet) : null,
    maxImagePreview: str(seo.maxImagePreview || ''),
    maxVideoPreview: seo.maxVideoPreview != null && seo.maxVideoPreview !== '' ? Number(seo.maxVideoPreview) : null,
    noarchive: seo.noarchive === true,
    nosnippet: seo.nosnippet === true,
    noimageindex: seo.noimageindex === true,
    ...(Object.keys(googleBot).length ? { googleBot } : {}),
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
  return ensureAbsoluteUrl(resolveSiteOrigin({ canonicalDomain }), pathOrUrl);
}

function looksLikeSlugTitle(title, pageName, currentPath) {
  const primary = str(title).split('|')[0].trim();
  const t = primary || str(title).trim();
  if (!t) return true;
  const slug = str(currentPath).split('/').filter(Boolean).pop() || '';
  const page = str(pageName).trim();
  const norm = (s) => s.toLowerCase().replace(/[-_\s]+/g, '');
  if (slug && norm(t) === norm(slug)) return true;
  if (page && norm(t) === norm(page)) return true;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/i.test(t) && !/\s/.test(t)) return true;
  return false;
}

function slugToReadableTitle(slug) {
  return str(slug)
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());
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
  const pageSlugFromPath = str(currentPath).split('/').filter(Boolean).pop() || '';
  const ctx = {
    title: seo.title || item?.title || pageName || '',
    siteTitle: projectSeo.siteTitle || '',
    slug: item?.slug || pageSlugFromPath || '',
    description: '',
    url: '',
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

  const readableTitle =
    looksLikeSlugTitle(title, pageName, currentPath) && pageSlugFromPath
      ? clampMeta(
          `${slugToReadableTitle(pageSlugFromPath)}${projectSeo.siteTitle ? ` | ${projectSeo.siteTitle}` : ''}`,
          70
        )
      : title;

  const description =
    clampMeta(
      applyTemplate(seo.descriptionTemplate, ctx) ||
        applyBindingsToString(seo.description || '', ctx) ||
        applyBindingsToString(projectSeo.defaultDescription || '', ctx),
      160
    ) ||
    clampMeta(
      readableTitle
        ? `Discover ${readableTitle.split('|')[0].trim()} — ${projectSeo.siteTagline || projectSeo.siteTitle || 'shipping and logistics solutions'}.`
        : '',
      160
    );

  ctx.title = readableTitle;
  ctx.description = description;

  const siteOrigin = resolveSiteOrigin(projectSeo);

  const keywords = seo.keywords.length ? seo.keywords : projectSeo.defaultKeywords;

  const ogTitle =
    clampMeta(
      applyTemplate(seo.ogTitleTemplate, ctx) ||
        applyBindingsToString(seo.ogTitle || '', ctx) ||
        applyBindingsToString(projectSeo.defaultOgTitle || '', ctx) ||
        readableTitle,
      70
    ) || readableTitle;
  const ogDescription =
    clampMeta(
      applyTemplate(seo.descriptionTemplate, ctx) ||
        applyBindingsToString(seo.ogDescription || '', ctx) ||
        applyBindingsToString(projectSeo.defaultOgDescription || '', ctx) ||
        description,
      200
    ) || description;
  const ogImageRaw =
    applyTemplate(seo.ogImageTemplate, ctx) ||
    applyBindingsToString(seo.ogImage || '', ctx) ||
    applyBindingsToString(projectSeo.defaultOgImage || '', ctx) ||
    '';
  const ogImage = ensureAbsoluteUrl(siteOrigin, ogImageRaw);

  const twitterTitle =
    clampMeta(applyBindingsToString(seo.twitterTitle || '', ctx) || ogTitle, 70) || ogTitle;
  const twitterDescription =
    clampMeta(applyBindingsToString(seo.twitterDescription || '', ctx) || ogDescription, 200) || ogDescription;
  const twitterImage = ensureAbsoluteUrl(
    siteOrigin,
    applyBindingsToString(seo.twitterImage || '', ctx) || ogImageRaw
  );
  const twitterCard = seo.twitterCard || projectSeo.twitterCard || 'summary_large_image';

  const canonicalRaw =
    applyTemplate(seo.canonicalTemplate, ctx) ||
    applyBindingsToString(seo.canonicalUrl || '', ctx) ||
    (currentPath ? currentPath : '');
  const canonical = ensureAbsoluteCanonical(projectSeo.canonicalDomain, canonicalRaw);
  ctx.url = canonical;

  const noindex = !projectSeo.indexingEnabled || seo.noindex === true;
  const nofollow = seo.nofollow === true;

  const pageGoogleBot = { ...(projectSeo.robots.googleBot || {}) };
  if (seo.googleBot && isPlainObject(seo.googleBot)) {
    Object.assign(pageGoogleBot, seo.googleBot);
  }
  if (seo.maxImagePreview === 'large' || seo.maxImagePreview === 'standard' || seo.maxImagePreview === 'none') {
    pageGoogleBot['max-image-preview'] = seo.maxImagePreview;
  }
  if (seo.maxSnippet != null && seo.maxSnippet !== '' && !Number.isNaN(Number(seo.maxSnippet))) {
    pageGoogleBot['max-snippet'] = Number(seo.maxSnippet);
  }
  if (seo.maxVideoPreview != null && seo.maxVideoPreview !== '' && !Number.isNaN(Number(seo.maxVideoPreview))) {
    pageGoogleBot['max-video-preview'] = Number(seo.maxVideoPreview);
  }
  if (seo.noarchive) pageGoogleBot.noarchive = true;
  if (seo.nosnippet) pageGoogleBot.nosnippet = true;
  if (seo.noimageindex) pageGoogleBot.noimageindex = true;

  const robots = {
    index: !noindex && projectSeo.robots.index !== false,
    follow: !nofollow && projectSeo.robots.follow !== false,
    ...(Object.keys(pageGoogleBot).length ? { googleBot: pageGoogleBot } : {}),
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
      pageSeo: { ...seo, title: readableTitle, description },
      pageName,
      canonical,
      cmsContext,
    });
  }

  if (schemaJsonLd != null) {
    schemaJsonLd = enrichSchemaJsonLd(schemaJsonLd, {
      title: readableTitle,
      description,
      url: canonical,
      image: ogImage,
    });
  }

  const metadata = {
    title: readableTitle,
    description,
    ...(keywords.length ? { keywords } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
      ...(canonical ? { url: canonical } : {}),
      locale: seo.languageOverride || projectSeo.language || undefined,
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

  return { metadata, schemaJsonLd, customHeadTags: seo.customHeadTags || '' };
}
