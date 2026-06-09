/**
 * Stats Counter section — layout edits target the stats_counter widget, not the outer row.
 */
import { normalizeResponsiveStyle } from '@/lib/styleNormalizer';
import { getDeviceStyle } from '@/lib/styleToCss';
import {
  applySectionLayoutToStyleJson,
  normalizeSectionLayout,
  sectionLayoutGapPx,
} from '@/lib/sectionLayout.js';

export const STATS_LAYOUT_FORM_KEYS = new Set([
  'layoutDirection',
  'layoutFlexWrap',
  'layoutGapPx',
  'layoutGapScale',
  'layoutAlign',
  'layoutJustify',
  'layoutAlignContent',
]);

export function isStatsSectionRow(node) {
  return node?.nodeType === 'row' && node?.props?.meta?.sectionTemplate === 'stats';
}

/**
 * @param {unknown[]} nodes
 * @param {string|number} sectionRowId
 */
export function findStatsContentStack(nodes, sectionRowId) {
  let found = null;
  const walk = (list, inside) => {
    for (const n of list || []) {
      if (!n || typeof n !== 'object') continue;
      const inSection = inside || String(n.id) === String(sectionRowId);
      if (
        inSection &&
        n.nodeType === 'stack' &&
        String(n.props?.meta?.tplRole || '').trim() === 'stats-content-stack'
      ) {
        found = n;
        return;
      }
      if (Array.isArray(n.children) && n.children.length) walk(n.children, inSection);
      if (found) return;
    }
  };
  walk(nodes, false);
  return found;
}

export function findStatsCounterNode(nodes, sectionRowId) {
  let found = null;
  const walk = (list, inside) => {
    for (const n of list || []) {
      if (!n || typeof n !== 'object') continue;
      const inSection = inside || String(n.id) === String(sectionRowId);
      if (inSection && n.nodeType === 'stats_counter') {
        found = n;
        return;
      }
      if (Array.isArray(n.children) && n.children.length) walk(n.children, inSection);
      if (found) return;
    }
  };
  walk(nodes, false);
  return found;
}

/**
 * Node that should receive flex layout edits (gap, justify, wrap, direction).
 * @param {unknown[]} pageTree
 * @param {object|null|undefined} selectedNode
 */
export function resolveStatsLayoutEditTarget(pageTree, selectedNode) {
  if (!selectedNode || !Array.isArray(pageTree)) return null;
  if (selectedNode.nodeType === 'stats_counter') return selectedNode;
  if (isStatsSectionRow(selectedNode)) {
    return findStatsCounterNode(pageTree, selectedNode.id);
  }
  return null;
}

function parseGapPx(gapValue) {
  if (typeof gapValue === 'number' && Number.isFinite(gapValue)) return Math.max(0, Math.round(gapValue));
  const raw = String(gapValue ?? '').trim();
  const n = Number.parseFloat(raw.replace('px', ''));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
}

/**
 * @param {object} statsNode
 * @param {string} device
 * @param {Record<string, unknown>} layoutPatch
 * @param {object|null|undefined} siteTheme
 */
function mergeStatsCounterLayoutStyle(statsNode, device, layoutPatch, siteTheme) {
  const normalized = normalizeResponsiveStyle(statsNode.style_json || {}, {
    nodeType: 'stats_counter',
    siteTheme,
  });
  const desktopBase = normalized.desktop || {};
  const currentDevice = getDeviceStyle(normalized, device) || {};
  const mergedLayout = {
    ...(currentDevice.layout || {}),
    display: 'flex',
    ...(layoutPatch || {}),
  };
  const buildOverride = (baseGroup = {}, mergedGroup = {}) => {
    const out = {};
    Object.keys(mergedGroup).forEach((key) => {
      if (mergedGroup[key] !== baseGroup[key]) out[key] = mergedGroup[key];
    });
    return Object.keys(out).length ? out : undefined;
  };
  const nextStyle = { ...normalized, desktop: desktopBase };
  if (device === 'desktop') {
    nextStyle.desktop = { ...desktopBase, layout: mergedLayout };
  } else {
    const layoutOverride = buildOverride(desktopBase.layout || {}, mergedLayout);
    nextStyle[device] = layoutOverride ? { layout: layoutOverride } : undefined;
    if (!nextStyle[device]) delete nextStyle[device];
  }
  return nextStyle;
}

function mergeStackLayoutStyle(stackNode, device, layoutPatch, siteTheme) {
  const normalized = normalizeResponsiveStyle(stackNode.style_json || {}, {
    nodeType: 'stack',
    siteTheme,
  });
  const desktopBase = normalized.desktop || {};
  const currentDevice = getDeviceStyle(normalized, device) || {};
  const mergedLayout = {
    ...(currentDevice.layout || {}),
    display: 'flex',
    ...(layoutPatch || {}),
  };
  const buildOverride = (baseGroup = {}, mergedGroup = {}) => {
    const out = {};
    Object.keys(mergedGroup).forEach((key) => {
      if (mergedGroup[key] !== baseGroup[key]) out[key] = mergedGroup[key];
    });
    return Object.keys(out).length ? out : undefined;
  };
  const nextStyle = { ...normalized, desktop: desktopBase };
  if (device === 'desktop') {
    nextStyle.desktop = { ...desktopBase, layout: mergedLayout };
  } else {
    const layoutOverride = buildOverride(desktopBase.layout || {}, mergedLayout);
    nextStyle[device] = layoutOverride ? { layout: layoutOverride } : undefined;
    if (!nextStyle[device]) delete nextStyle[device];
  }
  return nextStyle;
}

export function buildStatsContentStackLayoutUpdate(stackNode, device, layoutPatch, siteTheme) {
  return {
    style_json: mergeStackLayoutStyle(stackNode, device, layoutPatch, siteTheme),
  };
}

/** Force heading-above-stats stack axis (column) before vertical reorder. */
export function ensureStatsContentStackColumnPayload(stackNode, device, siteTheme) {
  const currentDir = String(
    getDeviceStyle(stackNode?.style_json, device)?.layout?.flexDirection || 'column'
  ).trim();
  if (currentDir !== 'row' && currentDir !== 'row-reverse') return null;
  return buildStatsContentStackLayoutUpdate(
    stackNode,
    device,
    {
      flexDirection: 'column',
      alignItems:
        getDeviceStyle(stackNode.style_json, device)?.layout?.alignItems || 'center',
      width: '100%',
    },
    siteTheme
  );
}

export function buildStatsCounterLayoutUpdate(statsNode, device, layoutPatch, siteTheme) {
  const gapPx = layoutPatch?.gap != null ? parseGapPx(layoutPatch.gap) : null;
  const payload = {
    style_json: mergeStatsCounterLayoutStyle(statsNode, device, layoutPatch, siteTheme),
  };
  if (gapPx != null) {
    payload.props = {
      ...(statsNode.props || {}),
      gapPx,
    };
  }
  return payload;
}

/**
 * Apply section template layout preset to the embedded stats_counter widget.
 * @param {object} statsNode
 * @param {import('./sectionLayout.js').SectionLayout} layout
 * @param {string|null|undefined} templateId
 */
export function applyStatsSectionLayoutToCounter(statsNode, layout, templateId = 'stats') {
  const nextLayout = normalizeSectionLayout(layout, templateId);
  const style_json = applySectionLayoutToStyleJson(statsNode.style_json, {
    ...nextLayout,
    direction: 'horizontal',
    columns: 3,
    mobileStack: nextLayout.mobileStack,
    align: nextLayout.align,
    gap: nextLayout.gap,
    reverse: nextLayout.reverse,
  });
  return {
    style_json,
    props: {
      ...(statsNode.props || {}),
      gapPx: sectionLayoutGapPx(nextLayout),
    },
  };
}
