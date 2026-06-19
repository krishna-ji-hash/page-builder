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

export function extractBodyText(tree) {
  const parts = [];
  walkTreeNodes(tree, (node) => {
    const type = node?.nodeType;
    if (type === 'heading' || type === 'text' || type === 'paragraph') {
      const t = str(node.props?.text).trim();
      if (t) parts.push(t);
    }
    if (type === 'rich_text' || type === 'richText') {
      const t = str(node.props?.content || node.props?.text)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (t) parts.push(t);
    }
    if (type === 'button') {
      const t = str(node.props?.label || node.props?.text).trim();
      if (t) parts.push(t);
    }
  });
  return parts.join(' ');
}

export function countWords(text) {
  return str(text).split(/\s+/).filter(Boolean).length;
}

export function keywordDensity(text, keyword) {
  const body = safeLower(text);
  const k = safeLower(keyword).trim();
  if (!body || !k) return { occurrences: 0, density: 0 };
  const words = countWords(body);
  let occurrences = 0;
  let idx = 0;
  while (idx < body.length) {
    const found = body.indexOf(k, idx);
    if (found === -1) break;
    occurrences += 1;
    idx = found + k.length;
  }
  const density = words ? Math.round((occurrences / words) * 1000) / 10 : 0;
  return { occurrences, density, wordCount: words };
}

function safeLower(v) {
  return str(v).toLowerCase();
}

function headingLevel(node) {
  const level = Number(node?.props?.level ?? node?.props?.tag?.replace?.(/\D/g, '') ?? 1);
  return Number.isFinite(level) && level >= 1 && level <= 6 ? level : 1;
}

export function analyzeHeadingHierarchy(tree) {
  const outline = [];
  let h1Count = 0;
  let lastLevel = 0;
  const skippedLevels = [];
  const longParagraphs = [];

  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'heading') {
      const level = headingLevel(node);
      if (level === 1) h1Count += 1;
      if (lastLevel && level > lastLevel + 1) {
        skippedLevels.push(`H${lastLevel}→H${level}`);
      }
      lastLevel = level;
      outline.push({ nodeId: node.id, level, text: str(node.props?.text).trim() });
    }
    if (node?.nodeType === 'text' || node?.nodeType === 'paragraph' || node?.nodeType === 'rich_text' || node?.nodeType === 'richText') {
      const raw =
        node?.nodeType === 'rich_text' || node?.nodeType === 'richText'
          ? str(node.props?.content || '').replace(/<[^>]+>/g, ' ')
          : str(node.props?.text);
      const words = countWords(raw);
      if (words > 150) longParagraphs.push({ nodeId: node.id, words });
    }
  });

  return { outline, h1Count, skippedLevels, longParagraphs };
}

export function collectImageNodes(tree) {
  const images = [];
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType !== 'image') return;
    const src = str(node.props?.src || node.props?.url);
    const alt = str(node.props?.alt).trim();
    const title = str(node.props?.title).trim();
    const w = Number(node.props?.width || node.props?.naturalWidth || 0);
    const h = Number(node.props?.height || node.props?.naturalHeight || 0);
    const large = (w > 1920 || h > 1920) || /\.(png|bmp)(\?|$)/i.test(src);
    images.push({
      id: node.id,
      name: node.displayName || 'Image',
      src,
      alt,
      title,
      large,
      width: w || null,
      height: h || null,
    });
  });
  return images;
}

function extractLinksFromHtml(html) {
  const links = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(str(html))) !== null) {
    const href = str(m[1]).trim();
    if (href.startsWith('/') && !href.startsWith('//')) links.push(href);
  }
  return links;
}

export function collectAllInternalLinks(tree) {
  const links = [];
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'menu' && Array.isArray(node.props?.items)) {
      for (const item of node.props.items) {
        const to = str(item?.to || item?.href).trim();
        if (to.startsWith('/') && !to.startsWith('//')) {
          links.push({ href: to, path: to.split('?')[0].split('#')[0], anchor: str(item?.label || item?.text) });
        }
        for (const child of item?.children || []) {
          const cto = str(child?.to || child?.href).trim();
          if (cto.startsWith('/') && !cto.startsWith('//')) {
            links.push({ href: cto, path: cto.split('?')[0].split('#')[0], anchor: str(child?.label || child?.text) });
          }
        }
      }
    }
    if (node?.nodeType === 'button') {
      const href = str(node.props?.href || node.props?.url).trim();
      if (href.startsWith('/') && !href.startsWith('//')) {
        links.push({ href, path: href.split('?')[0].split('#')[0], anchor: str(node.props?.label || node.props?.text) });
      }
    }
    if (node?.nodeType === 'rich_text' || node?.nodeType === 'richText') {
      const html = str(node.props?.content || node.props?.html);
      for (const href of extractLinksFromHtml(html)) {
        links.push({ href, path: href.split('?')[0].split('#')[0], anchor: '' });
      }
    }
  });
  return links;
}

export function collectInternalLinks(tree) {
  return collectAllInternalLinks(tree).map((l) => l.href);
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
