import { findNodeInTree } from './builderTree.js';
import {
  containerPaintsDark,
  liveSectionContrastPair,
  sectionToneDataAttrForCss,
} from './liveSectionContrastVars.js';

/** @param {object | null | undefined} node */
export function isGetInTouchSectionRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.props?.meta;
  if (meta && typeof meta === 'object' && meta.sectionTemplate === 'getInTouch') return true;
  const name = String(node.displayName || '').toLowerCase();
  return name.includes('get in touch');
}

/** @param {object | null | undefined} node */
export function isPlatformHeroSectionRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.props?.meta;
  if (meta && typeof meta === 'object' && meta.sectionTemplate === 'platformHero') return true;
  const name = String(node.displayName || '').toLowerCase();
  return (
    name.includes('platform hero') ||
    name.includes('platform for every') ||
    name.includes('one platform')
  );
}

/**
 * @param {object | null | undefined} node
 * @param {object[]|null|undefined} [tree]
 */
export function isPlatformHeroPitchColumnNode(node, tree) {
  if (!node || node.nodeType !== 'column') return false;
  const row = findParentRowForNode(tree, node.id);
  if (!isPlatformHeroSectionRow(row)) return false;
  const first = row?.children?.[0];
  return first != null && String(first.id) === String(node.id);
}

function buildParentMap(nodes, parentId = null, out = new Map()) {
  for (const n of nodes || []) {
    if (!n) continue;
    out.set(String(n.id), parentId != null ? String(parentId) : null);
    if (Array.isArray(n.children) && n.children.length) {
      buildParentMap(n.children, n.id, out);
    }
  }
  return out;
}

/** @param {object[]} tree
 * @param {string|number} nodeId */
export function findParentRowForNode(tree, nodeId) {
  if (!Array.isArray(tree) || !tree.length || nodeId == null || nodeId === '') return null;
  const parents = buildParentMap(tree);
  let cur = String(nodeId);
  for (let i = 0; i < 80; i += 1) {
    const parentId = parents.get(cur);
    if (parentId == null) break;
    cur = parentId;
    const ancestor = findNodeInTree(tree, cur);
    if (ancestor?.nodeType === 'row') return ancestor;
  }
  return null;
}

/** @param {object | null | undefined} node */
export function isTimelineSectionRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.props?.meta;
  if (meta && typeof meta === 'object' && meta.sectionTemplate === 'timeline') return true;
  const name = String(node.displayName || '').toLowerCase();
  if (name.includes('timeline')) return true;
  const walk = (n) => {
    for (const c of n?.children || []) {
      if (String(c?.props?.meta?.tplRole || '') === 'timeline-step') return true;
      if (walk(c)) return true;
    }
    return false;
  };
  return walk(node);
}

/** @param {object | null | undefined} node */
export function sectionTemplateDataAttrsForRow(node) {
  if (!node || node.nodeType !== 'row') return {};
  const tpl = node.props?.meta?.sectionTemplate;
  if (tpl) {
    const attrs = { 'data-section-template': String(tpl) };
    if (tpl === 'timeline' || node.props?.meta?.tplPolish) {
      attrs['data-tpl-polish'] = 'true';
    }
    return attrs;
  }
  if (isGetInTouchSectionRow(node)) return { 'data-section-template': 'getInTouch' };
  if (isPlatformHeroSectionRow(node)) return { 'data-section-template': 'platformHero' };
  if (isTimelineSectionRow(node)) {
    return { 'data-section-template': 'timeline', 'data-tpl-polish': 'true' };
  }
  return {};
}

/**
 * Merge contrast CSS vars + data-section-tone for template rows/columns that must stay readable in light site mode.
 * @param {object} node
 * @param {Record<string, unknown>|null|undefined} css
 * @param {{ sectionTemplateId?: string, rowChildColumnIndex?: number, tree?: object[], device?: string, siteTheme?: object }} [ctx]
 */
export function applyTemplateSectionContrast(node, css, ctx = {}) {
  if (!css || typeof css !== 'object') return { css, toneAttrs: {} };
  const device = ctx.device || 'desktop';
  const siteTheme = ctx.siteTheme || null;
  let next = css;
  let toneAttrs = sectionToneDataAttrForCss(next);

  if (node.nodeType === 'row' && isGetInTouchSectionRow(node)) {
    next = { ...next, ...liveSectionContrastPair(false) };
    toneAttrs = { 'data-section-tone': 'dark', 'data-dark-surface': 'true' };
    return { css: next, toneAttrs };
  }

  const parentRow =
    node.nodeType === 'column' && ctx.tree?.length ? findParentRowForNode(ctx.tree, node.id) : null;
  const isHeroDarkCol =
    node.nodeType === 'column' &&
    isPlatformHeroSectionRow(parentRow) &&
    containerPaintsDark(node, device, siteTheme);
  const isPitchCol =
    node.nodeType === 'column' &&
    (isPlatformHeroPitchColumnNode(node, ctx.tree) ||
      isHeroDarkCol ||
      (ctx.sectionTemplateId === 'platformHero' && ctx.rowChildColumnIndex === 0));

  if (
    isPitchCol ||
    ((node.nodeType === 'column' || node.nodeType === 'stack') &&
      containerPaintsDark(node, device, siteTheme))
  ) {
    next = { ...next, ...liveSectionContrastPair(false) };
    toneAttrs = { 'data-section-tone': 'dark', 'data-dark-surface': 'true' };
    return { css: next, toneAttrs };
  }

  return { css: next, toneAttrs };
}
