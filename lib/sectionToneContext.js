/**
 * Resolve effective light/dark section tone for a node from ancestor row/column/stack paint.
 */

import { findNodeInTree } from './builderTree.js';
import { isSiteContentDarkMode } from './bodyTextNeutralization.js';
import {
  isGetInTouchSectionRow,
  isPlatformHeroPitchColumnNode,
  isPlatformHeroSectionRow,
} from './getInTouchSection.js';
import { sectionToneDataAttrForCss } from './liveSectionContrastVars.js';
import { mergeNodeStyleWithSiteTheme } from './siteDesignTheme.js';
import { getDeviceStyle, styleToCss } from './styleToCss.js';
import {
  containerPaintsDark,
  LIVE_SECTION_FG_ON_DARK,
  LIVE_SECTION_FG_ON_LIGHT,
  LIVE_SECTION_MUTED_ON_DARK,
  LIVE_SECTION_MUTED_ON_LIGHT,
  shouldApplySectionContrast,
} from './liveSectionContrastVars.js';
import {
  shouldStripNeutralDarkCssColor,
  shouldStripNeutralLightCssColor,
} from './sanitizeRichHtml.js';

function buildParentMap(nodes, parentId = null, out = new Map()) {
  for (const node of nodes || []) {
    if (!node) continue;
    out.set(String(node.id), parentId != null ? String(parentId) : null);
    if (Array.isArray(node.children) && node.children.length) {
      buildParentMap(node.children, node.id, out);
    }
  }
  return out;
}

/**
 * @param {object} node
 * @param {string} device
 * @param {object} siteTheme
 * @param {boolean} darkContentMode
 * @returns {'light'|'dark'|null}
 */
export function sectionToneForContainerNode(node, device, siteTheme, darkContentMode) {
  if (!node?.nodeType) return null;
  if (node.nodeType === 'row' && isGetInTouchSectionRow(node)) return 'dark';
  const raw = getDeviceStyle(node.style_json, device);
  const themed = mergeNodeStyleWithSiteTheme(raw, siteTheme, node.nodeType);
  const css = styleToCss(themed, siteTheme, { nodeType: node.nodeType, darkContentMode });
  const t = node.nodeType;
  if (t !== 'row' && !shouldApplySectionContrast(t, css, themed)) return null;
  return sectionToneDataAttrForCss(css)['data-section-tone'] || null;
}

/**
 * Nearest painted stack wins; otherwise nearest ancestor row tone.
 * @param {object[]} tree
 * @param {string|number} nodeId
 * @param {string} device
 * @param {object} siteTheme
 * @param {object|null} [themeTokens]
 * @returns {'light'|'dark'|null}
 */
export function resolveSectionToneForNode(tree, nodeId, device, siteTheme, themeTokens) {
  if (!Array.isArray(tree) || !tree.length || nodeId == null || nodeId === '') return null;
  const darkContentMode = isSiteContentDarkMode(siteTheme, themeTokens);
  const parents = buildParentMap(tree);
  let cur = String(nodeId);
  let rowTone = null;
  for (let i = 0; i < 80; i += 1) {
    const parentId = parents.get(cur);
    if (parentId == null) break;
    cur = parentId;
    const ancestor = findNodeInTree(tree, cur);
    if (!ancestor) continue;
    const t = ancestor.nodeType;
    if (t !== 'row' && t !== 'column' && t !== 'stack') continue;
    if (t === 'row' && isGetInTouchSectionRow(ancestor)) return 'dark';
    if ((t === 'column' || t === 'stack') && containerPaintsDark(ancestor, device, siteTheme)) {
      return 'dark';
    }
    if (t === 'column') {
      const col = findNodeInTree(tree, cur);
      if (col && isPlatformHeroPitchColumnNode(col, tree)) return 'dark';
    }
    const tone = sectionToneForContainerNode(ancestor, device, siteTheme, darkContentMode);
    if (t === 'stack' && tone) return tone;
    if (t === 'column' && tone) return tone;
    if (t === 'row' && tone) rowTone = tone;
  }
  return rowTone;
}

/**
 * Force readable inline colors for leaves inside a resolved section tone.
 * @param {Record<string, unknown>|null|undefined} css
 * @param {'light'|'dark'|null|undefined} sectionTone
 */
export function applySectionToneToLeafCss(css, sectionTone) {
  if (!css || typeof css !== 'object' || !sectionTone) return css;
  const next = { ...css };
  if (sectionTone === 'dark') {
    next.color = LIVE_SECTION_FG_ON_DARK;
    next['--node-text'] = LIVE_SECTION_FG_ON_DARK;
    return next;
  }
  const color = String(next.color || '');
  const nodeText = String(next['--node-text'] || '');
  if (shouldStripNeutralLightCssColor(color) || shouldStripNeutralLightCssColor(nodeText)) {
    return next;
  }
  const wrongForLight =
    shouldStripNeutralDarkCssColor(color) ||
    color.includes('live-section-fg') ||
    !color;
  if (wrongForLight) next.color = LIVE_SECTION_FG_ON_LIGHT;
  const ntWrongForLight =
    shouldStripNeutralDarkCssColor(nodeText) ||
    nodeText.includes('live-section-fg') ||
    !nodeText;
  if (ntWrongForLight) next['--node-text'] = LIVE_SECTION_FG_ON_LIGHT;
  return next;
}

export function sectionMutedColorForTone(sectionTone) {
  if (sectionTone === 'light') return `var(--live-section-muted, ${LIVE_SECTION_MUTED_ON_LIGHT})`;
  if (sectionTone === 'dark') return `var(--live-section-muted, ${LIVE_SECTION_MUTED_ON_DARK})`;
  return 'var(--live-section-muted, var(--color-muted))';
}
