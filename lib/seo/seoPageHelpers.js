import { publicPagePath } from '../publicSiteUrls.js';
import { normalizePageSeo, normalizeProjectSeo, resolveSeoMetadata } from './seoEngine.js';
import { runSeoAudit } from './seoAuditEngine.js';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function walkTreeNodes(nodes, visit) {
  for (const n of nodes || []) {
    if (!n) continue;
    visit(n);
    if (Array.isArray(n.children) && n.children.length) walkTreeNodes(n.children, visit);
  }
}

export function extractFirstHeading(tree) {
  let found = '';
  walkTreeNodes(tree, (node) => {
    if (found) return;
    if (node?.nodeType === 'heading' && node?.props?.text) {
      found = str(node.props.text).trim();
    }
  });
  return found;
}

export function extractFirstParagraph(tree) {
  let found = '';
  walkTreeNodes(tree, (node) => {
    if (found) return;
    const type = node?.nodeType;
    if (type === 'text' || type === 'paragraph') {
      const t = str(node.props?.text).trim();
      if (t.length > 20) found = t;
    }
    if (type === 'rich_text' && node?.props?.content) {
      const t = str(node.props.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (t.length > 20) found = t;
    }
  });
  return found;
}

export function countMissingAlt(tree) {
  let missing = 0;
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'image' && !str(node.props?.alt).trim()) missing += 1;
  });
  return missing;
}

export function collectInternalLinks(tree) {
  const links = [];
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'menu' && Array.isArray(node.props?.items)) {
      for (const item of node.props.items) {
        const to = str(item?.to || item?.href).trim();
        if (to.startsWith('/') && !to.startsWith('//')) links.push(to);
        for (const child of item?.children || []) {
          const cto = str(child?.to || child?.href).trim();
          if (cto.startsWith('/') && !cto.startsWith('//')) links.push(cto);
        }
      }
    }
    if (node?.nodeType === 'button') {
      const href = str(node.props?.href || node.props?.url).trim();
      if (href.startsWith('/') && !href.startsWith('//')) links.push(href);
    }
  });
  return links;
}

export function scorePageSeo({ pageSeo, projectSeo, tree, pageName, links }) {
  return runSeoAudit({ pageName, pageSeo, projectSeo, tree, links }).score;
}

export function resolvedPageMetadata({ projectConfig, pageName, pageSlug, projectSlug, pageSeo }) {
  const currentPath = publicPagePath(projectSlug, pageSlug);
  const { metadata } = resolveSeoMetadata({
    projectConfig,
    pageName,
    currentPath,
    pageSeo: normalizePageSeo(pageSeo),
  });
  return metadata;
}

export function effectivePageSeoFields(pageSeo, projectConfig, pageName, pageSlug, projectSlug) {
  const metadata = resolvedPageMetadata({ projectConfig, pageName, pageSlug, projectSlug, pageSeo });
  const raw = normalizePageSeo(pageSeo && typeof pageSeo === 'object' ? pageSeo : {});
  const projectSeo = normalizeProjectSeo(projectConfig);
  return {
    title: raw.title || metadata.title || '',
    description: raw.description || metadata.description || '',
    ogImage: raw.ogImage || projectSeo.defaultOgImage || metadata.openGraph?.images?.[0]?.url || '',
    canonicalUrl:
      raw.canonicalUrl ||
      (projectSeo.canonicalDomain
        ? `${projectSeo.canonicalDomain.replace(/\/+$/, '')}${publicPagePath(projectSlug, pageSlug)}`
        : publicPagePath(projectSlug, pageSlug)),
    noindex: raw.noindex === true,
    nofollow: raw.nofollow === true,
    schemaType: raw.schemaType || '',
  };
}

export function normalizeRedirectPath(path) {
  let p = str(path).trim();
  if (!p) return '';
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.replace(/\/+$/, '');
  return p;
}
