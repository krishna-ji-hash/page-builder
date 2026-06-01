/**
 * Header / brand logo props: light + dark URLs, legacy src fallback, no DB changes.
 */

import { findAncestorRowNode, mergeNodePropsJsonPatch } from './builderTree.js';
import { isSiteContentDarkMode } from './bodyTextNeutralization.js';
import { isHeaderRowNode } from './rowLayoutMeta.js';
import { resolveSectionToneForNode } from './sectionToneContext.js';
import { normalizeSiteTheme } from './siteDesignTheme.js';

const LOGO_THEME_MODES = new Set(['light', 'dark', 'auto', 'site']);

/** True when node sits under the site header row (logo area). */
export function nodeIsInsideSiteHeader(tree, nodeId) {
  if (!Array.isArray(tree) || !tree.length || nodeId == null || nodeId === '') return false;
  const row = findAncestorRowNode(tree, nodeId);
  return isHeaderRowNode(row);
}

/** Inspector/canvas: same rules as nodeLooksLikeBrandLogo with page tree for header images. */
export function brandLogoInspectorContext(pageTree, node) {
  if (!node) return {};
  const inSiteHeader =
    Array.isArray(pageTree) && pageTree.length && node.id != null
      ? nodeIsInsideSiteHeader(pageTree, node.id)
      : false;
  return { tree: pageTree, inSiteHeader };
}

export function isBrandLogoInspectorNode(node, pageTree) {
  return nodeLooksLikeBrandLogo(node, brandLogoInspectorContext(pageTree, node));
}

export function nodeLooksLikeBrandLogo(node, opts = {}) {
  if (!node) return false;
  if (node.nodeType === 'logo_block') return true;
  if (node.nodeType !== 'image') return false;
  if (opts.inSiteHeader || (opts.tree && nodeIsInsideSiteHeader(opts.tree, node.id))) return true;
  const dn = String(node.displayName || '').toLowerCase();
  if (dn.includes('logo')) return true;
  const p = node.props || {};
  if (p.logo && typeof p.logo === 'object') return true;
  if (p.lightLogoUrl || p.darkLogoUrl || p.logoUrl || p.imageUrl) return true;
  if (String(p.src || '').trim() && (dn.includes('logo') || opts.inSiteHeader)) return true;
  if (p.meta?.brandLogo) return true;
  return false;
}

/**
 * @param {object} [props]
 * @returns {{
 *   lightLogoUrl: string,
 *   darkLogoUrl: string,
 *   alt: string,
 *   link: string,
 *   width: number|string,
 *   height: number|string,
 *   logoTheme: 'light'|'dark'|'auto',
 *   legacySrc: string,
 * }}
 */
export function normalizeBrandLogoProps(props = {}) {
  const nested = props.logo && typeof props.logo === 'object' ? props.logo : {};
  const legacySrc = String(
    props.src || props.logoUrl || props.imageUrl || nested.lightLogoUrl || props.lightLogoUrl || ''
  ).trim();
  const lightLogoUrl = String(props.lightLogoUrl || nested.lightLogoUrl || legacySrc || '').trim();
  const darkLogoUrl = String(props.darkLogoUrl || nested.darkLogoUrl || '').trim();
  const alt = String(props.logoAlt || nested.alt || props.alt || '').trim();
  const link = String(props.logoLink || nested.link || props.href || '').trim();
  const widthRaw = props.logoWidth ?? nested.width ?? props.widthPx;
  const heightRaw = props.logoHeight ?? nested.height ?? 'auto';
  let logoTheme = String(props.meta?.logoTheme || nested.logoTheme || 'auto')
    .trim()
    .toLowerCase();
  if (!LOGO_THEME_MODES.has(logoTheme)) logoTheme = 'auto';
  return {
    lightLogoUrl,
    darkLogoUrl,
    alt,
    link,
    width: widthRaw ?? 160,
    height: heightRaw ?? 'auto',
    logoTheme,
    legacySrc,
  };
}

/** @param {ReturnType<typeof normalizeBrandLogoProps>} normalized */
export function brandLogoDisplayUrls(normalized) {
  const light = String(normalized.lightLogoUrl || normalized.legacySrc || '').trim();
  const dark = String(normalized.darkLogoUrl || light || '').trim();
  const useDual = Boolean(normalized.darkLogoUrl && dark && light && dark !== light);
  return { light, dark, useDual, primary: light || dark };
}

/**
 * Pick which logo variant to show (one image only — no stacked light+dark).
 * @param {ReturnType<typeof normalizeBrandLogoProps>} normalized
 * @param {'light'|'dark'} activeTone
 */
export function pickBrandLogoSrcForTone(normalized, activeTone) {
  const { light, dark } = brandLogoDisplayUrls(normalized);
  if (activeTone === 'dark') return dark || light || '';
  return light || dark || '';
}

/**
 * @param {{
 *   normalized?: ReturnType<typeof normalizeBrandLogoProps>,
 *   siteTheme?: object,
 *   themeTokens?: object,
 *   sectionTone?: string|null,
 *   tree?: object[],
 *   nodeId?: string|number,
 *   device?: string,
 * }} ctx
 * @returns {'light'|'dark'}
 */
function resolveSiteContentTone(siteTheme, themeTokens) {
  const site = normalizeSiteTheme(siteTheme);
  if (site.presetId === 'dark') return 'dark';
  if (site.presetId === 'light') return 'light';
  if (isSiteContentDarkMode(siteTheme, themeTokens)) return 'dark';
  return 'light';
}

function resolveSurfaceTone(ctx) {
  let tone = ctx.sectionTone === 'dark' || ctx.sectionTone === 'light' ? ctx.sectionTone : null;
  if (!tone && ctx.tree?.length && ctx.nodeId != null) {
    tone = resolveSectionToneForNode(
      ctx.tree,
      ctx.nodeId,
      ctx.device || 'desktop',
      ctx.siteTheme,
      ctx.themeTokens
    );
  }
  return tone === 'dark' || tone === 'light' ? tone : null;
}

export function resolveBrandLogoActiveTone(ctx = {}) {
  const normalized = ctx.normalized || normalizeBrandLogoProps({});
  const forced = normalized.logoTheme;
  if (forced === 'light') return 'light';
  if (forced === 'dark') return 'dark';

  const siteTone = resolveSiteContentTone(ctx.siteTheme, ctx.themeTokens);
  if (forced === 'site') return siteTone;

  const surfaceTone = resolveSurfaceTone(ctx);
  const { useDual } = brandLogoDisplayUrls(normalized);

  // Header + both assets: default auto follows site preset so light/dark site toggles swap logos.
  if (useDual && ctx.inSiteHeader && forced === 'auto') {
    return siteTone;
  }

  if (surfaceTone === 'dark') return 'dark';
  if (surfaceTone === 'light') return 'light';

  return siteTone;
}

/** Keep one brand logo image per header logo stack (fixes duplicate stacked logos). */
export function dedupeBrandLogoChildrenInStack(stackNode) {
  if (!stackNode || stackNode.nodeType !== 'stack') return stackNode;
  const name = String(stackNode.displayName || '').toLowerCase();
  const isLogoStack =
    name.includes('logo') ||
    (stackNode.children || []).some((ch) => nodeLooksLikeBrandLogo(ch));
  if (!isLogoStack) return stackNode;

  let keptLogo = false;
  const children = (stackNode.children || []).filter((ch) => {
    if (!nodeLooksLikeBrandLogo(ch)) return true;
    if (keptLogo) return false;
    keptLogo = true;
    return true;
  });
  if (children.length === (stackNode.children || []).length) return stackNode;
  return { ...stackNode, children };
}

export function repairBrandLogosInTree(nodes) {
  if (!Array.isArray(nodes)) return [];
  const walk = (node) => {
    if (!node) return node;
    let next = { ...node, children: (node.children || []).map(walk) };
    if (next.nodeType === 'stack') {
      next = dedupeBrandLogoChildrenInStack(next);
    }
    return next;
  };
  return nodes.map(walk);
}

export function brandLogoHasRenderableUrl(normalized) {
  return Boolean(brandLogoDisplayUrls(normalized).primary);
}

export function parseBrandLogoWidthPx(width, fallback = 160) {
  const n = Number(width);
  if (Number.isFinite(n) && n > 0) return Math.max(48, Math.min(400, Math.round(n)));
  const px = parseFloat(String(width || ''));
  if (Number.isFinite(px) && px > 0) return Math.max(48, Math.min(400, Math.round(px)));
  return fallback;
}

export function brandLogoFormFields(props = {}) {
  const n = normalizeBrandLogoProps(props);
  return {
    lightLogoUrl: n.lightLogoUrl,
    darkLogoUrl: n.darkLogoUrl,
    logoAlt: n.alt,
    logoLink: n.link,
    logoWidth: parseBrandLogoWidthPx(n.width, 160),
    logoHeight: n.height === 'auto' || n.height === '' ? 'auto' : n.height,
    logoTheme: n.logoTheme,
  };
}

/** Build props patch for persistence (logo object + legacy fields). */
export function buildBrandLogoPropsPatch(normalized) {
  const light = String(normalized.lightLogoUrl || normalized.legacySrc || '').trim();
  const dark = String(normalized.darkLogoUrl || '').trim();
  const alt = normalized.alt || '';
  const link = normalized.link || '';
  const widthPx = parseBrandLogoWidthPx(normalized.width, 160);
  const logo = {
    lightLogoUrl: light,
    darkLogoUrl: dark,
    alt,
    link,
    width: normalized.width ?? widthPx,
    height: normalized.height ?? 'auto',
    logoTheme: normalized.logoTheme,
  };
  return {
    logo,
    lightLogoUrl: light,
    darkLogoUrl: dark,
    logoAlt: alt,
    logoLink: link,
    logoWidth: logo.width,
    logoHeight: logo.height,
    src: light,
    alt,
    href: link,
    widthPx,
    meta: {
      ...(typeof normalized._meta === 'object' && normalized._meta ? normalized._meta : {}),
      logoTheme: normalized.logoTheme,
      brandLogo: true,
    },
  };
}

const FORM_TO_FIELD = {
  lightLogoUrl: 'lightLogoUrl',
  darkLogoUrl: 'darkLogoUrl',
  logoAlt: 'alt',
  logoLink: 'link',
  logoWidth: 'width',
  logoHeight: 'height',
  logoTheme: 'logoTheme',
};

/**
 * @param {string} key — inspector form key
 * @param {*} value
 * @param {object} existingProps
 */
/**
 * One-shot patch when picking/uploading light or dark logo via media library (avoids racing dual onChange).
 * @param {'light'|'dark'} slot
 * @param {string} publicUrl
 * @param {object} existingProps
 * @param {{ altText?: string }} [opts]
 */
export function applyBrandLogoSlotPatch(slot, publicUrl, existingProps = {}, opts = {}) {
  const formKey = slot === 'dark' ? 'darkLogoUrl' : 'lightLogoUrl';
  const url = String(publicUrl || '').trim();
  const mergedBase = mergeNodePropsJsonPatch(existingProps, { [formKey]: url });
  const cur = normalizeBrandLogoProps(mergedBase);
  if (opts.altText && !cur.alt) cur.alt = String(opts.altText).trim();
  cur._meta = existingProps.meta || {};
  return buildBrandLogoPropsPatch(cur);
}

export function brandLogoPropsPatchFromFormKey(key, value, existingProps = {}) {
  const cur = normalizeBrandLogoProps(existingProps);
  const field = FORM_TO_FIELD[key];
  if (!field) return null;
  const next = { ...cur, _meta: existingProps.meta || {} };
  if (field === 'width') {
    next.width = Math.max(48, Math.min(400, Number(value) || parseBrandLogoWidthPx(value, 160)));
  } else if (field === 'logoTheme') {
    const v = String(value || 'auto').trim().toLowerCase();
    next.logoTheme = LOGO_THEME_MODES.has(v) ? v : 'auto';
  } else {
    next[field] = value;
  }
  return buildBrandLogoPropsPatch(next);
}
