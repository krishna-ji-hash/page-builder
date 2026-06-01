import { dedupeBrandLogoChildrenInStack } from './headerLogo.js';
import { isHeaderRowNode } from './rowLayoutMeta.js';
import { normalizeResponsiveStyle } from './styleNormalizer.js';
import { DEFAULT_SITE_THEME } from './siteDesignTheme.js';
import {
  compactHeaderColumnDeviceStyle,
  compactHeaderLogoColumnDeviceStyle,
  compactHeaderNavColumnDeviceStyle,
  compactHeaderRowDeviceStyle,
  compactHeaderStackDeviceStyle,
} from './responsiveLayoutDefaults.js';

export function nodeSubtreeHasType(node, nodeType) {
  if (!node) return false;
  if (node.nodeType === nodeType) return true;
  return (node.children || []).some((c) => nodeSubtreeHasType(c, nodeType));
}

/** Header row for compact mobile bar — meta tag or “Header” row that contains a menu. */
export function isSiteHeaderRowForCompact(node) {
  if (!node || node.nodeType !== 'row') return false;
  if (isHeaderRowNode(node)) return true;
  const name = String(node.displayName || '').toLowerCase();
  if (!name.includes('header')) return false;
  return nodeSubtreeHasType(node, 'menu');
}

export function headerRowDirectStacksOnly(node) {
  const ch = node?.children || [];
  return ch.length > 0 && ch.every((c) => c?.nodeType === 'stack');
}

export function headerColumnHasMultipleStacks(node) {
  if (!node || node.nodeType !== 'column') return false;
  const stacks = (node.children || []).filter((c) => c?.nodeType === 'stack');
  return stacks.length >= 2 && stacks.some((s) => nodeSubtreeHasType(s, 'menu'));
}

export function isHeaderActionsStackNode(node) {
  if (!node || node.nodeType !== 'stack') return false;
  const kids = node.children || [];
  const hasButton = kids.some((c) => c?.nodeType === 'button' || c?.nodeType === 'text');
  const hasMenu = kids.some((c) => c?.nodeType === 'menu');
  return hasButton && !hasMenu;
}

/** Header column that holds Login / CTA (not logo-only, not nav). */
export function isHeaderActionsColumnNode(node) {
  if (!node || node.nodeType !== 'column') return false;
  if (nodeSubtreeHasType(node, 'menu')) return false;
  const name = String(node.displayName || '').toLowerCase();
  if (name.includes('action')) return true;
  const kids = node.children || [];
  if (kids.some((c) => c?.nodeType === 'button')) return true;
  return kids.some((c) => c?.nodeType === 'stack' && isHeaderActionsStackNode(c));
}

function stripDisplayNoneFromDeviceStyle(deviceStyle) {
  if (!deviceStyle?.layout || deviceStyle.layout.display !== 'none') return deviceStyle;
  const { display: _d, visibility: _v, ...layout } = deviceStyle.layout;
  return { ...deviceStyle, layout };
}

/** Remove persisted `display: none` on header CTAs (e.g. saved while editing mobile). */
export function stripHeaderActionsVisibilityFromStyleJson(styleJson) {
  if (!styleJson || typeof styleJson !== 'object') return styleJson;
  const next = { ...styleJson };
  for (const layer of ['desktop', 'tablet', 'mobile']) {
    if (next[layer]) next[layer] = stripDisplayNoneFromDeviceStyle(next[layer]);
  }
  return next;
}

export function isHeaderLogoColumnNode(node) {
  if (!node || node.nodeType !== 'column') return false;
  if (nodeSubtreeHasType(node, 'menu')) return false;
  const name = String(node.displayName || '').toLowerCase();
  return nodeSubtreeHasType(node, 'image') || name.includes('logo');
}

export function isHeaderNavColumnNode(node) {
  if (!node || node.nodeType !== 'column') return false;
  return nodeSubtreeHasType(node, 'menu');
}

export function isHeaderLogoStackNode(node) {
  if (!node || node.nodeType !== 'stack') return false;
  if (nodeSubtreeHasType(node, 'menu')) return false;
  const name = String(node.displayName || '').toLowerCase();
  return nodeSubtreeHasType(node, 'image') || name.includes('logo');
}

export function isHeaderNavStackNode(node) {
  if (!node || node.nodeType !== 'stack') return false;
  return nodeSubtreeHasType(node, 'menu');
}

/**
 * Unique header bar classes (see styles/shared/site-header-bar.css).
 * @returns {string} space-separated class names
 */
export function headerBarClassesForNode(node, context = {}) {
  const device = context.device || 'desktop';
  const insideSiteHeaderRow = Boolean(context.insideSiteHeaderRow);
  const inHeader = insideSiteHeaderRow || isSiteHeaderRowForCompact(node);
  if (!inHeader) return '';

  const parts = [];
  const compact = device === 'mobile' || device === 'tablet';

  if (isSiteHeaderRowForCompact(node)) {
    parts.push('site-header-bar');
    parts.push(compact ? 'site-header-bar--compact' : 'site-header-bar--desktop');
    const layout = String(context.headerLayout || '').toLowerCase();
    if (layout === 'centered' || layout === 'center') {
      parts.push('site-header-bar--centered');
    }
  }

  if (inHeader) {
    if (isHeaderActionsStackNode(node) || isHeaderActionsColumnNode(node)) {
      parts.push('site-header-actions');
    } else if (isHeaderNavStackNode(node) || isHeaderNavColumnNode(node)) {
      parts.push('site-header-nav');
    } else if (isHeaderLogoStackNode(node) || isHeaderLogoColumnNode(node)) {
      parts.push('site-header-logo');
    }
  }

  return parts.filter(Boolean).join(' ');
}

/** @deprecated use headerBarClassesForNode — kept for tests */
export function headerActionsDataAttrsForNode(node) {
  if (isHeaderActionsStackNode(node) || isHeaderActionsColumnNode(node)) {
    return { 'data-bld-header-actions': 'true' };
  }
  return {};
}

/** Builder / live inline style: never keep mobile hide on desktop preview. */
export function ensureHeaderActionsVisibleCss(css) {
  if (!css || typeof css !== 'object') return css;
  if (css.display !== 'none' && css.visibility !== 'hidden') return css;
  const next = { ...css };
  delete next.display;
  delete next.visibility;
  if (!next.display) next.display = 'flex';
  return next;
}

/** Single stack holds logo + menu + buttons (legacy / flattened header). */
export function isFlattenedHeaderStack(node) {
  if (!node || node.nodeType !== 'stack') return false;
  const kids = node.children || [];
  const hasMenu = kids.some((c) => c?.nodeType === 'menu');
  const hasButton = kids.some((c) => c?.nodeType === 'button');
  return hasMenu && hasButton;
}

export function shouldApplyCompactHeaderPreview(node, device, insideSiteHeaderRow) {
  if (device !== 'mobile' && device !== 'tablet') return false;
  if (isSiteHeaderRowForCompact(node)) return true;
  if (insideSiteHeaderRow) return true;
  return false;
}

/** Apply compact bar device styles (builder + live renderer). */
export function applyCompactHeaderDeviceStyle(node, device, deviceStyle, insideSiteHeaderRow = false) {
  const compactPreview = device === 'mobile' || device === 'tablet';
  if (!compactPreview) return deviceStyle;
  const siteHeaderRow = isSiteHeaderRowForCompact(node);
  if (siteHeaderRow) return compactHeaderRowDeviceStyle(deviceStyle);
  if (insideSiteHeaderRow && node?.nodeType === 'column') {
    if (headerColumnHasMultipleStacks(node)) {
      return {
        ...compactHeaderColumnDeviceStyle(deviceStyle, { multiStack: true }),
        layout: {
          ...compactHeaderColumnDeviceStyle(deviceStyle, { multiStack: true }).layout,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, max-content) auto',
          gridTemplateRows: 'auto',
          width: '100%',
        },
      };
    }
    if (nodeSubtreeHasType(node, 'menu')) return compactHeaderNavColumnDeviceStyle(deviceStyle);
    if (nodeSubtreeHasType(node, 'image')) return compactHeaderLogoColumnDeviceStyle(deviceStyle);
    return compactHeaderColumnDeviceStyle(deviceStyle);
  }
  if (insideSiteHeaderRow && node?.nodeType === 'stack') {
    if (isHeaderActionsStackNode(node)) return compactHeaderStackDeviceStyle(deviceStyle);
    if (isFlattenedHeaderStack(node)) return compactHeaderStackDeviceStyle(deviceStyle, { flattened: true });
    if (nodeSubtreeHasType(node, 'menu')) return compactHeaderNavColumnDeviceStyle(deviceStyle);
  }
  if (insideSiteHeaderRow && node?.nodeType === 'menu') {
    return compactHeaderNavColumnDeviceStyle(deviceStyle);
  }
  return deviceStyle;
}

function repairHeaderSubtree(node, siteTheme) {
  if (!node) return node;
  let next = {
    ...node,
    children: (node.children || []).map((c) => repairHeaderSubtree(c, siteTheme)),
  };
  if (next.nodeType === 'stack') {
    next = dedupeBrandLogoChildrenInStack(next);
  }
  if (next.nodeType === 'column' && nodeSubtreeHasType(next, 'menu')) {
    next = {
      ...next,
      style_json: normalizeResponsiveStyle(next.style_json || {}, {
        nodeType: 'column',
        rowMeta: { isHeader: true },
        siteTheme,
      }),
    };
  }
  if (next.nodeType === 'stack' && nodeSubtreeHasType(next, 'menu')) {
    const sj = next.style_json || {};
    next = {
      ...next,
      style_json: {
        ...sj,
        mobile: {
          ...(sj.mobile || {}),
          layout: {
            ...(sj.mobile?.layout || {}),
            width: 'auto',
            marginLeft: 'auto',
            justifyContent: 'flex-end',
            flexGrow: 0,
          },
        },
        tablet: {
          ...(sj.tablet || {}),
          layout: {
            ...(sj.tablet?.layout || {}),
            width: 'auto',
            marginLeft: 'auto',
            justifyContent: 'flex-end',
            flexGrow: 0,
          },
        },
      },
    };
  }
  if (isHeaderActionsStackNode(next) || isHeaderActionsColumnNode(next)) {
    next = {
      ...next,
      style_json: stripHeaderActionsVisibilityFromStyleJson(next.style_json || {}),
    };
  }
  if (
    next.nodeType === 'stack' &&
    (nodeSubtreeHasType(next, 'image') || String(next.displayName || '').toLowerCase().includes('logo')) &&
    !nodeSubtreeHasType(next, 'menu')
  ) {
    const sj = next.style_json || {};
    next = {
      ...next,
      style_json: {
        ...sj,
        mobile: { ...(sj.mobile || {}), layout: { ...(sj.mobile?.layout || {}), width: 'auto' } },
        tablet: { ...(sj.tablet || {}), layout: { ...(sj.tablet?.layout || {}), width: 'auto' } },
      },
    };
  }
  return next;
}

export function repairHeaderRowsInTree(nodes, siteTheme = DEFAULT_SITE_THEME) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    if (!node) return node;
    if (!isSiteHeaderRowForCompact(node)) {
      return {
        ...node,
        children: repairHeaderRowsInTree(node.children || [], siteTheme),
      };
    }
    const meta = {
      ...(node.props?.meta || {}),
      isHeader: true,
      role: 'header',
    };
    const repaired = {
      ...node,
      props: { ...(node.props || {}), meta },
      style_json: normalizeResponsiveStyle(node.style_json || {}, {
        nodeType: 'row',
        rowMeta: meta,
        siteTheme,
      }),
      children: (node.children || []).map((c) => repairHeaderSubtree(c, siteTheme)),
    };
    return repaired;
  });
}
