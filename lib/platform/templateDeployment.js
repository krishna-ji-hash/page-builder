import { SECTION_TEMPLATES, flattenTemplateToBulkNodes } from '../sectionTemplates.js';
import { normalizeSiteTheme, SITE_THEME_PRESETS } from '../siteDesignTheme.js';
import {
  alignThemeTokensWithSiteTheme,
  createModePalettesFromFlat,
  DEFAULT_THEME_TOKENS,
  normalizeThemeTokens,
} from '../themeTokens.js';
import { normalizeProjectSeo } from '../seo/seoEngine.js';
import { normalizeStylePresets } from '../stylePresetsStore.js';
import { normalizeAnimationPresets } from '../animationPresetsStore.js';
import { getIndustryBlueprint } from './industryBlueprint.js';

function cloneSectionNode(node, keyPrefix, role, isRoot = true) {
  const base = {
    ...node,
    id: `${keyPrefix}-${node.id ?? role}`,
    parentNodeId: null,
    children: Array.isArray(node.children)
      ? node.children.map((child) => ({
          ...cloneSectionNode(child, keyPrefix, role, false),
          parentNodeId: `${keyPrefix}-${node.id ?? role}`,
        }))
      : [],
  };
  if (base.nodeType !== 'row' || !isRoot) return base;
  const metaPatch =
    role === 'header' ? { isHeader: true } : role === 'footer' ? { isFooter: true } : {};
  if (!Object.keys(metaPatch).length) return base;
  const prevProps = base.props && typeof base.props === 'object' ? base.props : {};
  const prevMeta = prevProps.meta && typeof prevProps.meta === 'object' ? prevProps.meta : {};
  return {
    ...base,
    props: { ...prevProps, meta: { ...prevMeta, ...metaPatch } },
  };
}

export function buildProjectConfigFromWizard({ name, slug, themeId, industryId }) {
  const siteThemePreset =
    themeId === 'dark' ? SITE_THEME_PRESETS.dark : SITE_THEME_PRESETS.light;
  const siteTheme = normalizeSiteTheme({
    ...siteThemePreset,
    presetId: themeId === 'custom' ? 'custom' : siteThemePreset.presetId,
  });
  const flatTokens = { ...DEFAULT_THEME_TOKENS, mode: themeId === 'dark' ? 'dark' : 'light' };
  const themeTokens = normalizeThemeTokens({
    ...flatTokens,
    ...createModePalettesFromFlat(flatTokens),
  });
  const alignedTokens = alignThemeTokensWithSiteTheme(siteTheme, themeTokens);

  const seo = normalizeProjectSeo({
    name,
    seo: {
      siteTitle: name,
      titleTemplate: '{{title}} | {{siteTitle}}',
      defaultDescription: `${name} — built with Builder`,
      canonicalDomain: '',
      indexingEnabled: true,
    },
  });

  const headerRoots = SECTION_TEMPLATES.headerSpread || SECTION_TEMPLATES.header;
  const footerRoots = SECTION_TEMPLATES.footer;
  const globalSections = {};
  if (headerRoots?.[0]) {
    globalSections.header = cloneSectionNode(headerRoots[0], 'wizard-header', 'header');
  }
  if (footerRoots?.[0]) {
    globalSections.footer = cloneSectionNode(footerRoots[0], 'wizard-footer', 'footer');
  }

  const blueprint = getIndustryBlueprint(industryId);
  const stylePresets = normalizeStylePresets({});
  const animationPresets = normalizeAnimationPresets({});

  return {
    siteTheme,
    themeTokens: alignedTokens,
    seo: { ...seo, canonicalDomain: seo.canonicalDomain || '' },
    globalSections,
    stylePresets,
    animationPresets,
    wizardMeta: {
      industryId,
      themeId,
      templateId: blueprint.defaultTemplateId,
      provisionedAt: new Date().toISOString(),
    },
  };
}

export function resolveSectionTemplateRoots(sectionKey) {
  const roots = SECTION_TEMPLATES[sectionKey];
  if (!roots?.length) return [];
  return roots;
}

/**
 * Flatten blueprint page sections into bulk-create rows.
 * @param {string[]} sectionKeys
 */
export function buildBulkNodesForPageSections(sectionKeys) {
  const allRoots = [];
  for (const key of sectionKeys || []) {
    const roots = resolveSectionTemplateRoots(key);
    if (roots.length) allRoots.push(...roots);
  }
  if (!allRoots.length) return [];
  return flattenTemplateToBulkNodes(allRoots, 0);
}

/**
 * Default page SEO for wizard-provisioned pages.
 */
export function buildPageSeoDefaults({ projectName, pageTitle, pageSlug }) {
  return {
    title: pageTitle,
    description: `${pageTitle} — ${projectName}`,
    ogTitle: pageTitle,
    ogDescription: `${pageTitle} on ${projectName}`,
    canonicalUrl: `/${pageSlug}`,
  };
}
