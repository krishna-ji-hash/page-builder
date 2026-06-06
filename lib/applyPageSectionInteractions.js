/**
 * Apply interaction template (animation / parallax) to all root page sections.
 */

import { isRootPageRow } from './liveDocSectionSpacing.js';
import { normalizeAnimationPreset } from './interactionAnimations.js';
import { interactionsForForm, pruneInteractions } from './interactionInspectorUtils.js';
import { normalizeResponsiveStyle } from './styleNormalizer.js';
import { DEFAULT_SITE_THEME } from './siteDesignTheme.js';

function deviceInteractionsFromStyleJson(styleJson, device, nodeType, siteTheme) {
  const normalized = normalizeResponsiveStyle(styleJson || {}, { nodeType, siteTheme });
  if (device === 'desktop') return interactionsForForm(normalized.desktop?.interactions);
  const desktop = normalized.desktop || {};
  const override = normalized[device] || {};
  return interactionsForForm({
    ...desktop?.interactions,
    ...override?.interactions,
  });
}

/** Build animation (+ optional parallax) template from inspector interactions. */
export function interactionTemplateFromSourceInteractions(sourceIx, { includeParallax = true } = {}) {
  const ix = interactionsForForm(sourceIx || {});
  const template = {};
  const preset = normalizeAnimationPreset(ix.animation?.preset);
  if (preset && preset !== 'none') {
    template.animation = { ...ix.animation, preset };
  }
  if (includeParallax && ix.parallax?.enabled) {
    template.parallax = { ...ix.parallax };
  }
  return pruneInteractions(template);
}

export function mergeInteractionTemplateIntoExisting(existingIx, templateIx) {
  const base = interactionsForForm(existingIx || {});
  const template = interactionsForForm(templateIx || {});
  return pruneInteractions({
    ...base,
    ...(template.animation ? { animation: { ...template.animation } } : {}),
    ...(template.parallax ? { parallax: { ...template.parallax } } : {}),
  });
}

export function countRootPageSections(tree) {
  if (!Array.isArray(tree)) return 0;
  return tree.filter((n) => n?.nodeType === 'row' && isRootPageRow(tree, n)).length;
}

/** @returns {{ nodeId: number, mergedInteractions: object }[]} */
export function planPageSectionInteractionUpdates(tree, templateIx, { device = 'desktop', siteTheme = DEFAULT_SITE_THEME } = {}) {
  if (!Array.isArray(tree) || !templateIx || !Object.keys(templateIx).length) return [];
  const planned = [];
  for (const node of tree) {
    if (!node?.nodeType || node.nodeType !== 'row' || !isRootPageRow(tree, node)) continue;
    const nodeId = Number(node.id);
    if (!Number.isInteger(nodeId) || nodeId <= 0) continue;
    const existing = deviceInteractionsFromStyleJson(node.style_json, device, 'row', siteTheme);
    planned.push({
      nodeId,
      mergedInteractions: mergeInteractionTemplateIntoExisting(existing, templateIx),
    });
  }
  return planned;
}
