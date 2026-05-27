import { applyBindingsToAny, applyBindingsToString } from '../cms/cmsBindings.js';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function normalizeRobots(input) {
  const r = isPlainObject(input) ? input : {};
  const index = r.index === false ? false : true;
  const follow = r.follow === false ? false : true;
  return { index, follow };
}

export function normalizeProjectSeo(projectConfig) {
  const cfg = isPlainObject(projectConfig) ? projectConfig : {};
  const seo = isPlainObject(cfg.seo) ? cfg.seo : {};
  return {
    siteTitle: str(seo.siteTitle || cfg?.name || cfg?.title || ''),
    titleTemplate: str(seo.titleTemplate || '{{title}} | {{siteTitle}}'),
    defaultDescription: str(seo.defaultDescription || ''),
    defaultOgImage: str(seo.defaultOgImage || ''),
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
    ogTitle: str(seo.ogTitle || ''),
    ogDescription: str(seo.ogDescription || ''),
    ogImage: str(seo.ogImage || ''),
    twitterCard: str(seo.twitterCard || ''),
    canonicalUrl: str(seo.canonicalUrl || ''),
    noindex: seo.noindex === true,
    nofollow: seo.nofollow === true,
    schemaJsonLd: seo.schemaJsonLd ?? null,
    // CMS templates (optional)
    titleTemplate: str(seo.titleTemplate || ''),
    descriptionTemplate: str(seo.descriptionTemplate || ''),
    ogTitleTemplate: str(seo.ogTitleTemplate || ''),
    ogImageTemplate: str(seo.ogImageTemplate || ''),
    canonicalTemplate: str(seo.canonicalTemplate || ''),
    schemaTemplate: seo.schemaTemplate ?? null,
  };
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
 * - optional CMS bindings context ({ item, sys })
 *
 * This does NOT touch renderTree; it only computes metadata for routes.
 */
export function resolveSeoMetadata({
  projectConfig,
  pageName,
  currentPath,
  pageSeo,
  cmsContext,
}) {
  const projectSeo = normalizeProjectSeo(projectConfig);
  const seo = normalizePageSeo(pageSeo);

  const ctx = {
    title: seo.title || pageName || '',
    siteTitle: projectSeo.siteTitle || '',
    page: { title: pageName || '', slug: currentPath || '' },
    ...(isPlainObject(cmsContext) ? cmsContext : {}),
  };

  const titleFromTpl = seo.titleTemplate
    ? applyTemplate(seo.titleTemplate, ctx)
    : seo.title
      ? applyBindingsToString(seo.title, ctx)
      : projectSeo.titleTemplate
        ? applyTemplate(projectSeo.titleTemplate, { ...ctx, title: pageName || ctx.title || '' })
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

  const ogTitle =
    clampMeta(
      applyTemplate(seo.ogTitleTemplate, ctx) ||
        applyBindingsToString(seo.ogTitle || '', ctx) ||
        title,
      70
    ) || title;
  const ogDescription =
    clampMeta(
      applyTemplate(seo.descriptionTemplate, ctx) ||
        applyBindingsToString(seo.ogDescription || '', ctx) ||
        description,
      200
    ) || description;
  const ogImage =
    applyTemplate(seo.ogImageTemplate, ctx) ||
    applyBindingsToString(seo.ogImage || '', ctx) ||
    applyBindingsToString(projectSeo.defaultOgImage || '', ctx) ||
    '';

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

  const metadata = {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
      ...(canonical ? { url: canonical } : {}),
    },
    ...(seo.twitterCard
      ? {
          twitter: {
            card: seo.twitterCard,
            title: ogTitle,
            description: ogDescription,
            ...(ogImage ? { images: [ogImage] } : {}),
          },
        }
      : {}),
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

