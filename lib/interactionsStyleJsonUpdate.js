/**
 * Detect style_json updates that only touch interactions (animation, parallax, hover, etc.).
 */

import { normalizeResponsiveStyle } from './styleNormalizer.js';
import { DEFAULT_SITE_THEME, themeSpacingPx } from './siteDesignTheme.js';

const STYLE_JSON_DEVICE_KEYS = ['desktop', 'tablet', 'mobile'];

function enforceStructuralLayoutForCompare(style = {}, nodeType) {
  const next = { ...(style || {}) };
  if (!['row', 'column', 'stack'].includes(nodeType)) return next;
  for (const key of STYLE_JSON_DEVICE_KEYS) {
    const layer = { ...(next[key] || {}) };
    const layout = { ...(layer.layout || {}) };
    if (nodeType === 'row') {
      const isMobile = key === 'mobile';
      layout.display = 'flex';
      if (layout.flexDirection == null || layout.flexDirection === '') {
        layout.flexDirection = isMobile ? 'column' : 'row';
      }
      if (layout.flexWrap == null || layout.flexWrap === '') {
        layout.flexWrap = isMobile ? 'wrap' : 'nowrap';
      }
      if (isMobile) {
        if (layout.alignItems == null || layout.alignItems === '') layout.alignItems = 'stretch';
        if (layout.gap == null || layout.gap === '') layout.gap = themeSpacingPx(DEFAULT_SITE_THEME, 'lg');
      } else {
        if (layout.justifyContent == null || layout.justifyContent === '') layout.justifyContent = 'space-between';
        if (layout.alignItems == null || layout.alignItems === '') layout.alignItems = 'center';
      }
      if (layout.width == null || layout.width === '') layout.width = '100%';
      const size = { ...((next[key] || {}).size || {}) };
      if (size.width == null || size.width === '') size.width = '100%';
      next[key] = { ...layer, layout, size };
      continue;
    }
    if (nodeType === 'column') {
      layout.display = 'flex';
      layout.flexDirection = 'column';
      if (layout.flexGrow == null || layout.flexGrow === '') layout.flexGrow = 1;
      if (layout.flexShrink == null || layout.flexShrink === '') layout.flexShrink = 1;
      if (layout.flexBasis == null || layout.flexBasis === '') layout.flexBasis = '0%';
      if (layout.minWidth == null || layout.minWidth === '') layout.minWidth = 0;
    }
    if (nodeType === 'stack') {
      layout.display = 'flex';
      if (layout.flexDirection == null || layout.flexDirection === '') layout.flexDirection = 'column';
      if (layout.flexWrap == null || layout.flexWrap === '') layout.flexWrap = 'nowrap';
    }
    next[key] = { ...layer, layout };
  }
  return next;
}

function normalizeStyleJsonForCompare(styleJson, nodeType) {
  let normalized = normalizeResponsiveStyle(styleJson || {}, {
    nodeType,
    siteTheme: DEFAULT_SITE_THEME,
  });
  if (nodeType) {
    normalized = enforceStructuralLayoutForCompare(normalized, nodeType);
  }
  return normalized;
}

function styleJsonWithoutInteractions(styleJson, nodeType) {
  const normalized = normalizeStyleJsonForCompare(styleJson, nodeType);
  const clone = JSON.parse(JSON.stringify(normalized || {}));
  for (const key of STYLE_JSON_DEVICE_KEYS) {
    if (!clone[key] || typeof clone[key] !== 'object') continue;
    delete clone[key].interactions;
    if (Object.keys(clone[key]).length === 0) delete clone[key];
  }
  return clone;
}

/** True when style_json changes are limited to interactions groups. */
export function isInteractionsOnlyStyleJsonUpdate(existingStyleJson, nextStyleJson, nodeType) {
  if (nextStyleJson == null || typeof nextStyleJson !== 'object') return false;
  return (
    JSON.stringify(styleJsonWithoutInteractions(existingStyleJson, nodeType)) ===
    JSON.stringify(styleJsonWithoutInteractions(nextStyleJson, nodeType))
  );
}

export function isStyleJsonOnlyNodePayload(body = {}) {
  return (
    body.style_json !== undefined &&
    body.props === undefined &&
    body.displayName === undefined &&
    body.dataJson === undefined &&
    body.actionsJson === undefined &&
    body.parentNodeId === undefined &&
    body.positionIndex === undefined &&
    body.brandFontNormalize === undefined
  );
}
