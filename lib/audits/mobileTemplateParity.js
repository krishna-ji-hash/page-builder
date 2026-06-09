/**
 * Mobile parity validation for generated section templates.
 * Uses style_json + responsive defaults only (no DOM / no renderTree mutation).
 */
import { applyResponsiveDefaultsToTree } from '../applyPageResponsiveDefaults.js';
import { ensureResponsiveLayoutStyleJson } from '../styleNormalizer.js';
import { isFooterRowNode, isHeaderRowNode } from '../rowLayoutMeta.js';
import { PDP_WEBSITE_WIDGETS } from '../pdpElementRegistry.js';
import { PARITY_SURFACE_SELECTOR } from '../paritySurface.js';

/** User-facing template groups for mobile parity reporting. */
export const MOBILE_PARITY_TEMPLATE_GROUPS = {
  header: ['headerSpread', 'headerBoxed', 'headerCentered'],
  hero: ['hero', 'platformHero', 'splitHeroCarousel', 'tabHero'],
  features: ['features', 'featureTabs', 'whyChooseCourier', 'courierFeatureBands', 'benefits'],
  cards: ['cards'],
  pricing: ['pricing'],
  faq: ['faq'],
  forms: ['contactForm', 'getInTouch'],
  footer: ['footer'],
  carousel: ['splitHeroCarousel', 'brandsLogoSlider'],
  getInTouch: ['getInTouch'],
  pdp: Object.keys(PDP_WEBSITE_WIDGETS),
};

export const MOBILE_PARITY_SURFACES = ['builder-mobile-artboard', 'draft-preview-mobile', 'published-live-mobile'];

function walkNodes(nodes, visit, parent = null) {
  for (const n of nodes || []) {
    if (!n) continue;
    visit(n, parent);
    if (Array.isArray(n.children) && n.children.length) walkNodes(n.children, visit, n);
  }
}

function parsePx(v) {
  const n = parseFloat(String(v || '').replace(/px/gi, '').trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeTemplateTree(roots) {
  const withResponsive = applyResponsiveDefaultsToTree(roots, { mobile: true, tablet: true });
  walkNodes(withResponsive, (node) => {
    const rowMeta = node.props?.meta || null;
    node.style_json = ensureResponsiveLayoutStyleJson(
      node.style_json || node.props?.style_json || {},
      node.nodeType,
      null,
      rowMeta
    );
  });
  return withResponsive;
}

function checkRowMobileStack(node, issues, templateId) {
  if (node.nodeType !== 'row') return;
  const isHeader = isHeaderRowNode(node);
  const isFooter = isFooterRowNode(node);
  const mobileDir = node.style_json?.mobile?.layout?.flexDirection;
  if (isHeader) {
    if (mobileDir && mobileDir !== 'row') {
      issues.push({
        templateId,
        nodeType: 'row',
        displayName: node.displayName,
        code: 'header-mobile-not-compact',
        severity: 'critical',
        message: 'Header row should stay horizontal on mobile (logo | menu | actions)',
      });
    }
    return;
  }
  if (!mobileDir || mobileDir === 'row') {
    issues.push({
      templateId,
      nodeType: 'row',
      displayName: node.displayName,
      code: 'row-mobile-not-stacked',
      severity: isFooter ? 'warning' : 'critical',
      message: `Row "${node.displayName || 'row'}" missing mobile column stack`,
    });
  }
}

function checkColumnMobileWidth(node, issues, templateId, parentRow) {
  if (node.nodeType !== 'column') return;
  if (parentRow && isHeaderRowNode(parentRow)) return;
  const w = node.style_json?.mobile?.size?.width;
  if (w !== '100%') {
    issues.push({
      templateId,
      nodeType: 'column',
      displayName: node.displayName,
      code: 'column-mobile-width',
      severity: 'warning',
      message: `Column "${node.displayName || 'column'}" missing mobile width 100%`,
    });
  }
}

function checkHorizontalStack(node, issues, templateId) {
  if (node.nodeType !== 'stack') return;
  const desktop = node.style_json?.desktop?.layout || {};
  const mobile = node.style_json?.mobile?.layout || {};
  const dir = desktop.flexDirection || 'column';
  const wrap = desktop.flexWrap || 'wrap';
  const kids = node.children || [];
  if (kids.length < 2) return;
  if (dir !== 'row' && dir !== 'row-reverse') return;
  const mobileDir = mobile.flexDirection;
  if (wrap === 'nowrap' && mobileDir !== 'column' && kids.length > 1) {
    issues.push({
      templateId,
      nodeType: 'stack',
      displayName: node.displayName,
      code: 'stack-nowrap-mobile',
      severity: 'warning',
      message: `Horizontal nowrap stack "${node.displayName || 'stack'}" may overflow on mobile`,
    });
  }
}

function checkCarouselMobile(node, issues, templateId) {
  if (node.nodeType !== 'carousel') return;
  const spv = node.props?.slidesPerView;
  const perView = node.props?.settings?.perView;
  const mobile =
    (spv && typeof spv === 'object' ? spv.mobile : null) ??
    (perView && typeof perView === 'object' ? perView.mobile : null);
  if (mobile != null && Number(mobile) > 1) {
    issues.push({
      templateId,
      nodeType: 'carousel',
      displayName: node.displayName,
      code: 'carousel-mobile-perview',
      severity: 'critical',
      message: `Carousel "${node.displayName || 'carousel'}" shows ${mobile} slides on mobile`,
    });
  }
}

function checkLargeTypeMobile(node, issues, templateId) {
  if (node.nodeType !== 'heading') return;
  const fs = parsePx(node.style_json?.desktop?.typography?.fontSize);
  if (fs == null || fs < 40) return;
  const mfs = parsePx(node.style_json?.mobile?.typography?.fontSize);
  if (mfs == null || mfs >= fs) {
    issues.push({
      templateId,
      nodeType: 'heading',
      displayName: node.displayName,
      code: 'heading-mobile-type',
      severity: 'suggestion',
      message: `Large heading "${node.displayName || 'heading'}" (${fs}px) lacks mobile downscale`,
    });
  }
}

function checkSectionLayoutMobileStack(node, issues, templateId) {
  if (node.nodeType !== 'row') return;
  const tpl = node.props?.meta?.sectionTemplate;
  if (!tpl) return;
  const layout = node.props?.meta?.sectionLayout;
  if (layout && layout.mobileStack === false) {
    const cols = (node.children || []).filter((c) => c?.nodeType === 'column').length;
    if (cols > 1) {
      issues.push({
        templateId,
        nodeType: 'row',
        displayName: node.displayName,
        code: 'section-layout-no-mobile-stack',
        severity: 'warning',
        message: `Section "${tpl}" has mobileStack:false with ${cols} columns`,
      });
    }
  }
}

function validateTemplateRoots(templateId, roots) {
  const issues = [];
  if (!Array.isArray(roots) || !roots.length) {
    return [{ templateId, code: 'template-missing', severity: 'critical', message: 'Template has no roots' }];
  }
  const tree = normalizeTemplateTree(roots);
  walkNodes(tree, (node, parent) => {
    const parentRow = parent?.nodeType === 'row' ? parent : null;
    checkRowMobileStack(node, issues, templateId);
    checkColumnMobileWidth(node, issues, templateId, parentRow);
    checkHorizontalStack(node, issues, templateId);
    checkCarouselMobile(node, issues, templateId);
    checkLargeTypeMobile(node, issues, templateId);
    checkSectionLayoutMobileStack(node, issues, templateId);
  });
  return issues;
}

export function validateSectionTemplateMobileParity(templateId, templates = {}) {
  const roots = templates[templateId];
  if (!roots) {
    return {
      templateId,
      ok: false,
      issues: [{ templateId, code: 'template-not-found', severity: 'critical', message: `SECTION_TEMPLATES missing "${templateId}"` }],
    };
  }
  const issues = validateTemplateRoots(templateId, roots);
  return { templateId, ok: issues.length === 0, issues };
}

export function validateAllSectionTemplatesMobileParity(templateIds = null) {
  const ids = templateIds || Object.keys(SECTION_TEMPLATES);
  const results = ids.map((id) => validateSectionTemplateMobileParity(id));
  const broken = results.filter((r) => !r.ok);
  return { results, broken, total: results.length, brokenCount: broken.length };
}

export function validateMobileParityGroups(templates = {}) {
  const report = {};
  for (const [group, ids] of Object.entries(MOBILE_PARITY_TEMPLATE_GROUPS)) {
    if (group === 'pdp') {
      report[group] = validatePdpWidgetMobileDefaults();
      continue;
    }
    const results = ids.map((id) => validateSectionTemplateMobileParity(id, templates));
    report[group] = {
      ids,
      broken: results.filter((r) => !r.ok),
      results,
    };
  }
  return report;
}

export function validatePdpWidgetMobileDefaults() {
  const issues = [];
  for (const [id, def] of Object.entries(PDP_WEBSITE_WIDGETS)) {
    const style = def.defaultStyle_json || {};
    const normalized = ensureResponsiveLayoutStyleJson(style, id, null, null);
    const w = normalized?.mobile?.size?.width || normalized?.mobile?.layout?.width;
    if (w !== '100%') {
      issues.push({
        templateId: id,
        code: 'pdp-mobile-width',
        severity: 'warning',
        message: `PDP widget "${id}" missing mobile width 100% default`,
      });
    }
  }
  return { ids: Object.keys(PDP_WEBSITE_WIDGETS), broken: issues, results: issues };
}

/** CSS files that must use parity surface for template mobile rules. */
export function auditTemplateMobileCssParity(cssText, filePath = '') {
  const hits = [];
  const lines = String(cssText || '').split(/\r?\n/);
  const mobileBlock = /@media\s*\(\s*max-width:\s*767px\s*\)/i;
  let inMobile = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (mobileBlock.test(line)) inMobile = true;
    if (inMobile && /^\s*\}\s*$/.test(line) && line.trim() === '}') {
      // naive block end — good enough for audit heuristics
    }
    if (/data-section-template=/.test(line) && !line.includes(PARITY_SURFACE_SELECTOR) && !line.includes(':is(.live-doc')) {
      if (/overflow-x:\s*hidden/i.test(line)) {
        hits.push({ file: filePath, line: i + 1, kind: 'overflow-hidden-hack', text: line.trim() });
      }
    }
  }
  return hits;
}

export function summarizeMobileParityReport(groupReport) {
  const brokenSections = [];
  const allIssues = [];
  for (const [group, data] of Object.entries(groupReport)) {
    const broken = data.broken || [];
    if (broken.length) {
      brokenSections.push({ group, count: broken.length, items: broken });
    }
    if (Array.isArray(data.results)) {
      for (const r of data.results) {
        if (r.issues?.length) allIssues.push(...r.issues.map((issue) => ({ ...issue, group })));
      }
    } else if (Array.isArray(broken)) {
      allIssues.push(...broken.map((issue) => ({ ...issue, group })));
    }
  }
  return { brokenSections, allIssues, issueCount: allIssues.length };
}
