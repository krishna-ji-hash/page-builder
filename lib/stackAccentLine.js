import {
  findAncestorColumnNode,
  findAncestorRowNode,
  findAncestorStackNode,
  findNodeInTree,
} from './builderTree.js';
import { sectionHeadingFromProps } from './contentComposer.js';
import { normalizeResponsiveStyle } from './styleNormalizer.js';
import { getDeviceStyle } from './styleToCss.js';

const ACCENT_CONTAINER_TYPES = new Set(['row', 'column', 'stack']);

export const STACK_ACCENT_DEFAULTS = {
  side: 'left',
  color: '#2563eb',
  thicknessPx: 4,
  gapPx: 20,
};

function clampPx(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function paddingObject(spacing) {
  const pad = spacing?.padding;
  if (pad && typeof pad === 'object' && !Array.isArray(pad)) {
    return {
      top: Number(pad.top) || 0,
      right: Number(pad.right) || 0,
      bottom: Number(pad.bottom) || 0,
      left: Number(pad.left) || 0,
    };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function normalizeStackAccentLine(raw) {
  if (!raw || raw.enabled === false) return null;
  return {
    enabled: true,
    side: raw.side === 'right' ? 'right' : 'left',
    color: String(raw.color || STACK_ACCENT_DEFAULTS.color),
    thicknessPx: clampPx(raw.thicknessPx, 1, 16, STACK_ACCENT_DEFAULTS.thicknessPx),
    gapPx: clampPx(raw.gapPx, 0, 64, STACK_ACCENT_DEFAULTS.gapPx),
    restore: raw.restore && typeof raw.restore === 'object' ? raw.restore : null,
  };
}

export function readStackAccentLine(node) {
  return normalizeStackAccentLine(node?.props?.meta?.accentLine);
}

function rowUsesSectionHeading(row) {
  const sh = sectionHeadingFromProps(row?.props);
  return Boolean(sh?.enabled && (sh.eyebrow || sh.heading || sh.description));
}

function firstColumnInRow(row) {
  return (row?.children || []).find((c) => c?.nodeType === 'column') || null;
}

function richestStackInColumn(column) {
  const stacks = (column?.children || []).filter((c) => c?.nodeType === 'stack');
  if (!stacks.length) return null;
  return stacks.reduce((best, cur) => {
    const bestCount = best?.children?.length || 0;
    const curCount = cur?.children?.length || 0;
    return curCount > bestCount ? cur : best;
  }, stacks[0]);
}

/** Pick row / column / stack that should carry the full-height left accent. */
export function resolveAccentLineTarget(tree, selectedNodeId, selectedNode) {
  const node =
    selectedNode ||
    (selectedNodeId != null && Array.isArray(tree) ? findNodeInTree(tree, selectedNodeId) : null);
  if (!node?.id) return null;

  if (ACCENT_CONTAINER_TYPES.has(node.nodeType)) {
    if (node.nodeType === 'row') {
      if (rowUsesSectionHeading(node)) {
        return { targetNodeId: node.id, node, accentLine: readStackAccentLine(node) };
      }
      const column = firstColumnInRow(node);
      if (column) {
        return { targetNodeId: column.id, node: column, accentLine: readStackAccentLine(column) };
      }
    }
    return { targetNodeId: node.id, node, accentLine: readStackAccentLine(node) };
  }

  const row = findAncestorRowNode(tree, node.id);
  if (row && rowUsesSectionHeading(row)) {
    return { targetNodeId: row.id, node: row, accentLine: readStackAccentLine(row) };
  }

  const stack = findAncestorStackNode(tree, node.id);
  if (stack?.id) {
    return { targetNodeId: stack.id, node: stack, accentLine: readStackAccentLine(stack) };
  }

  const column = findAncestorColumnNode(tree, node.id);
  if (column?.id) {
    return { targetNodeId: column.id, node: column, accentLine: readStackAccentLine(column) };
  }

  if (row?.id) {
    return { targetNodeId: row.id, node: row, accentLine: readStackAccentLine(row) };
  }

  return null;
}

/** @deprecated alias */
export function resolveStackAccentContext(tree, selectedNodeId, selectedNode) {
  const target = resolveAccentLineTarget(tree, selectedNodeId, selectedNode);
  if (!target?.targetNodeId) return null;
  return {
    stackId: target.targetNodeId,
    stack: target.node,
    accentLine: target.accentLine,
  };
}

export function resolveStackAccentPlan(tree, selectedNodeId, selectedNode, options = {}) {
  const target = resolveAccentLineTarget(tree, selectedNodeId, selectedNode);
  if (!target?.targetNodeId) return null;
  const accent = normalizeStackAccentLine({
    enabled: true,
    ...STACK_ACCENT_DEFAULTS,
    ...options,
  });
  if (!accent) return null;
  return {
    kind: 'stack-accent',
    targetNodeId: target.targetNodeId,
    stackId: target.targetNodeId,
    accent,
  };
}

export function accentLineDataAttrs(node) {
  const accent = readStackAccentLine(node);
  if (!accent) return {};
  return { 'data-bld-accent-line': accent.side === 'right' ? 'right' : 'left' };
}

export function buildStackAccentBorderWidth(thicknessPx, side = 'left') {
  const t = clampPx(thicknessPx, 1, 16, STACK_ACCENT_DEFAULTS.thicknessPx);
  return side === 'right' ? `0 ${t}px 0 0` : `0 0 0 ${t}px`;
}

export function captureStackAccentRestore(deviceStyle) {
  const pad = paddingObject(deviceStyle?.spacing);
  return {
    border: {
      width: deviceStyle?.border?.width ?? '',
      color: deviceStyle?.border?.color ?? '',
      style: deviceStyle?.border?.style ?? '',
    },
    padding: pad,
  };
}

export function buildStackAccentStylePatch(accent, deviceStyle) {
  const normalized = normalizeStackAccentLine(accent);
  if (!normalized) return {};
  const pad = paddingObject(deviceStyle?.spacing);
  const sideKey = normalized.side === 'right' ? 'right' : 'left';
  pad[sideKey] = normalized.gapPx;
  return {
    border: {
      width: buildStackAccentBorderWidth(normalized.thicknessPx, normalized.side),
      color: normalized.color,
      style: 'solid',
    },
    spacing: { padding: pad },
  };
}

export function buildStackAccentRestorePatch(restore) {
  if (!restore || typeof restore !== 'object') {
    return {
      border: null,
      spacing: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
    };
  }
  const pad = restore.padding && typeof restore.padding === 'object' ? restore.padding : { top: 0, right: 0, bottom: 0, left: 0 };
  const border = restore.border && typeof restore.border === 'object' ? restore.border : {};
  const width = border.width ?? '';
  return {
    border: width ? { width, color: border.color ?? '', style: border.style || 'solid' } : null,
    spacing: { padding: pad },
  };
}

export function applyStackAccentToStyleJson(styleJson, device, stylePatch) {
  const normalized = normalizeResponsiveStyle(styleJson || {});
  const current = getDeviceStyle(normalized, device) || {};
  const merged = { ...current };
  if (stylePatch.border === null) {
    delete merged.border;
  } else if (stylePatch.border) {
    merged.border = { ...(current.border || {}), ...stylePatch.border };
    if (!merged.border.width) delete merged.border;
  }
  if (stylePatch.spacing) {
    merged.spacing = {
      ...(current.spacing || {}),
      padding: stylePatch.spacing.padding ?? current.spacing?.padding,
    };
  }
  return { ...normalized, [device]: merged };
}

export function buildStackAccentNodePayload(node, device, accent, { remove = false } = {}) {
  const deviceStyle = getDeviceStyle(node?.style_json || {}, device) || {};
  const meta = { ...(node?.props?.meta || {}) };
  let stylePatch;

  if (remove) {
    const existing = readStackAccentLine(node);
    stylePatch = buildStackAccentRestorePatch(existing?.restore);
    delete meta.accentLine;
  } else {
    const normalized = normalizeStackAccentLine({ enabled: true, ...accent });
    if (!normalized) return null;
    if (!meta.accentLine?.enabled) {
      normalized.restore = captureStackAccentRestore(deviceStyle);
    } else if (meta.accentLine.restore) {
      normalized.restore = meta.accentLine.restore;
    }
    meta.accentLine = normalized;
    stylePatch = buildStackAccentStylePatch(normalized, deviceStyle);
  }

  const style_json = applyStackAccentToStyleJson(node?.style_json, device, stylePatch);
  return {
    props: { ...(node?.props || {}), meta },
    style_json,
  };
}
