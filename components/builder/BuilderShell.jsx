'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  autoFixTree,
  findNodeInTree,
  getSiblingContext,
  reconcileStructuralParents,
  validateTree,
} from '@/lib/builderTree';
import { isValidNodeHierarchy } from '@/lib/builderHierarchy';
import { normalizeResponsiveStyle } from '@/lib/styleNormalizer';
import { getDeviceStyle } from '@/lib/styleToCss';
import { materializeSectionTemplate, SECTION_TEMPLATES } from '@/lib/sectionTemplates';
import { getFullPageTemplateById } from '@/lib/fullPageTemplates';
import { flattenTemplateToBulkNodes } from '@/lib/sectionTemplates';
import { normalizeSiteTheme, themeSpacingPx } from '@/lib/siteDesignTheme';
import { BuilderThemeProvider } from '@/context/BuilderThemeContext';
import BuilderTopbar from './BuilderTopbar';
import BuilderSidebar from './BuilderSidebar';
import BuilderCanvas from './BuilderCanvas';
import BuilderInspector from './BuilderInspector';
import { getGlobalLinkMeta, isLinkedGlobalPlaceholder, treeContainsLinkedGlobals } from '@/lib/globalComponentLinkMeta';
import { loadAppsForProject } from '@/lib/registry/appLoader';
import PageSeoModal from './seo/PageSeoModal';
import AuditModal from './audits/AuditModal';
import AuditBadgesOverlay from './audits/AuditBadgesOverlay';
import '@/styles/builder/builder-shell.css';
import '@/styles/builder/builder-rail.css';
import '@/styles/builder/builder-topbar.css';
import '@/styles/builder/builder-sidebar.css';
import '@/styles/builder/builder-canvas.css';
import '@/styles/builder/builder-inspector.css';
import '@/styles/builder/builder-responsive.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';
import '@/styles/live/live-site.css';
import '@/styles/builder/builder-live-mirror.css';

function cloneTreeSnapshot(snapshot) {
  try {
    return structuredClone(snapshot || []);
  } catch {
    return JSON.parse(JSON.stringify(snapshot || []));
  }
}

function countRootRows(nodes) {
  return Array.isArray(nodes) ? nodes.filter((n) => n?.nodeType === 'row').length : 0;
}

function updateNodeInTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }
    if (!node.children?.length) return node;
    return {
      ...node,
      children: updateNodeInTree(node.children, nodeId, updater),
    };
  });
}

function addNodeToTree(nodes, parentId, newNode) {
  if (!parentId) return [...nodes, newNode];
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode].sort(
          (a, b) => a.positionIndex - b.positionIndex
        ),
      };
    }
    if (!node.children?.length) return node;
    return {
      ...node,
      children: addNodeToTree(node.children, parentId, newNode),
    };
  });
}

function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: removeNodeFromTree(node.children || [], nodeId),
    }));
}

function hasNodeInTree(nodes, nodeId) {
  return Boolean(findNodeInTree(nodes, nodeId));
}

function walkNodes(nodes, visit) {
  for (const node of nodes || []) {
    if (!node) continue;
    visit(node);
    if (Array.isArray(node.children) && node.children.length) {
      walkNodes(node.children, visit);
    }
  }
}

function sanitizeStyleForStrictMode(styleJson, nodeType = null) {
  const normalized = normalizeResponsiveStyle(styleJson || {}, nodeType ? { nodeType } : {});
  const deviceKeys = ['desktop', 'tablet', 'mobile'];
  const next = { ...normalized };
  for (const key of deviceKeys) {
    const layer = next[key];
    if (!layer || typeof layer !== 'object') continue;
    const layout = { ...(layer.layout || {}) };
    delete layout.left;
    delete layout.right;
    delete layout.top;
    delete layout.bottom;
    delete layout.inset;
    delete layout.zIndex;
    layout.position = 'static';
    next[key] = { ...layer, layout };
  }
  return next;
}

function mapTreeNodes(nodes, mapper) {
  return (nodes || []).map((node) => {
    const mapped = mapper(node);
    return {
      ...mapped,
      children: mapTreeNodes(mapped.children || [], mapper),
    };
  });
}

function treeNeedsStrictSanitize(nodes) {
  let needs = false;
  walkNodes(nodes || [], (node) => {
    const normalized = normalizeResponsiveStyle(node?.style_json || {}, { nodeType: node?.nodeType });
    const layers = [normalized.desktop, normalized.tablet, normalized.mobile];
    for (const layer of layers) {
      const pos = String(layer?.layout?.position || '').toLowerCase();
      if (pos === 'absolute' || pos === 'fixed') {
        needs = true;
        break;
      }
    }
  });
  return needs;
}

function buildParentMap(nodes, parentId = null, out = new Map()) {
  for (const node of nodes || []) {
    if (!node) continue;
    out.set(node.id, parentId);
    if (Array.isArray(node.children) && node.children.length) {
      buildParentMap(node.children, node.id, out);
    }
  }
  return out;
}

/** Nearest section row that contains this node (for quick actions when a stack/column is selected). */
function findAncestorRowId(tree, startNodeId) {
  if (startNodeId == null) return null;
  const sid = Number(startNodeId);
  if (!Number.isFinite(sid)) return null;
  const parents = buildParentMap(tree);
  let cur = sid;
  for (let i = 0; i < 80; i += 1) {
    const node = findNodeInTree(tree, cur);
    if (!node) return null;
    if (node.nodeType === 'row') return node.id;
    const p = parents.get(cur);
    if (p == null) return null;
    cur = p;
  }
  return null;
}

/** All `row` nodes in depth-first order (page sections). */
function collectRowsInDocOrder(nodes) {
  const rows = [];
  walkNodes(nodes || [], (node) => {
    if (node?.nodeType !== 'row') return;
    const meta = node.props?.meta || {};
    const roleHint =
      meta.isHeader || meta.role === 'header'
        ? 'Header'
        : meta.isFooter || meta.role === 'footer'
          ? 'Footer'
          : null;
    const dn = typeof node.displayName === 'string' ? node.displayName.trim() : '';
    rows.push({
      id: node.id,
      label: dn || roleHint || 'Section',
    });
  });
  return rows;
}

/** Presets for header rows (`props.meta.headerLayout`) — aside + data; style hooks can read later. */
const HEADER_LAYOUT_PRESETS = [
  { id: 'standard', label: 'Standard bar' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'centered', label: 'Centered logo' },
  { id: 'split', label: 'Split / mega' },
  { id: 'transparent', label: 'Transparent overlay' },
];

const FOOTER_LAYOUT_PRESETS = [
  { id: 'standard', label: 'Standard footer' },
  { id: 'compact', label: 'Compact' },
  { id: 'columns', label: 'Multi-column' },
  { id: 'minimal', label: 'Minimal line' },
];

/** Row `justifyContent` for logo / nav / action columns (`meta.headerAlign`). */
const HEADER_ALIGN_PRESETS = [
  { id: 'between', label: 'Space between' },
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
];

function headerAlignToJustifyContent(alignId) {
  const id = String(alignId || 'between').toLowerCase();
  if (id === 'left') return 'flex-start';
  if (id === 'center') return 'center';
  if (id === 'right') return 'flex-end';
  return 'space-between';
}

function applyHeaderAlignToRowStyleJson(styleJson, alignId) {
  const justify = headerAlignToJustifyContent(alignId);
  const base = styleJson && typeof styleJson === 'object' ? styleJson : {};
  const patchLayer = (layer) => {
    const L = layer && typeof layer === 'object' ? layer : {};
    const prevLayout = L.layout && typeof L.layout === 'object' ? L.layout : {};
    const layout = { ...prevLayout, justifyContent: justify };
    if (prevLayout.gap == null || prevLayout.gap === '') {
      layout.gap = 'clamp(10px, 2vw, 24px)';
    }
    return { ...L, layout };
  };
  return {
    ...base,
    desktop: patchLayer(base.desktop),
    tablet: patchLayer(base.tablet),
    mobile: patchLayer(base.mobile),
  };
}

function asideInteriorNodeLabel(nodeType) {
  if (nodeType === 'column') return 'Column';
  if (nodeType === 'stack') return 'Stack';
  return 'Block';
}

function SectionInteriorList({ nodes, selectedNodeId, onSelectNode, overflowByNodeId = {}, depth = 0 }) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return (
      <p className="bld-left__interior-empty">
        Empty section — use the section toolbar on the canvas to add columns.
      </p>
    );
  }
  return (
    <ul className={`bld-left__interior-tree${depth ? ' bld-left__interior-tree--nested' : ''}`}>
      {nodes.map((node) => {
        const sid = selectedNodeId != null ? Number(selectedNodeId) : NaN;
        const nid = Number(node?.id);
        const isActive = Number.isFinite(sid) && Number.isFinite(nid) && sid === nid;
        const diag = overflowByNodeId?.[node.id] || null;
        const hasOverflow = Boolean(diag?.horizontal || diag?.vertical || diag?.flexWrapUnexpected);
        return (
          <li key={node.id} className="bld-left__interior-tree__item">
            <button
              type="button"
              className={`bld-left__interior-pick${isActive ? ' is-active' : ''}`}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
              onClick={() => onSelectNode(node.id)}
            >
              <span className="bld-left__interior-pick__type">{asideInteriorNodeLabel(node.nodeType)}</span>
              <span className="bld-left__interior-pick__name" title={String(node.displayName || node.nodeType)}>
                {node.displayName || node.nodeType}
              </span>
              {hasOverflow ? (
                <span
                  className="bld-left__interior-pick__warn"
                  title={overflowBadgeTitle(diag) || 'Layout overflow detected'}
                  aria-label="Overflow warning"
                >
                  !
                </span>
              ) : null}
            </button>
            {node.children?.length ? (
              <SectionInteriorList
                nodes={node.children}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                overflowByNodeId={overflowByNodeId}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function overflowBadgeTitle(diag) {
  if (!diag) return '';
  if (diag.flexWrapUnexpected) return 'Layout overflow detected (wrap)';
  if (diag.horizontal) return 'Layout overflow detected (horizontal)';
  if (diag.vertical) return 'Layout overflow detected (vertical)';
  return 'Layout overflow detected';
}

function isRowMarkedHeader(rowNode) {
  const meta = rowNode?.props?.meta || {};
  return Boolean(meta.isHeader || meta.role === 'header');
}

function isRowMarkedFooter(rowNode) {
  const meta = rowNode?.props?.meta || {};
  return Boolean(meta.isFooter || meta.role === 'footer');
}

function normalizePositions(nodes) {
  return nodes.map((node, index) => ({
    ...node,
    positionIndex: index,
    children: normalizePositions(node.children || []),
  }));
}

function detachNode(nodes, nodeId) {
  let removed = null;
  const next = nodes
    .filter((node) => {
      if (node.id === nodeId) {
        removed = node;
        return false;
      }
      return true;
    })
    .map((node) => {
      const result = detachNode(node.children || [], nodeId);
      if (result.removed && !removed) removed = result.removed;
      return { ...node, children: result.next };
    });
  return { next, removed };
}

function insertNode(nodes, newParentId, newIndex, nodeToInsert) {
  if (!newParentId) {
    const result = [...nodes];
    const index = Math.max(0, Math.min(newIndex, result.length));
    result.splice(index, 0, { ...nodeToInsert, parentNodeId: null });
    return result;
  }

  return nodes.map((node) => {
    if (node.id === newParentId) {
      const children = [...(node.children || [])];
      const index = Math.max(0, Math.min(newIndex, children.length));
      children.splice(index, 0, { ...nodeToInsert, parentNodeId: newParentId });
      return { ...node, children };
    }
    return {
      ...node,
      children: insertNode(node.children || [], newParentId, newIndex, nodeToInsert),
    };
  });
}

function formatLoadError(data, response) {
  const base = data?.error || 'Failed to load builder';
  const detail = data?.details ? ` (${data.details})` : '';
  if (response.status === 404) {
    return `Page not found for this builder URL.${detail}`;
  }
  return `${base}${detail}`;
}

async function readJsonSafe(response) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const snippet = trimmed.slice(0, 160).replace(/\s+/g, ' ').trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      throw new Error(
        'Server returned an HTML error page instead of JSON. Stop dev server, delete the .next folder, then run npm run dev again.'
      );
    }
    throw new Error(snippet ? `Invalid response from server: ${snippet}` : 'Invalid response from server');
  }
}

function humanizeClientError(error) {
  if (!error) return 'Something went wrong';
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    msg.includes('fetch resource')
  ) {
    return 'Could not reach the server. Check that the app is running (npm run dev), the URL matches this app (same host/port), and your network is OK. If the app is running but this persists, start MySQL (npm run db:up), copy .env from .env.example, and run npm run db:migrate (or use npm run dev so migrations run first).';
  }
  return msg;
}

/** Where to insert a pasted duplicate relative to the current selection (strict hierarchy). */
function computePastePlacement(tree, selectedId, sourceType) {
  if (!tree?.length || !selectedId) return null;
  const sid = Number(selectedId);
  if (!Number.isFinite(sid)) return null;
  const sel = findNodeInTree(tree, sid);
  if (!sel?.nodeType) return null;
  if (['row', 'column', 'stack'].includes(sel.nodeType)) {
    if (isValidNodeHierarchy(sourceType, sel.nodeType)) {
      return { parentId: sel.id, newIndex: (sel.children || []).length };
    }
    return null;
  }
  const ctx = getSiblingContext(tree, sid);
  if (!ctx) return null;
  const parentNode = ctx.parentId != null ? findNodeInTree(tree, ctx.parentId) : null;
  const parentType = parentNode?.nodeType ?? null;
  if (!isValidNodeHierarchy(sourceType, parentType)) return null;
  return { parentId: ctx.parentId, newIndex: ctx.index + 1 };
}

export default function BuilderShell({ pageId }) {
  const pid = Number(pageId);
  const pageIdValid = Number.isInteger(pid) && pid > 0;

  const [device, setDevice] = useState('desktop');
  /** Default Strict so rows (headers) keep flex — Free mode uses absolute coords and breaks space-between. */
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState('elements'); // elements | templates | globals | layers
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const [interiorCollapsed, setInteriorCollapsed] = useState(false);
  const [page, setPage] = useState(null);
  const [draftVersion, setDraftVersion] = useState(null);
  const [tree, setTree] = useState([]);
  const [projectPages, setProjectPages] = useState([]);
  const [reusableBlocks, setReusableBlocks] = useState([]);
  const [globalComponents, setGlobalComponents] = useState([]);
  const globalComponentCacheRef = useRef(new Map());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [previewCssByNodeId, setPreviewCssByNodeId] = useState({});
  const [activeSpacingEdit, setActiveSpacingEdit] = useState(null);
  const [overflowByNodeId, setOverflowByNodeId] = useState({});
  const [inspectorTab, setInspectorTab] = useState('content'); // content | style | advanced
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSavingNode, setIsSavingNode] = useState(false);
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState(null);
  const deleteInFlightRef = useRef(false);
  const [isReorderingNode, setIsReorderingNode] = useState(false);
  const [hasUnpublishedEdits, setHasUnpublishedEdits] = useState(false);
  const [saveAckVisible, setSaveAckVisible] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncingDraft, setIsSyncingDraft] = useState(false);
  const [undoStack, setUndoStack] = useState([]); // { ts:number, tree:any[] }[]
  const [redoStack, setRedoStack] = useState([]); // { ts:number, tree:any[] }[]
  const [copiedNodeId, setCopiedNodeId] = useState(null);
  const [copyToastMessage, setCopyToastMessage] = useState(null);
  const [enabledAppIds, setEnabledAppIds] = useState([]);
  const [isSeoOpen, setIsSeoOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [lastAuditIssues, setLastAuditIssues] = useState([]);
  const [mediaMetaByUrl, setMediaMetaByUrl] = useState(() => new Map());

  // Preload media metadata once per project (used by audits; no backend calls during scan).
  useEffect(() => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const all = [];
        for (const p of [1, 2]) {
          const res = await fetch(`/api/projects/${projectId}/media?page=${p}&pageSize=120&sort=created_desc`, {
            cache: 'no-store',
          });
          const data = await readJsonSafe(res);
          if (!res.ok) break;
          const items = Array.isArray(data?.items) ? data.items : [];
          all.push(...items);
          if (items.length < 120) break;
        }
        if (cancelled) return;
        const map = new Map();
        all.forEach((m) => {
          if (m?.publicUrl) {
            map.set(String(m.publicUrl), m);
          }
        });
        setMediaMetaByUrl(map);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page?.projectId]);

  // Phase 13: preload enabled apps once per project (lazy imports, safe registry reset).
  useEffect(() => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/apps`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        const ids = Array.isArray(json?.enabledAppIds) ? json.enabledAppIds : [];
        if (cancelled) return;
        setEnabledAppIds(ids);
        await loadAppsForProject({ projectId, enabledAppIds: ids });
      } catch {
        // ignore; builder still works with core widgets
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page?.projectId]);

  const fetchGlobalComponents = useCallback(async () => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return [];
    const res = await fetch(`/api/projects/${projectId}/global-components`, { cache: 'no-store' });
    const data = await readJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Failed to load global components');
    const items = Array.isArray(data?.items) ? data.items : [];
    setGlobalComponents(items);
    return items;
  }, [page?.projectId]);

  const ensureGlobalComponentsLoaded = useCallback(async () => {
    if (globalComponents?.length) return;
    try {
      await fetchGlobalComponents();
    } catch {
      // ignore — optional library
    }
  }, [fetchGlobalComponents, globalComponents?.length]);

  useEffect(() => {
    if (leftPanelTab !== 'globals') return;
    ensureGlobalComponentsLoaded();
  }, [leftPanelTab, ensureGlobalComponentsLoaded]);

  const getGlobalComponentSnapshotCached = useCallback(
    async (componentId) => {
      const projectId = Number(page?.projectId);
      const cid = Number(componentId);
      if (!Number.isInteger(projectId) || projectId <= 0) return null;
      if (!Number.isInteger(cid) || cid <= 0) return null;
      const cache = globalComponentCacheRef.current;
      if (cache?.has(cid)) return cache.get(cid);
      const res = await fetch(`/api/projects/${projectId}/global-components/${cid}`, { cache: 'no-store' });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to load global component');
      const item = data?.item || null;
      if (item) cache.set(cid, item);
      return item;
    },
    [page?.projectId]
  );

  const openGlobalComponentEditor = useCallback(
    (componentId) => {
      const projectId = Number(page?.projectId);
      const cid = Number(componentId);
      if (!Number.isInteger(projectId) || projectId <= 0) return;
      if (!Number.isInteger(cid) || cid <= 0) return;
      const returnTo = `/admin/builder/${pid}`;
      const url = `/admin/projects/${projectId}/global-components/${cid}?returnTo=${encodeURIComponent(returnTo)}`;
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    },
    [page?.projectId, pid]
  );

  const setPreviewCssForNode = useCallback((nodeId, css, opts = {}) => {
    if (opts?.clearAll) {
      setPreviewCssByNodeId({});
      return;
    }
    if (!nodeId) return;
    setPreviewCssByNodeId((prev) => {
      const next = { ...(prev || {}) };
      if (!css) delete next[nodeId];
      else next[nodeId] = css;
      return next;
    });
  }, []);

  const handleOverflowDiagnostics = useCallback((nextMap) => {
    if (!nextMap || typeof nextMap !== 'object') return;
    setOverflowByNodeId(nextMap);
  }, []);
  const [flashPasteNodeId, setFlashPasteNodeId] = useState(null);
  const [flashReorderNodeId, setFlashReorderNodeId] = useState(null);
  const [isLayoutDebug, setIsLayoutDebug] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    if (!copyToastMessage) return undefined;
    const t = window.setTimeout(() => setCopyToastMessage(null), 2400);
    return () => window.clearTimeout(t);
  }, [copyToastMessage]);

  useEffect(() => {
    if (flashPasteNodeId == null) return undefined;
    const t = window.setTimeout(() => setFlashPasteNodeId(null), 2200);
    return () => window.clearTimeout(t);
  }, [flashPasteNodeId]);

  useEffect(() => {
    if (flashReorderNodeId == null) return undefined;
    const t = window.setTimeout(() => setFlashReorderNodeId(null), 900);
    return () => window.clearTimeout(t);
  }, [flashReorderNodeId]);

  useEffect(() => {
    if (!saveAckVisible) return undefined;
    const t = window.setTimeout(() => setSaveAckVisible(false), 3200);
    return () => window.clearTimeout(t);
  }, [saveAckVisible]);

  const shellSiteTheme = useMemo(
    () => normalizeSiteTheme(page?.projectConfig?.siteTheme),
    [page?.projectConfig?.siteTheme]
  );

  const clipboardNodeTypeLabel = useMemo(() => {
    if (!copiedNodeId) return null;
    const n = findNodeInTree(tree, Number(copiedNodeId));
    if (!n?.nodeType) return null;
    const raw = String(n.nodeType);
    const labels = {
      heading: 'Heading',
      text: 'Text',
      rich_text: 'Rich text',
      image: 'Image',
      button: 'Button',
      menu: 'Menu',
      table: 'Table',
      form: 'Form',
      carousel: 'Carousel',
      row: 'Section',
      column: 'Column',
      stack: 'Stack',
    };
    return labels[raw] || raw.replace(/_/g, ' ');
  }, [copiedNodeId, tree]);

  const handleToggleFreeMode = useCallback(() => {
    setIsFreeMode((prev) => {
      const next = !prev;
      if (!next) {
        setTree((currentTree) =>
          mapTreeNodes(currentTree, (node) => ({
            ...node,
            style_json: sanitizeStyleForStrictMode(node.style_json, node?.nodeType),
          }))
        );
        setHasUnpublishedEdits(true);
      }
      return next;
    });
  }, []);

  // Must use the same normalizeResponsiveStyle(nodeType) path as treeNeedsStrictSanitize, or this
  // effect can re-run forever (tree dep → setTree → new tree ref → still "needs" sanitize).
  const strictSanitizePassRef = useRef(0);
  useEffect(() => {
    strictSanitizePassRef.current = 0;
  }, [pid]);
  useEffect(() => {
    if (isFreeMode) return;
    if (!tree?.length) return;
    if (!treeNeedsStrictSanitize(tree)) {
      strictSanitizePassRef.current = 0;
      return;
    }
    if (strictSanitizePassRef.current >= 2) return;
    strictSanitizePassRef.current += 1;
    setTree((currentTree) =>
      mapTreeNodes(currentTree, (node) => ({
        ...node,
        style_json: sanitizeStyleForStrictMode(node.style_json, node?.nodeType),
      }))
    );
    setHasUnpublishedEdits(true);
  }, [isFreeMode, tree]);

  const MAX_HISTORY = 60;

  const pushHistorySnapshot = useCallback((snapshot) => {
    const cloned = cloneTreeSnapshot(snapshot);
    setUndoStack((prev) => {
      const next = [...prev, { ts: Date.now(), tree: cloned }];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, []);

  const applyTreeWithSelectionGuard = useCallback((nextTree) => {
    setTree(nextTree);
    setSelectedNodeId((prev) => {
      if (prev != null && findNodeInTree(nextTree, prev)) return prev;
      return nextTree[0]?.id ?? null;
    });
  }, []);

  const reloadBuilder = useCallback(async (signal) => {
    setErrorMessage('');
    let response;
    try {
      response = await fetch(`/api/pages/${pid}/builder`, { cache: 'no-store', signal });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      throw err;
    }
    const data = await readJsonSafe(response);
    if (!response.ok) {
      throw new Error(formatLoadError(data, response));
    }
    if (signal?.aborted) return;
    const nextTree = reconcileStructuralParents(autoFixTree(data.tree || []));
    setPage(data.page);
    setDraftVersion(data.draftVersion || null);
    setTree(nextTree);
    setProjectPages(Array.isArray(data.projectPages) ? data.projectPages : []);
    setSelectedNodeId((prev) => {
      if (prev != null && findNodeInTree(nextTree, prev)) return prev;
      return nextTree[0]?.id ?? null;
    });
    setHasUnpublishedEdits(false);
  }, [pid]);

  useEffect(() => {
    if (!pageIdValid) {
      setIsLoading(false);
      setErrorMessage('Invalid page id in URL.');
      return;
    }

    const ac = new AbortController();
    let cancelled = false;
    const loadBuilder = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        await reloadBuilder(ac.signal);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        if (!cancelled) {
          setErrorMessage(humanizeClientError(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBuilder();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [pageIdValid, reloadBuilder]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return findNodeInTree(tree, selectedNodeId);
  }, [tree, selectedNodeId]);

  const selectionBreadcrumb = useMemo(() => {
    if (!selectedNodeId) return null;
    const findPath = (nodes, targetId, path = []) => {
      for (const node of nodes || []) {
        const label =
          node?.nodeType === 'row'
            ? 'Section'
            : node?.nodeType === 'column'
              ? 'Column'
              : node?.nodeType === 'stack'
                ? 'Stack'
                : 'Widget';
        const nextPath = [...path, label];
        if (node?.id === targetId) return nextPath;
        const childPath = findPath(node.children || [], targetId, nextPath);
        if (childPath) return childPath;
      }
      return null;
    };
    return findPath(tree || [], selectedNodeId);
  }, [tree, selectedNodeId]);

  const pageSectionRows = useMemo(() => collectRowsInDocOrder(tree), [tree]);

  const activeSectionRowId = useMemo(() => {
    if (!selectedNodeId) return null;
    if (selectedNode?.nodeType === 'row') return selectedNode.id;
    return findAncestorRowId(tree, selectedNodeId);
  }, [tree, selectedNodeId, selectedNode]);

  const interiorScopeRow = useMemo(() => {
    if (activeSectionRowId == null) return null;
    return findNodeInTree(tree, activeSectionRowId);
  }, [tree, activeSectionRowId]);

  const liveUrl =
    page?.projectSlug && page?.slug ? `/${page.projectSlug}/${page.slug}` : null;
  const previewUrl = pageIdValid ? `/preview/${pid}` : null;
  const canOpenLivePreview = Boolean(liveUrl && page?.publishedVersionId);
  const projectTemplates = Array.isArray(page?.projectConfig?.pageTemplates) ? page.projectConfig.pageTemplates : [];

  // Auto-seed an empty page with a full-page template once (UX: user can start styling immediately).
  useEffect(() => {
    if (!pageIdValid) return;
    if (isLoading) return;
    if (errorMessage) return;
    if (tree?.length) return;
    if (isCreatingNode) return;
    if (typeof window === 'undefined') return;

    const key = `bld:auto-seed:v1:page:${pid}`;
    if (window.localStorage.getItem(key) === '1') return;
    window.localStorage.setItem(key, '1');

    // Seed with the conversion outline (matches the landing-page flow screenshot).
    void handleApplyFullPageTemplate({ templateId: 'conversion-landing-outline', mode: 'replace' });
  }, [pageIdValid, pid, isLoading, errorMessage, tree?.length, isCreatingNode]);

  useEffect(() => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/reusable-blocks`);
        const data = await readJsonSafe(res);
        if (!res.ok) return;
        if (!cancelled) setReusableBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      } catch {
        // ignore — reusable blocks are optional
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page?.projectId]);

  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
    const node = findNodeInTree(tree, nodeId);
    if (!node) return;
    const isContainer = node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack';
    setInspectorTab(isContainer ? 'style' : 'content');
  };

  const handleNodeUpdate = async ({ nodeId, payload }) => {
    const normalizeNodeId = (raw) => {
      const s = String(raw ?? '').trim();
      if (!s) return null;
      const m = s.match(/\d+/);
      const n = m ? Number(m[0]) : NaN;
      return Number.isInteger(n) && n > 0 ? n : null;
    };
    const normalizedNodeId = normalizeNodeId(nodeId);
    if (!normalizedNodeId) {
      setErrorMessage('Invalid node id');
      return;
    }
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsSavingNode(true);
    setErrorMessage('');
    setTree((prev) =>
      updateNodeInTree(prev, normalizedNodeId, (node) => ({
        ...node,
        displayName: payload.displayName ?? node.displayName,
        props: payload.props ? { ...node.props, ...payload.props } : node.props,
        style_json: payload.style_json ?? node.style_json,
        dataJson: payload.dataJson !== undefined ? payload.dataJson : node.dataJson,
        actionsJson: payload.actionsJson !== undefined ? payload.actionsJson : node.actionsJson,
      }))
    );

    try {
      const response = await fetch(`/api/nodes/${normalizedNodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update node');
      }
      setTree(data.tree || beforeTree);
      setHasUnpublishedEdits(true);
    } catch (error) {
      setTree(beforeTree);
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error.message);
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleSetContainerDirection = async ({ nodeId, direction }) => {
    if (!nodeId) return;
    if (direction !== 'row' && direction !== 'column') return;
    const node = findNodeInTree(tree, nodeId);
    if (!node) return;

    const normalizedCurrent = normalizeResponsiveStyle(node.style_json || node.props?.style_json || {}, {
      nodeType: node.nodeType,
      siteTheme: shellSiteTheme,
    });
    const desktopBase = normalizedCurrent.desktop || {};
    const currentForDevice = getDeviceStyle(normalizedCurrent, device);
    const targetLayout = {
      ...(currentForDevice.layout || {}),
      display: 'flex',
      flexDirection: direction,
      alignItems: currentForDevice.layout?.alignItems || 'center',
      justifyContent: currentForDevice.layout?.justifyContent || 'flex-start',
    };

    const style_json = {
      ...normalizedCurrent,
      desktop: desktopBase,
    };

    const buildOverride = (baseGroup = {}, mergedGroup = {}) => {
      const out = {};
      Object.keys(mergedGroup).forEach((key) => {
        if (mergedGroup[key] !== baseGroup[key]) out[key] = mergedGroup[key];
      });
      return Object.keys(out).length ? out : undefined;
    };

    if (device === 'desktop') {
      style_json.desktop = {
        ...currentForDevice,
        layout: targetLayout,
      };
    } else {
      style_json[device] = {
        ...(style_json[device] || {}),
        layout: buildOverride(desktopBase.layout, targetLayout),
      };
      if (!style_json[device].layout) {
        delete style_json[device].layout;
      }
    }

    await handleNodeUpdate({
      nodeId,
      payload: { style_json },
    });
  };

  /** Full-width section: stretch row + reset column flex so content uses the whole artboard (not a narrow strip). */
  const handleStretchSectionFullWidth = async ({ rowId }) => {
    const rowNode = findNodeInTree(tree, rowId);
    if (!rowNode || rowNode.nodeType !== 'row') return;

    const rowStyle = normalizeResponsiveStyle(rowNode.style_json || {}, {
      nodeType: 'row',
      siteTheme: shellSiteTheme,
    });
    const rd = getDeviceStyle(rowStyle, 'desktop') || {};
    const nextRowStyle = {
      ...rowStyle,
      desktop: {
        ...rd,
        layout: {
          ...(rd.layout || {}),
          display: rd.layout?.display || 'flex',
          flexDirection: rd.layout?.flexDirection || 'row',
          maxWidth: '100%',
          boxSizing: 'border-box',
        },
        size: {
          ...(rd.size || {}),
          width: '100%',
        },
      },
    };
    await handleNodeUpdate({
      nodeId: rowId,
      payload: { style_json: nextRowStyle },
    });

    const columns = (rowNode.children || []).filter((c) => c.nodeType === 'column');
    for (const col of columns) {
      const cs = normalizeResponsiveStyle(col.style_json || {}, {
        nodeType: 'column',
        siteTheme: shellSiteTheme,
      });
      const cd = getDeviceStyle(cs, 'desktop') || {};
      const isSingle = columns.length === 1;
      const nextCol = {
        ...cs,
        desktop: {
          ...cd,
          layout: {
            ...(cd.layout || {}),
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: '0%',
            minWidth: 0,
          },
          size: {
            ...(cd.size || {}),
            width: isSingle ? '100%' : 'auto',
          },
        },
      };
      // eslint-disable-next-line no-await-in-loop
      await handleNodeUpdate({
        nodeId: col.id,
        payload: { style_json: nextCol },
      });

      for (const ch of col.children || []) {
        if (ch.nodeType !== 'stack') continue;
        const ss = normalizeResponsiveStyle(ch.style_json || {}, {
          nodeType: 'stack',
          siteTheme: shellSiteTheme,
        });
        const sd = getDeviceStyle(ss, 'desktop') || {};
        const nextStack = {
          ...ss,
          desktop: {
            ...sd,
            layout: {
              ...(sd.layout || {}),
              maxWidth: '100%',
              boxSizing: 'border-box',
            },
            size: {
              ...(sd.size || {}),
              width: '100%',
            },
          },
        };
        // eslint-disable-next-line no-await-in-loop
        await handleNodeUpdate({
          nodeId: ch.id,
          payload: { style_json: nextStack },
        });
      }
    }
  };

  const handleStretchSectionFromSelection = async () => {
    const rowId = findAncestorRowId(tree, selectedNodeId);
    if (!rowId) return;
    await handleStretchSectionFullWidth({ rowId });
  };

  const handleAlignMenuRightFromSelection = async () => {
    const rowId = findAncestorRowId(tree, selectedNodeId);
    if (!rowId) return;
    await handleAlignMenuRightInRow({ rowId });
  };

  const handleAlignMenuRightInRow = async ({ rowId }) => {
    const rowNode = findNodeInTree(tree, rowId);
    if (!rowNode || rowNode.nodeType !== 'row') return;

    let targetStackId = null;
    let menuNodeId = null;
    const menuButtonIds = [];
    let logoImageNodeId = null;
    let hasMenuWidget = false;
    walkNodes(rowNode.children || [], (node) => {
      if (hasMenuWidget) return;
      if (node.nodeType === 'menu') {
        hasMenuWidget = true;
        targetStackId = node.parentNodeId || null;
        menuNodeId = node.id;
      }
    });

    if (!targetStackId) {
      walkNodes(rowNode.children || [], (node) => {
        if (targetStackId) return;
        if (node.nodeType === 'button' && String(node.displayName || '').toLowerCase().includes('menu')) {
          targetStackId = node.parentNodeId || null;
          menuNodeId = node.id;
        }
      });
    }

    walkNodes(rowNode.children || [], (node) => {
      if (node.nodeType !== 'button') return;
      const label = String(node.displayName || node.props?.text || '').toLowerCase();
      if (label.includes('menu') || ['home', 'about', 'services', 'contact'].some((key) => label.includes(key))) {
        menuButtonIds.push(node.id);
      }
    });

    if (!targetStackId && menuButtonIds.length) {
      const firstBtn = findNodeInTree(tree, menuButtonIds[0]);
      targetStackId = firstBtn?.parentNodeId ?? null;
    }

    walkNodes(rowNode.children || [], (node) => {
      if (logoImageNodeId) return;
      if (node.nodeType === 'image') {
        logoImageNodeId = node.id;
      }
    });
    if (!targetStackId) return;

    const targetStack = findNodeInTree(tree, targetStackId);
    if (!targetStack) return;
    const menuNode = menuNodeId ? findNodeInTree(tree, menuNodeId) : null;
    const logoNode = logoImageNodeId ? findNodeInTree(tree, logoImageNodeId) : null;

    const stackStyle = normalizeResponsiveStyle(targetStack.style_json || {}, {
      nodeType: 'stack',
      siteTheme: shellSiteTheme,
    });
    const stackDesktop = getDeviceStyle(stackStyle, 'desktop') || {};
    const nextStackStyle = {
      ...stackStyle,
      desktop: {
        ...stackDesktop,
        layout: {
          ...(stackDesktop.layout || {}),
          display: 'flex',
          flexDirection: 'row',
          /* flex-start so first nav button can use margin-left:auto to group logo left / links right */
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
          gap: stackDesktop.layout?.gap ?? themeSpacingPx(shellSiteTheme, 'lg'),
        },
        spacing: {
          ...(stackDesktop.spacing || {}),
          padding: stackDesktop.spacing?.padding || '16px 32px',
        },
      },
    };

    const rowStyle = normalizeResponsiveStyle(rowNode.style_json || {}, {
      nodeType: 'row',
      siteTheme: shellSiteTheme,
    });
    const rowDesktop = getDeviceStyle(rowStyle, 'desktop') || {};
    const nextRowStyle = {
      ...rowStyle,
      desktop: {
        ...rowDesktop,
        layout: {
          ...(rowDesktop.layout || {}),
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
        },
        size: {
          ...(rowDesktop.size || {}),
          minHeight: rowDesktop.size?.minHeight || '96px',
        },
      },
    };

    await handleNodeUpdate({
      nodeId: targetStack.id,
      payload: { style_json: nextStackStyle },
    });
    await handleNodeUpdate({
      nodeId: rowNode.id,
      payload: { style_json: nextRowStyle },
    });
    if (menuNode) {
      const menuStyle = normalizeResponsiveStyle(menuNode.style_json || {}, {
        nodeType: 'menu',
        siteTheme: shellSiteTheme,
      });
      const menuDesktop = getDeviceStyle(menuStyle, 'desktop') || {};
      const nextMenuStyle = {
        ...menuStyle,
        desktop: {
          ...menuDesktop,
          size: {
            ...(menuDesktop.size || {}),
            width: 'auto',
          },
          typography: {
            ...(menuDesktop.typography || {}),
            fontSize: menuDesktop.typography?.fontSize || '15px',
            fontWeight: menuDesktop.typography?.fontWeight || '600',
          },
          layout: {
            ...(menuDesktop.layout || {}),
            gap: menuDesktop.layout?.gap ?? themeSpacingPx(shellSiteTheme, 'md'),
          },
          spacing: {
            ...(menuDesktop.spacing || {}),
            margin: '0px 0px 0px auto',
          },
          menu: {
            ...(menuDesktop.menu || {}),
            gap:
              menuDesktop.menu?.gap ??
              menuDesktop.layout?.gap ??
              themeSpacingPx(shellSiteTheme, 'md'),
          },
        },
      };
      await handleNodeUpdate({
        nodeId: menuNode.id,
        payload: { style_json: nextMenuStyle },
      });
    }

    if (menuButtonIds.length) {
      const navSet = new Set(menuButtonIds);
      const orderedChildren = [...(targetStack.children || [])].sort(
        (a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0)
      );
      let firstNavButtonId = null;
      for (const ch of orderedChildren) {
        if (ch.nodeType === 'button' && navSet.has(ch.id)) {
          firstNavButtonId = ch.id;
          break;
        }
      }

      const uniqueButtonIds = [...new Set(menuButtonIds)];
      const stackButtons = uniqueButtonIds
        .map((id) => findNodeInTree(tree, id))
        .filter((btn) => btn && btn.parentNodeId === targetStack.id);

      for (let index = 0; index < stackButtons.length; index += 1) {
        const buttonNode = stackButtons[index];
        const buttonStyle = normalizeResponsiveStyle(buttonNode.style_json || {}, {
          nodeType: 'button',
          siteTheme: shellSiteTheme,
        });
        const buttonDesktop = getDeviceStyle(buttonStyle, 'desktop') || {};
        const pushRight = firstNavButtonId != null && buttonNode.id === firstNavButtonId;
        const nextButtonStyle = {
          ...buttonStyle,
          desktop: {
            ...buttonDesktop,
            layout: {
              ...(buttonDesktop.layout || {}),
              display: 'inline-flex',
              flexShrink: 0,
              position: 'relative',
              left: 'auto',
              top: 'auto',
            },
            size: {
              ...(buttonDesktop.size || {}),
              width: 'auto',
            },
            spacing: {
              ...(buttonDesktop.spacing || {}),
              margin: pushRight ? '0px 0px 0px auto' : '0px',
            },
          },
        };
        // eslint-disable-next-line no-await-in-loop
        await handleNodeUpdate({
          nodeId: buttonNode.id,
          payload: { style_json: nextButtonStyle },
        });
      }
    }
    if (logoNode) {
      const logoStyle = normalizeResponsiveStyle(logoNode.style_json || {}, {
        nodeType: 'image',
        siteTheme: shellSiteTheme,
      });
      const logoDesktop = getDeviceStyle(logoStyle, 'desktop') || {};
      const nextLogoStyle = {
        ...logoStyle,
        desktop: {
          ...logoDesktop,
          size: {
            ...(logoDesktop.size || {}),
            width: logoDesktop.size?.width || '180px',
            height: 'auto',
          },
        },
      };
      await handleNodeUpdate({
        nodeId: logoNode.id,
        payload: { style_json: nextLogoStyle },
      });
    }
  };

  const handleUploadLogoInRow = async ({ rowId }) => {
    if (typeof window === 'undefined') return;
    const rowNode = findNodeInTree(tree, rowId);
    if (!rowNode || rowNode.nodeType !== 'row') return;

    let logoImageNode = null;
    walkNodes(rowNode.children || [], (node) => {
      if (logoImageNode) return;
      if (node.nodeType === 'image') {
        logoImageNode = node;
      }
    });
    if (!logoImageNode) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = event.target?.files?.[0];
      if (!file || !file.type?.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (!src) return;
        await handleNodeUpdate({
          nodeId: logoImageNode.id,
          payload: {
            props: {
              ...(logoImageNode.props || {}),
              src,
              alt: (logoImageNode.props?.alt || file.name || 'Company logo').replace(/\.[^.]+$/, ''),
            },
          },
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const createNodeRequest = async ({
    nodeType,
    parentNodeId = null,
    displayName,
    props,
    style_json,
    positionIndex,
    dataJson,
    actionsJson,
  }) => {
    let response;
    try {
      response = await fetch(`/api/pages/${pid}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeType,
        parentNodeId: parentNodeId || null,
        displayName: displayName || `${nodeType[0].toUpperCase()}${nodeType.slice(1)} Block`,
        props:
          props || {
            text:
              nodeType === 'heading'
                ? 'New heading'
                : nodeType === 'text'
                  ? 'New paragraph'
                  : nodeType === 'button'
                    ? 'Click me'
                    : '',
            src: nodeType === 'image' ? '/builder-placeholder.svg' : undefined,
            items:
              nodeType === 'menu'
                ? [
                    { label: 'Home', to: '/' },
                    { label: 'About', to: '/about' },
                    { label: 'Contact', to: '/contact' },
                  ]
                : undefined,
            ariaLabel: nodeType === 'menu' ? 'Main navigation' : undefined,
            content:
              nodeType === 'rich_text'
                ? '<p>Start typing. Double‑click to edit.</p>'
                : undefined,
          },
        style_json,
        ...(dataJson !== undefined ? { dataJson } : {}),
        ...(actionsJson !== undefined ? { actionsJson } : {}),
        ...(Number.isInteger(positionIndex) ? { positionIndex } : {}),
      }),
    });
    } catch (error) {
      throw new Error(humanizeClientError(error));
    }
    const data = await readJsonSafe(response);
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create node');
    }

    if (data.tree) {
      setTree(data.tree);
    } else if (data.node) {
      setTree((prev) =>
        addNodeToTree(prev, parentNodeId, {
          ...data.node,
          pageId: data.node.page_id,
          versionId: data.node.version_id,
          parentNodeId: data.node.parent_node_id,
          nodeType: data.node.node_type,
          displayName: data.node.display_name,
          positionIndex: data.node.position_index,
          props: data.node.props || {},
          style_json: data.node.style_json || data.node.props?.style_json,
          children: [],
        })
      );
    }
    return data.node || null;
  };

  const bulkCreateNodesRequest = async (nodes) => {
    let response;
    try {
      response = await fetch(`/api/pages/${pid}/nodes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes }),
      });
    } catch (error) {
      throw new Error(humanizeClientError(error));
    }
    const data = await readJsonSafe(response);
    if (!response.ok) {
      throw new Error(data.error || 'Failed to bulk create nodes');
    }
    if (data.tree) {
      setTree(data.tree);
    }
    return data;
  };

  const deleteRootRowsInOrder = async (treeSnapshot) => {
    const roots = Array.isArray(treeSnapshot) ? treeSnapshot : [];
    for (const node of roots) {
      if (!node?.id) continue;
      // eslint-disable-next-line no-await-in-loop
      await deleteNodeRequest(node.id);
    }
  };

  const bulkInsertTemplateRootsAtIndex = async ({ roots, insertIndex }) => {
    const flattened = flattenTemplateToBulkNodes(roots, 0);
    // Offset ONLY root positionIndex values (rows without parentRef).
    const offset = Number.isInteger(Number(insertIndex)) ? Number(insertIndex) : 0;
    const nodes = flattened.map((n) => (n.parentRef ? n : { ...n, positionIndex: Number(n.positionIndex) + offset }));
    return await bulkCreateNodesRequest(nodes);
  };

  const handleApplyFullPageTemplate = async ({ templateId, mode }) => {
    const tpl = getFullPageTemplateById(templateId);
    if (!tpl?.roots?.length) return;
    if (isCreatingNode) return;
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      if (String(mode) === 'replace') {
        await deleteRootRowsInOrder(tree);
        await bulkInsertTemplateRootsAtIndex({ roots: tpl.roots, insertIndex: 0 });
      } else {
        const insertIndex = countRootRows(tree || []);
        await bulkInsertTemplateRootsAtIndex({ roots: tpl.roots, insertIndex });
      }
      await reloadBuilder();
      setHasUnpublishedEdits(true);
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const deleteNodeRequest = async (nodeId) => {
    const normalizedNodeId = Number(nodeId);
    if (!Number.isInteger(normalizedNodeId) || normalizedNodeId <= 0) {
      throw new Error('Invalid node id for delete');
    }
    const response = await fetch(`/api/nodes/${normalizedNodeId}`, { method: 'DELETE' });
    const data = await readJsonSafe(response);
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete node');
    }
    if (data.tree) {
      setTree(data.tree);
    }
    return data;
  };

  const WIDGET_NODE_TYPES = new Set([
    'heading',
    'text',
    'rich_text',
    'image',
    'button',
    'menu',
    'table',
    'form',
  ]);

  const resolveQuickAddParentId = async ({ targetNodeId, nodeType }) => {
    const target = findNodeInTree(tree, targetNodeId);
    if (!target?.id) return targetNodeId || null;
    if (!WIDGET_NODE_TYPES.has(nodeType)) return target.id;
    if (target.nodeType === 'stack') return target.id;
    if (target.nodeType === 'column') {
      const existingStack = Array.isArray(target.children)
        ? target.children.find((child) => child?.nodeType === 'stack')
        : null;
      if (existingStack?.id) return existingStack.id;
      const stack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: target.id,
        displayName: 'Stack Block',
      });
      return stack?.id || null;
    }
    if (target.nodeType === 'row') {
      const columns = (target.children || []).filter((child) => child?.nodeType === 'column');
      for (const col of columns) {
        const stack = (col.children || []).find((child) => child?.nodeType === 'stack');
        if (stack?.id && !(stack.children || []).length) {
          return stack.id;
        }
      }
      for (const col of columns) {
        const stack = (col.children || []).find((child) => child?.nodeType === 'stack');
        if (!stack?.id) {
          const newStack = await createNodeRequest({
            nodeType: 'stack',
            parentNodeId: col.id,
            displayName: 'Stack Block',
          });
          return newStack?.id || null;
        }
      }
      if (columns.length > 0) {
        const newColumn = await createNodeRequest({
          nodeType: 'column',
          parentNodeId: target.id,
          displayName: `Column ${columns.length + 1}`,
          positionIndex: columns.length,
        });
        if (!newColumn?.id) return null;
        const stack = await createNodeRequest({
          nodeType: 'stack',
          parentNodeId: newColumn.id,
          displayName: 'Stack Block',
          positionIndex: 0,
        });
        return stack?.id || null;
      }
      const column = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: target.id,
        displayName: 'Column Block',
      });
      if (!column?.id) return null;
      const stack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: column.id,
        displayName: 'Stack Block',
      });
      return stack?.id || null;
    }
    return target.parentNodeId || null;
  };

  const handleCreateNode = async ({ nodeType, parentNodeId }) => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      let effectiveParentId = parentNodeId;
      if (parentNodeId && WIDGET_NODE_TYPES.has(nodeType)) {
        const resolved = await resolveQuickAddParentId({ targetNodeId: parentNodeId, nodeType });
        if (resolved != null) effectiveParentId = resolved;
      }
      const node = await createNodeRequest({ nodeType, parentNodeId: effectiveParentId });
      if (node?.id) {
        // Auto-scaffold empty containers so the user always gets:
        // Section(Row) -> Column -> Stack, and Column -> Stack.
        if (nodeType === 'row') {
          const column = await createNodeRequest({
            nodeType: 'column',
            parentNodeId: node.id,
            displayName: 'Column 1',
            positionIndex: 0,
          });
          if (column?.id) {
            await createNodeRequest({
              nodeType: 'stack',
              parentNodeId: column.id,
              displayName: 'Stack 1',
              positionIndex: 0,
            });
          }
          await reloadBuilder();
        } else if (nodeType === 'column') {
          await createNodeRequest({
            nodeType: 'stack',
            parentNodeId: node.id,
            displayName: 'Stack 1',
            positionIndex: 0,
          });
          await reloadBuilder();
        }
        setSelectedNodeId(node.id);
      }
      setHasUnpublishedEdits(true);
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error.message);
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleQuickAddNode = async ({ targetNodeId, nodeType }) => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const resolvedParentNodeId = await resolveQuickAddParentId({ targetNodeId, nodeType });
      if (resolvedParentNodeId == null && nodeType !== 'row') {
        throw new Error('Could not resolve quick-add target');
      }
      const node = await createNodeRequest({ nodeType, parentNodeId: resolvedParentNodeId });
      if (node?.id) setSelectedNodeId(node.id);
      setHasUnpublishedEdits(true);
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error.message);
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleCreateSection = async ({ columnCount, insertIndex = null }) => {
    if (isCreatingNode) return;
    const nextColumnCount = Number(columnCount);
    if (!Number.isInteger(nextColumnCount) || nextColumnCount < 1) return;
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const row = await createNodeRequest({
        nodeType: 'row',
        parentNodeId: null,
        displayName: 'Section',
        ...(Number.isInteger(insertIndex) ? { positionIndex: insertIndex } : {}),
      });
      if (!row?.id) throw new Error('Failed to create section');

      for (let i = 0; i < nextColumnCount; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const column = await createNodeRequest({
          nodeType: 'column',
          parentNodeId: row.id,
          displayName: `Column ${i + 1}`,
          positionIndex: i,
        });
        if (!column?.id) throw new Error('Failed to create section column');
        // eslint-disable-next-line no-await-in-loop
        await createNodeRequest({
          nodeType: 'stack',
          parentNodeId: column.id,
          displayName: `Stack ${i + 1}`,
          positionIndex: 0,
        });
      }

      await reloadBuilder();
      setSelectedNodeId(row.id);
      setHasUnpublishedEdits(true);
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleInsertSectionTemplate = async (key, { insertIndex = null } = {}) => {
    const roots = SECTION_TEMPLATES[key];
    if (!roots?.length) return;
    if (isCreatingNode) return;
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const rootIds = await materializeSectionTemplate(roots, {
        bulkCreateNodesRequest: (nodes) => bulkCreateNodesRequest(nodes),
        createNodeRequest: (payload) => createNodeRequest(payload),
        positionIndex: Number.isInteger(Number(insertIndex)) ? Number(insertIndex) : null,
      });
      await reloadBuilder();
      if (rootIds?.length) {
        setSelectedNodeId(rootIds[0]);
        setFlashReorderNodeId(rootIds[0]);
      }
      setHasUnpublishedEdits(true);
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const createStackWithContent = async ({ parentColumnId, title, body, ctaText, imageSrc, imageAlt }) => {
    const stack = await createNodeRequest({
      nodeType: 'stack',
      parentNodeId: parentColumnId,
      displayName: `${title} Stack`,
      style_json: {
        desktop: {
          spacing: { padding: '12px' },
        },
      },
    });
    if (!stack?.id) {
      throw new Error('Failed to create stack in template');
    }
    await createNodeRequest({
      nodeType: 'heading',
      parentNodeId: stack.id,
      displayName: `${title} Heading`,
      props: { text: title },
    });
    await createNodeRequest({
      nodeType: 'text',
      parentNodeId: stack.id,
      displayName: `${title} Text`,
      props: { text: body },
    });
    if (imageSrc) {
      await createNodeRequest({
        nodeType: 'image',
        parentNodeId: stack.id,
        displayName: `${title} Image`,
        props: { src: imageSrc, alt: imageAlt || title },
      });
    }
    if (ctaText) {
      await createNodeRequest({
        nodeType: 'button',
        parentNodeId: stack.id,
        displayName: `${title} Button`,
        props: { text: ctaText },
      });
    }
    return stack.id;
  };

  const handleInsertStarterTemplate = async ({ targetRowId = null } = {}) => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      let rowId = targetRowId;
      if (!rowId) {
        const row = await createNodeRequest({
          nodeType: 'row',
          parentNodeId: null,
          displayName: 'Hero Section',
          style_json: {
            desktop: {
              layout: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              },
              spacing: {
                padding: '72px 56px',
                margin: '0px 0px 24px 0px',
              },
              background: {
                backgroundColor: '#0b1220',
                backgroundImage:
                  "linear-gradient(rgba(3,8,20,0.55), rgba(3,8,20,0.55)), url('https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1974&auto=format&fit=crop')",
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              },
              effects: {
                borderRadius: '20px',
              },
            },
          },
        });
        rowId = row?.id || null;
      }
      if (!rowId) throw new Error('Could not create template row');

      const leftColumn = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: rowId,
        displayName: 'Hero Left',
        style_json: {
          desktop: {
            spacing: { padding: '8px' },
            size: { width: '58%' },
            layout: { position: 'relative', zIndex: '2' },
          },
        },
      });
      const rightColumn = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: rowId,
        displayName: 'Hero Right',
        style_json: {
          desktop: {
            spacing: { padding: '8px' },
            size: { width: '42%', minHeight: '380px' },
            layout: { position: 'relative' },
          },
        },
      });
      if (!leftColumn?.id || !rightColumn?.id) {
        throw new Error('Could not create hero columns');
      }

      const leftStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: leftColumn.id,
        displayName: 'Hero Content Stack',
        style_json: {
          desktop: {
            spacing: { padding: '12px' },
            layout: { position: 'relative', zIndex: '2' },
          },
        },
      });
      if (!leftStack?.id) throw new Error('Could not create hero content stack');
      await createNodeRequest({
        nodeType: 'heading',
        parentNodeId: leftStack.id,
        displayName: 'Hero Heading',
        props: { text: 'Build premium landing pages faster' },
        style_json: {
          desktop: {
            typography: { fontSize: '52px', fontWeight: '800', color: '#ffffff' },
            spacing: { margin: '0px 0px 16px 0px' },
          },
        },
      });
      await createNodeRequest({
        nodeType: 'text',
        parentNodeId: leftStack.id,
        displayName: 'Hero Description',
        props: { text: 'Use sections, data widgets, and action-enabled buttons in one universal builder flow.' },
        style_json: {
          desktop: {
            typography: { fontSize: '18px', color: 'rgba(255,255,255,0.86)' },
            spacing: { margin: '0px 0px 24px 0px' },
          },
        },
      });
      await createNodeRequest({
        nodeType: 'button',
        parentNodeId: leftStack.id,
        displayName: 'Hero CTA',
        props: { text: 'Start Building' },
        style_json: {
          desktop: {
            spacing: { padding: '12px 18px' },
            background: { backgroundColor: '#4f7cff' },
            typography: { color: '#ffffff', fontWeight: '700' },
            effects: { borderRadius: '10px', boxShadow: '0 10px 30px rgba(79,124,255,.35)' },
          },
        },
      });

      const visualStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: rightColumn.id,
        displayName: 'Hero Visual Base',
        style_json: {
          desktop: {
            layout: { position: 'relative' },
            size: { height: '380px' },
            effects: { borderRadius: '18px' },
            background: {
              backgroundImage:
                "url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1974&auto=format&fit=crop')",
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            },
          },
        },
      });
      if (!visualStack?.id) throw new Error('Could not create hero visual block');
      const overlayCard = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: rightColumn.id,
        displayName: 'Hero Overlay Card',
        style_json: {
          desktop: {
            layout: {
              position: 'absolute',
              bottom: '20px',
              left: '-28px',
              zIndex: '3',
            },
            spacing: { padding: '16px 18px' },
            size: { width: '260px' },
            background: { backgroundColor: 'rgba(17,24,39,0.88)' },
            effects: {
              borderRadius: '12px',
              boxShadow: '0 12px 30px rgba(0,0,0,.28)',
            },
          },
        },
      });
      if (!overlayCard?.id) throw new Error('Could not create overlay card');
      await createNodeRequest({
        nodeType: 'text',
        parentNodeId: overlayCard.id,
        displayName: 'Overlay Label',
        props: { text: 'Growth this week' },
        style_json: { desktop: { typography: { color: 'rgba(255,255,255,0.72)', fontSize: '13px' } } },
      });
      await createNodeRequest({
        nodeType: 'heading',
        parentNodeId: overlayCard.id,
        displayName: 'Overlay Value',
        props: { text: '+24.8%' },
        style_json: {
          desktop: {
            typography: { color: '#ffffff', fontSize: '32px', fontWeight: '800' },
            spacing: { margin: '4px 0px 0px 0px' },
          },
        },
      });

      await reloadBuilder();
      setSelectedNodeId(rowId);
      setHasUnpublishedEdits(true);
      setLeftPanelTab('layers');
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleInsertHeaderTemplate = async ({ targetRowId = null, replaceExisting = false } = {}) => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      let rowId =
        targetRowId ||
        (selectedNode?.nodeType === 'row' ? selectedNode.id : null);
      if (!rowId) {
        const row = await createNodeRequest({
          nodeType: 'row',
          parentNodeId: null,
          positionIndex: 0,
          displayName: 'Header',
          props: {
            meta: {
              isHeader: true,
              role: 'header',
              headerLayout: 'standard',
              headerAlign: 'between',
            },
          },
          style_json: {
            desktop: {
              layout: {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                gap: 18,
              },
              spacing: { padding: '14px 28px' },
              size: { minHeight: '72px' },
              background: { backgroundColor: '#ffffff' },
              effects: { boxShadow: '0 1px 0 rgba(15,23,42,0.08)' },
            },
            mobile: {
              layout: { flexDirection: 'column', alignItems: 'stretch', flexWrap: 'wrap', gap: 20 },
            },
          },
        });
        rowId = row?.id || null;
      }
      if (!rowId) throw new Error('Could not create header row');

      if (replaceExisting) {
        const targetRow = findNodeInTree(tree, rowId);
        const existingChildren = Array.isArray(targetRow?.children) ? targetRow.children : [];
        if (existingChildren.length) {
          const shouldReplace =
            typeof window === 'undefined'
              ? true
              : window.confirm(
                  'This will clear current row content and insert clean header layout. Continue?'
                );
          if (!shouldReplace) {
            setIsCreatingNode(false);
            return;
          }
          for (const child of existingChildren) {
            // eslint-disable-next-line no-await-in-loop
            await deleteNodeRequest(child.id);
          }
          // eslint-disable-next-line no-await-in-loop
          await reloadBuilder();
        }
      }

      /** Row → Column → Stack → blocks × 3 (logo | nav | actions). */
      const logoColumn = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: rowId,
        displayName: 'Logo',
        positionIndex: 0,
        style_json: {
          desktop: {
            layout: {
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: 'auto',
              alignItems: 'flex-start',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          },
          mobile: { size: { width: '100%' }, layout: { flexBasis: 'auto' } },
        },
      });
      const navColumn = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: rowId,
        displayName: 'Nav',
        positionIndex: 1,
        style_json: {
          desktop: {
            layout: {
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: '0%',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          },
          mobile: { size: { width: '100%' }, layout: { flexBasis: 'auto' } },
        },
      });
      const actionsColumn = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: rowId,
        displayName: 'Actions',
        positionIndex: 2,
        style_json: {
          desktop: {
            layout: {
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: 'auto',
              alignItems: 'flex-end',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          },
          mobile: { size: { width: '100%' }, layout: { flexBasis: 'auto' } },
        },
      });
      if (!logoColumn?.id || !navColumn?.id || !actionsColumn?.id) {
        throw new Error('Could not create header columns');
      }

      const logoStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: logoColumn.id,
        displayName: 'Logo stack',
        positionIndex: 0,
        style_json: {
          desktop: {
            layout: { width: '100%', justifyContent: 'flex-start', alignItems: 'center' },
          },
        },
      });
      const navStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: navColumn.id,
        displayName: 'Nav stack',
        positionIndex: 0,
        style_json: {
          desktop: {
            layout: {
              width: '100%',
              minWidth: 0,
              justifyContent: 'center',
              alignItems: 'center',
            },
          },
          mobile: {
            layout: { minWidth: 0 },
          },
        },
      });
      const actionsStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: actionsColumn.id,
        displayName: 'Actions stack',
        positionIndex: 0,
        style_json: {
          desktop: {
            layout: {
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 10,
              width: '100%',
            },
          },
          mobile: {
            layout: {
              flexDirection: 'row',
              flexWrap: 'nowrap',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: 10,
            },
          },
        },
      });
      if (!logoStack?.id || !navStack?.id || !actionsStack?.id) {
        throw new Error('Could not create header stacks');
      }

      await createNodeRequest({
        nodeType: 'image',
        parentNodeId: logoStack.id,
        displayName: 'Logo',
        positionIndex: 0,
        props: {
          src: '/builder-placeholder.svg',
          alt: 'Company logo',
        },
        style_json: {
          desktop: {
            size: { width: '180px', maxWidth: '100%', height: 'auto' },
          },
        },
      });

      await createNodeRequest({
        nodeType: 'menu',
        parentNodeId: navStack.id,
        displayName: 'Primary links',
        positionIndex: 0,
        props: {
          variant: 'inline',
          align: 'center',
          items: [
            { label: 'Home', to: '#' },
            { label: 'About Us', to: '#' },
            { label: 'Solutions', to: '#' },
            { label: 'Blog', to: '#' },
            { label: 'Contact Us', to: '#' },
          ],
        },
        style_json: {
          desktop: {
            typography: { fontSize: '14px', fontWeight: '600' },
            colors: { textColor: '#0f172a' },
            menu: { gap: 14, itemPadding: '8px 6px' },
          },
        },
      });

      await createNodeRequest({
        nodeType: 'button',
        parentNodeId: actionsStack.id,
        displayName: 'Login',
        positionIndex: 0,
        props: { text: 'Login' },
        style_json: {
          desktop: {
            layout: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
            spacing: { padding: '10px 16px' },
            typography: { fontSize: '14px', fontWeight: '700' },
            colors: { textColor: '#0f172a' },
            background: { backgroundColor: 'transparent' },
            border: { width: '1px', color: '#cbd5e1', radius: '10px' },
          },
        },
      });

      await createNodeRequest({
        nodeType: 'button',
        parentNodeId: actionsStack.id,
        displayName: 'Get Started',
        positionIndex: 1,
        props: { text: 'Get Started' },
        style_json: {
          desktop: {
            layout: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
            spacing: { padding: '10px 16px' },
            typography: { fontSize: '14px', fontWeight: '800' },
            colors: { textColor: '#ffffff' },
            background: { backgroundColor: '#2563eb' },
            border: { width: '1px', color: '#2563eb', radius: '10px' },
          },
        },
      });

      await reloadBuilder();
      setSelectedNodeId(rowId);
      setHasUnpublishedEdits(true);
      setLeftPanelTab('layers');
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    const normalizedNodeId = Number(nodeId);
    if (!Number.isInteger(normalizedNodeId) || normalizedNodeId <= 0) {
      setErrorMessage('Invalid node id for delete');
      return;
    }
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setErrorMessage('');
    const DELETE_ANIM_MS = 230;
    setDeletingNodeId(normalizedNodeId);
    setIsDeletingNode(true);
    try {
      await new Promise((r) => setTimeout(r, DELETE_ANIM_MS));
      const treeAfterLocalRemove = removeNodeFromTree(beforeTree, normalizedNodeId);
      setTree(treeAfterLocalRemove);
      setDeletingNodeId(null);
      setSelectedNodeId((current) => (current === normalizedNodeId ? null : current));

      const data = await deleteNodeRequest(normalizedNodeId);
      const nextTree = data.tree ?? treeAfterLocalRemove;
      setTree(nextTree);
      setSelectedNodeId((current) => {
        if (!current) return null;
        if (data.deletedIds?.includes(current)) return null;
        return hasNodeInTree(nextTree, current) ? current : null;
      });
      setHasUnpublishedEdits(true);
    } catch (error) {
      setTree(beforeTree);
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error.message);
    } finally {
      deleteInFlightRef.current = false;
      setIsDeletingNode(false);
      setDeletingNodeId(null);
    }
  };

  const handleDuplicateNode = useCallback(
    async (nodeId) => {
      if (!nodeId) return null;
      const beforeTree = tree;
      pushHistorySnapshot(beforeTree);
      setIsSavingNode(true);
      setErrorMessage('');
      try {
        const response = await fetch(`/api/nodes/${nodeId}/duplicate`, { method: 'POST' });
        const data = await readJsonSafe(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to duplicate node');
        }
        const nextTree = data.tree || beforeTree;
        setTree(nextTree);
        if (data.duplicatedNodeId) {
          setSelectedNodeId(data.duplicatedNodeId);
        }
        setHasUnpublishedEdits(true);
        return { duplicatedNodeId: data.duplicatedNodeId ?? null, tree: nextTree };
      } catch (error) {
        setTree(beforeTree);
        setUndoStack((prev) => prev.slice(0, -1));
        setErrorMessage(error.message);
        return null;
      } finally {
        setIsSavingNode(false);
      }
    },
    [tree, pushHistorySnapshot]
  );

  const handleReorderNode = async ({ nodeId, newParentId, newIndex, baseTree }) => {
    const nid = Number(nodeId);
    const idx = Number(newIndex);
    if (!Number.isFinite(nid) || nid <= 0) return;
    if (!Number.isFinite(idx) || idx < 0) return;
    const beforeTree = baseTree ?? tree;
    pushHistorySnapshot(beforeTree);
    setIsReorderingNode(true);
    setErrorMessage('');

    const detached = detachNode(beforeTree, nid);
    if (!detached.removed) {
      setUndoStack((prev) => prev.slice(0, -1));
      setIsReorderingNode(false);
      return;
    }
    const optimisticTree = normalizePositions(
      insertNode(detached.next, newParentId || null, idx, detached.removed)
    );
    setTree(optimisticTree);

    try {
      const response = await fetch('/api/nodes/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: nid, newParentId, newIndex: idx }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reorder node');
      }
      setTree(data.tree || optimisticTree);
      setHasUnpublishedEdits(true);
    } catch (error) {
      setTree(beforeTree);
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error.message);
    } finally {
      setIsReorderingNode(false);
    }
  };

  const handleMoveSectionRow = (rowId, delta) => {
    if (isReorderingNode) return;
    const rid = Number(rowId);
    if (!Number.isFinite(rid) || rid <= 0) return;
    const ctx = getSiblingContext(tree, rid);
    if (!ctx) return;
    const nextIndex = Number(ctx.index) + Number(delta);
    if (!Number.isFinite(nextIndex) || nextIndex < 0) return;
    if (Number.isFinite(ctx.siblingsCount) && nextIndex >= Number(ctx.siblingsCount)) return;
    handleReorderNode({ nodeId: rid, newParentId: ctx.parentId ?? null, newIndex: nextIndex });
  };

  const handlePasteNode = useCallback(async () => {
    const sourceId = copiedNodeId ?? selectedNodeId;
    if (!sourceId) return;
    const sid = Number(sourceId);
    const sourceNode = findNodeInTree(tree, sid);
    if (!sourceNode) {
      setCopiedNodeId(null);
      return;
    }
    const sourceType = sourceNode.nodeType;

    if (selectedNodeId) {
      const preview = computePastePlacement(tree, Number(selectedNodeId), sourceType);
      if (!preview) {
        setCopyToastMessage('Cannot paste into this selection.');
        return;
      }
    }

    const dup = await handleDuplicateNode(sid);
    if (!dup?.tree) return;

    const newId = Number(dup.duplicatedNodeId);
    if (Number.isFinite(newId) && newId > 0) {
      setFlashPasteNodeId(newId);
    }

    if (!selectedNodeId) return;

    if (!Number.isFinite(newId) || newId <= 0) return;

    const placement = computePastePlacement(dup.tree, Number(selectedNodeId), sourceType);
    if (!placement) return;

    const ctxNew = getSiblingContext(dup.tree, newId);
    if (!ctxNew) return;
    const sameParent =
      (placement.parentId == null && ctxNew.parentId == null) ||
      (placement.parentId != null && ctxNew.parentId === placement.parentId);
    const same = sameParent && ctxNew.index === placement.newIndex;
    if (same) return;

    await handleReorderNode({
      nodeId: newId,
      newParentId: placement.parentId,
      newIndex: placement.newIndex,
      baseTree: dup.tree,
    });
  }, [tree, selectedNodeId, copiedNodeId, handleDuplicateNode, handleReorderNode]);

  const handleSave = async () => {
    if (!pageIdValid) return;
    setIsSyncingDraft(true);
    setErrorMessage('');
    try {
      const fixedTree = autoFixTree(reconcileStructuralParents(tree));
      validateTree(fixedTree);
      const response = await fetch('/api/nodes/update-bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pid, nodes: fixedTree }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save draft');
      }
      if (data.tree) {
        setTree(reconcileStructuralParents(autoFixTree(data.tree)));
      } else {
        await reloadBuilder();
      }
      setHasUnpublishedEdits(false);
      setSaveAckVisible(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!pageIdValid) return;
    setIsPublishing(true);
    setErrorMessage('');
    try {
      // Always publish from authoritative draft nodes in DB to avoid
      // client-tree snapshot drift, duplicate blocks, or style conflicts.
      const treeForSync = autoFixTree(reconcileStructuralParents(tree));
      validateTree(treeForSync);
      const syncResponse = await fetch('/api/nodes/update-bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pid, nodes: treeForSync }),
      });
      const syncData = await readJsonSafe(syncResponse);
      if (!syncResponse.ok) {
        throw new Error(syncData.error || 'Failed to sync draft snapshot before publish');
      }

      const response = await fetch(`/api/pages/${pid}/publish`, { method: 'POST' });
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish');
      }
      await reloadBuilder();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveGlobalSection = async ({ rowId, role }) => {
    if (!page?.projectId || !pageIdValid) return;
    setIsSavingNode(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/projects/${page.projectId}/global-sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pid, rowId, role }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to save global section');
      await reloadBuilder();
    } catch (error) {
      setErrorMessage(humanizeClientError(error));
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleSavePageTemplate = async () => {
    if (!page?.projectId || !pageIdValid) return;
    const name = typeof window !== 'undefined' ? window.prompt('Template name', `${page?.title || 'Page'} Template`) : '';
    if (!name) return;
    setIsSavingNode(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/projects/${page.projectId}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pid, name }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to save page template');
      await reloadBuilder();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleSaveReusableBlock = async (rowId) => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    const rid = Number(rowId);
    if (!Number.isInteger(rid) || rid <= 0) return;
    const name = window.prompt('Reusable block name', 'Reusable Section');
    if (!name) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/reusable-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: pid, rowId: rid, name }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data.error || 'Failed to save reusable block');
      const next = await fetch(`/api/projects/${projectId}/reusable-blocks`);
      const nextData = await readJsonSafe(next);
      if (next.ok) setReusableBlocks(Array.isArray(nextData.blocks) ? nextData.blocks : []);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const handleConvertToGlobalComponent = async (rowId) => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    const rid = Number(rowId);
    if (!Number.isInteger(rid) || rid <= 0) return;
    const row = findNodeInTree(tree, rid);
    if (!row || row.nodeType !== 'row') return;
    if (isLinkedGlobalPlaceholder(row)) {
      setErrorMessage('This section is already linked to a global component.');
      return;
    }
    if (treeContainsLinkedGlobals([row])) {
      setErrorMessage('Cannot convert: this section contains linked global components (nested globals are blocked).');
      return;
    }

    const defaultName = row.displayName ? `Global: ${row.displayName}` : 'Global Component';
    const name = typeof window !== 'undefined' ? window.prompt('Global component name', defaultName) : defaultName;
    if (!name) return;

    pushHistorySnapshot(cloneTreeSnapshot(tree));
    setIsSavingNode(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/global-components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'section',
          name,
          nodes: [row],
        }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to create global component');
      const created = data?.item;
      if (!created?.id) throw new Error('Global component creation returned no id');

      // Remove existing section subtree to keep pages normalized (no expanded content stored in-page).
      const rowLatest = findNodeInTree(tree, rid) || row;
      const children = Array.isArray(rowLatest.children) ? rowLatest.children : [];
      for (const child of children) {
        // eslint-disable-next-line no-await-in-loop
        await deleteNodeRequest(child.id);
      }

      // Convert the row into a placeholder reference.
      await handleNodeUpdate({
        nodeId: rid,
        payload: {
          displayName: row.displayName || 'Global Section',
          props: {
            ...(row.props || {}),
            meta: {
              ...((row.props?.meta && typeof row.props.meta === 'object') ? row.props.meta : {}),
              globalMode: 'linked',
              globalComponentId: created.id,
              globalComponentName: created.name || name,
            },
          },
        },
      });

      globalComponentCacheRef.current?.set?.(Number(created.id), created);
      await fetchGlobalComponents().catch(() => {});
      setSelectedNodeId(rid);
      setHasUnpublishedEdits(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleDetachFromGlobalComponent = async (rowId) => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    const rid = Number(rowId);
    if (!Number.isInteger(rid) || rid <= 0) return;
    const row = findNodeInTree(tree, rid);
    if (!row || row.nodeType !== 'row') return;
    const meta = getGlobalLinkMeta(row);
    if (!meta?.globalComponentId) return;

    pushHistorySnapshot(cloneTreeSnapshot(tree));
    setIsSavingNode(true);
    setErrorMessage('');
    try {
      const gc = await getGlobalComponentSnapshotCached(meta.globalComponentId);
      const snapNodes = Array.isArray(gc?.snapshot?.nodes) ? gc.snapshot.nodes : [];
      if (!snapNodes.length) throw new Error('Global component snapshot is empty');

      const fixed = reconcileStructuralParents(autoFixTree(snapNodes));
      validateTree(fixed);

      const ctx = getSiblingContext(tree, rid);
      if (!ctx) throw new Error('Could not resolve section position for detach');
      const baseInsertIndex = Number(ctx.index) || 0;
      const parentNodeId = ctx.parentId ?? null;

      const ordered = [];
      const walk = (n, parentRef = null, rootOffset = 0) => {
        const tempId = `gc-detach-${meta.globalComponentId}-${n.id}`;
        const entry = {
          tempId,
          parentRef: parentRef || null,
          parentNodeId: parentRef == null ? parentNodeId : undefined,
          nodeType: n.nodeType,
          displayName: n.displayName || n.nodeType,
          positionIndex: parentRef == null ? baseInsertIndex + rootOffset : Number(n.positionIndex) || 0,
          props: n.props || {},
          style_json: n.style_json || (n.props ? n.props.style_json : undefined),
          dataJson: n.dataJson ?? null,
          actionsJson: n.actionsJson ?? null,
        };
        ordered.push(entry);
        for (const child of n.children || []) {
          walk(child, tempId, 0);
        }
      };
      for (let i = 0; i < fixed.length; i += 1) walk(fixed[i], null, i);

      await bulkCreateNodesRequest(ordered);
      await deleteNodeRequest(rid);
      await reloadBuilder();
      setHasUnpublishedEdits(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleRenameReusableBlock = async (blockId) => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    const id = Number(blockId);
    if (!Number.isInteger(id) || id <= 0) return;
    const current = reusableBlocks.find((b) => Number(b.id) === id);
    const name = window.prompt('Rename reusable block', current?.name || 'Reusable Section');
    if (!name) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/reusable-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data.error || 'Failed to rename reusable block');
      setReusableBlocks((prev) => prev.map((b) => (Number(b.id) === id ? data.block : b)));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteReusableBlock = async (blockId) => {
    const projectId = Number(page?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return;
    const id = Number(blockId);
    if (!Number.isInteger(id) || id <= 0) return;
    if (!window.confirm('Delete this reusable block?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/reusable-blocks/${id}`, { method: 'DELETE' });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data.error || 'Failed to delete reusable block');
      setReusableBlocks((prev) => prev.filter((b) => Number(b.id) !== id));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const handleInsertReusableBlock = async (blockId) => {
    const id = Number(blockId);
    if (!Number.isInteger(id) || id <= 0) return;
    const block = reusableBlocks.find((b) => Number(b.id) === id);
    const nodes = block?.snapshot?.nodes;
    if (!Array.isArray(nodes) || !nodes.length) return;
    try {
      // Validate snapshot before insertion.
      const fixed = reconcileStructuralParents(autoFixTree(nodes));
      validateTree(fixed);

      // Flatten DFS order with tempId + parentRef so bulk API can map ids.
      const ordered = [];
      const rootInsertIndex = Array.isArray(tree) ? tree.length : 0;
      const walk = (n, parentRef = null) => {
        const tempId = `rb-${id}-${n.id}`;
        const entry = {
          tempId,
          parentRef: parentRef || null,
          nodeType: n.nodeType,
          displayName: n.displayName || n.nodeType,
          positionIndex: parentRef == null ? rootInsertIndex + (Number(n.positionIndex) || 0) : Number(n.positionIndex) || 0,
          props: n.props || {},
          style_json: n.style_json || (n.props ? n.props.style_json : undefined),
          dataJson: n.dataJson ?? null,
          actionsJson: n.actionsJson ?? null,
        };
        ordered.push(entry);
        for (const child of n.children || []) {
          walk(child, tempId);
        }
      };
      for (const root of fixed) walk(root, null);
      await bulkCreateNodesRequest(ordered);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const insertTemplateNodeTree = async (node, parentNodeId = null) => {
    const created = await createNodeRequest({
      nodeType: node.nodeType,
      parentNodeId,
      displayName: node.displayName || node.nodeType,
      props: node.props || {},
      style_json: node.style_json || {},
      dataJson: node.dataJson,
      actionsJson: node.actionsJson,
    });
    if (!created?.id) return null;
    for (const child of Array.isArray(node.children) ? node.children : []) {
      // eslint-disable-next-line no-await-in-loop
      await insertTemplateNodeTree(child, created.id);
    }
    return created.id;
  };

  const handleImportPageTemplate = async (templateId) => {
    const targetTemplate = projectTemplates.find((tpl) => tpl?.id === templateId);
    if (!targetTemplate) return;
    const snapshotNodes = Array.isArray(targetTemplate.snapshot) ? targetTemplate.snapshot : [];
    if (!snapshotNodes.length) return;
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      for (const rootNode of snapshotNodes) {
        // eslint-disable-next-line no-await-in-loop
        await insertTemplateNodeTree(rootNode, null);
      }
      await reloadBuilder();
      setHasUnpublishedEdits(true);
      setLeftPanelTab('layers');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleInsertGlobalSection = async (role) => {
    const section = page?.projectConfig?.globalSections?.[role];
    if (!section) {
      setErrorMessage(
        `No global ${role} is saved for this project yet. Select a top-level section on the canvas, open its ⋯ menu, choose “Save as global ${role}”, then use Insert here.`
      );
      return;
    }
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      let toInsert = section;
      if (section?.nodeType === 'row') {
        const prevProps = section.props && typeof section.props === 'object' ? section.props : {};
        const prevMeta = prevProps.meta && typeof prevProps.meta === 'object' ? prevProps.meta : {};
        const metaPatch =
          role === 'header' ? { isHeader: true } : role === 'footer' ? { isFooter: true } : {};
        toInsert = {
          ...section,
          props: { ...prevProps, meta: { ...prevMeta, ...metaPatch } },
        };
      }
      await insertTemplateNodeTree(toInsert, null);
      await reloadBuilder();
      setHasUnpublishedEdits(true);
    } catch (error) {
      setErrorMessage(humanizeClientError(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleInsertHeroSectionTemplate = async () => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const row = await createNodeRequest({
        nodeType: 'row',
        parentNodeId: null,
        displayName: 'Hero Section',
        style_json: {
          desktop: {
            layout: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              flexWrap: 'nowrap',
              gap: 28,
            },
            spacing: { padding: '72px 56px', margin: '0px 0px 24px 0px' },
            background: { backgroundColor: 'rgba(15,23,42,0.92)' },
            effects: { borderRadius: '18px' },
          },
        },
      });
      if (!row?.id) throw new Error('Could not create hero section');
      const leftCol = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: row.id,
        displayName: 'Hero Left',
        style_json: { desktop: { size: { width: '60%' }, spacing: { padding: '8px' } } },
      });
      const rightCol = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: row.id,
        displayName: 'Hero Right',
        style_json: { desktop: { size: { width: '40%' }, spacing: { padding: '8px' } } },
      });
      const leftStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: leftCol.id,
        displayName: 'Hero Content',
        style_json: { desktop: { layout: { gap: 16 } } },
      });
      await createNodeRequest({
        nodeType: 'heading',
        parentNodeId: leftStack.id,
        displayName: 'Hero Title',
        props: { text: 'Build a great page in minutes' },
        style_json: { desktop: { typography: { fontSize: '52px', fontWeight: '800', color: '#ffffff' } } },
      });
      await createNodeRequest({
        nodeType: 'text',
        parentNodeId: leftStack.id,
        displayName: 'Hero Subtitle',
        props: { text: 'Use sections, presets, and global theme tokens to ship faster.' },
        style_json: { desktop: { typography: { fontSize: '18px', color: 'rgba(255,255,255,0.85)' } } },
      });
      await createNodeRequest({
        nodeType: 'button',
        parentNodeId: leftStack.id,
        displayName: 'Hero CTA',
        props: { text: 'Get Started' },
        style_json: {
          desktop: {
            spacing: { padding: '12px 18px' },
            background: { backgroundColor: 'var(--bld-primary)' },
            typography: { color: '#ffffff', fontWeight: '800' },
            border: { radius: '12px' },
          },
        },
      });

      const rightStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: rightCol.id,
        displayName: 'Hero Visual',
        style_json: {
          desktop: {
            size: { height: '320px' },
            background: {
              backgroundImage:
                "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.25)), url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1600&auto=format&fit=crop')",
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            },
            effects: { borderRadius: '16px' },
          },
        },
      });
      if (!rightStack?.id) throw new Error('Could not create hero visual');
      await reloadBuilder();
      setSelectedNodeId(row.id);
      setHasUnpublishedEdits(true);
      setLeftPanelTab('layers');
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleInsertFeaturesSectionTemplate = async () => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const row = await createNodeRequest({
        nodeType: 'row',
        parentNodeId: null,
        displayName: 'Features Section',
        style_json: {
          desktop: {
            layout: { display: 'flex', flexDirection: 'row', gap: '18px', width: '100%' },
            spacing: { padding: '48px 32px', margin: '0px 0px 24px 0px' },
            background: { backgroundColor: 'rgba(15,23,42,0.04)' },
            border: { radius: '18px' },
          },
        },
      });
      if (!row?.id) throw new Error('Could not create features section');
      const addFeatureCard = async (idx) => {
        const col = await createNodeRequest({
          nodeType: 'column',
          parentNodeId: row.id,
          displayName: `Feature ${idx + 1}`,
          style_json: { desktop: { spacing: { padding: '8px' } } },
        });
        const stack = await createNodeRequest({
          nodeType: 'stack',
          parentNodeId: col.id,
          displayName: `Feature ${idx + 1} Card`,
          style_json: {
            desktop: {
              layout: { gap: 10 },
              spacing: { padding: '18px' },
              background: { backgroundColor: '#ffffff' },
              border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.10)' },
            },
          },
        });
        await createNodeRequest({
          nodeType: 'heading',
          parentNodeId: stack.id,
          displayName: `Feature ${idx + 1} Title`,
          props: { text: ['Fast', 'Flexible', 'Pixel-perfect'][idx] || `Feature ${idx + 1}` },
          style_json: { desktop: { typography: { fontSize: '20px', fontWeight: '800' } } },
        });
        await createNodeRequest({
          nodeType: 'text',
          parentNodeId: stack.id,
          displayName: `Feature ${idx + 1} Body`,
          props: { text: 'Short description of the feature benefit goes here.' },
        });
      };
      // eslint-disable-next-line no-await-in-loop
      for (let i = 0; i < 3; i += 1) await addFeatureCard(i);
      await reloadBuilder();
      setSelectedNodeId(row.id);
      setHasUnpublishedEdits(true);
      setLeftPanelTab('layers');
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleInsertFooterSectionTemplate = async () => {
    const beforeTree = tree;
    pushHistorySnapshot(beforeTree);
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const row = await createNodeRequest({
        nodeType: 'row',
        parentNodeId: null,
        displayName: 'Footer Section',
        style_json: {
          desktop: {
            layout: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 18 },
            spacing: { padding: '18px 28px', margin: '0px' },
            background: { backgroundColor: 'rgba(15,23,42,0.92)' },
          },
        },
      });
      if (!row?.id) throw new Error('Could not create footer section');
      const leftCol = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: row.id,
        displayName: 'Footer Left',
        style_json: { desktop: { size: { width: '50%' } } },
      });
      const rightCol = await createNodeRequest({
        nodeType: 'column',
        parentNodeId: row.id,
        displayName: 'Footer Right',
        style_json: { desktop: { size: { width: '50%' } } },
      });
      const leftStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: leftCol.id,
        displayName: 'Footer Copy',
        style_json: { desktop: { layout: { gap: 6 } } },
      });
      await createNodeRequest({
        nodeType: 'text',
        parentNodeId: leftStack.id,
        displayName: 'Footer Text',
        props: { text: '© Your Company. All rights reserved.' },
        style_json: { desktop: { typography: { color: 'rgba(255,255,255,0.75)' } } },
      });
      const rightStack = await createNodeRequest({
        nodeType: 'stack',
        parentNodeId: rightCol.id,
        displayName: 'Footer Links Stack',
        style_json: { desktop: { layout: { alignItems: 'flex-end' } } },
      });
      await createNodeRequest({
        nodeType: 'menu',
        parentNodeId: rightStack.id,
        displayName: 'Footer Menu',
        props: { orientation: 'row', items: [{ label: 'Privacy', to: '#' }, { label: 'Terms', to: '#' }, { label: 'Contact', to: '#' }] },
        style_json: {
          desktop: {
            typography: { color: 'rgba(255,255,255,0.85)' },
            menu: { gap: 12, itemPadding: '6px 10px', borderRadius: '999px', hoverColor: '#ffffff', hoverBg: 'rgba(255,255,255,0.10)' },
          },
        },
      });
      await reloadBuilder();
      setSelectedNodeId(row.id);
      setHasUnpublishedEdits(true);
      setLeftPanelTab('layers');
    } catch (error) {
      setUndoStack((prev) => prev.slice(0, -1));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleCreateComponentPreset = async (presetId) => {
    setIsCreatingNode(true);
    setErrorMessage('');
    try {
      const ensureTargetStackId = async () => {
        const parents = buildParentMap(tree);
        const climbToContainer = (startId) => {
          let cur = startId;
          for (let i = 0; i < 80; i += 1) {
            const node = findNodeInTree(tree, cur);
            if (!node) return null;
            if (node.nodeType === 'stack' || node.nodeType === 'column' || node.nodeType === 'row') return node;
            const p = parents.get(cur);
            if (p == null) return null;
            cur = p;
          }
          return null;
        };

        // If user has a block selected (heading/text/image/menu/carousel etc.), resolve its nearest container.
        const baseNode = selectedNode?.id != null ? climbToContainer(selectedNode.id) : null;
        if (baseNode?.nodeType === 'stack') return baseNode.id;

        // If a column is selected, use its existing stack or create one.
        const columnNode = baseNode?.nodeType === 'column' ? baseNode : selectedNode?.nodeType === 'column' ? selectedNode : null;
        if (columnNode) {
          const existing = columnNode.children?.find?.((n) => n?.nodeType === 'stack')?.id || null;
          if (existing) return existing;
          const created = await createNodeRequest({
            nodeType: 'stack',
            parentNodeId: columnNode.id,
            displayName: 'Stack',
          });
          return created?.id || null;
        }

        // If a row (section) is selected, ensure it has at least 1 column + stack.
        const rowNode = baseNode?.nodeType === 'row' ? baseNode : selectedNode?.nodeType === 'row' ? selectedNode : null;
        if (rowNode) {
          const firstCol = rowNode.children?.find?.((n) => n?.nodeType === 'column') || null;
          const col =
            firstCol ||
            (await createNodeRequest({
              nodeType: 'column',
              parentNodeId: rowNode.id,
              displayName: 'Column',
            }));
          if (!col?.id) return null;
          const existingStack = col.children?.find?.((n) => n?.nodeType === 'stack')?.id || null;
          if (existingStack) return existingStack;
          const createdStack = await createNodeRequest({
            nodeType: 'stack',
            parentNodeId: col.id,
            displayName: 'Stack',
          });
          return createdStack?.id || null;
        }

        return null;
      };

      const targetStackId = await ensureTargetStackId();
      if (!targetStackId) {
        setErrorMessage('Select a section/column/stack first, then insert a preset.');
        return;
      }

      if (presetId === 'button-pill') {
        await createNodeRequest({
          nodeType: 'button',
          parentNodeId: targetStackId,
          displayName: 'Preset Pill Button',
          props: { text: 'Get Started' },
          style_json: {
            desktop: {
              spacing: { padding: '12px 22px' },
              typography: { fontWeight: '700' },
              background: { backgroundColor: '#3b82f6' },
              colors: { textColor: '#ffffff' },
              border: { radius: '999px' },
            },
          },
        });
      } else if (presetId === 'card-basic') {
        const cardStack = await createNodeRequest({
          nodeType: 'stack',
          parentNodeId: targetStackId,
          displayName: 'Preset Card',
          style_json: {
            desktop: {
              layout: { gap: 10 },
              spacing: { padding: '16px' },
              background: { backgroundColor: '#ffffff' },
              border: { radius: '12px', width: '1px', color: '#e5e7eb' },
            },
          },
        });
        if (cardStack?.id) {
          await createNodeRequest({
            nodeType: 'heading',
            parentNodeId: cardStack.id,
            displayName: 'Card Title',
            props: { text: 'Card Title' },
            style_json: { desktop: { typography: { fontSize: '22px', fontWeight: '700' } } },
          });
          await createNodeRequest({
            nodeType: 'text',
            parentNodeId: cardStack.id,
            displayName: 'Card Body',
            props: { text: 'Card description text for quick content block.' },
          });
          await createNodeRequest({
            nodeType: 'button',
            parentNodeId: cardStack.id,
            displayName: 'Card CTA',
            props: { text: 'Learn more' },
          });
        }
      } else if (presetId === 'hero') {
        await createNodeRequest({
          nodeType: 'heading',
          parentNodeId: targetStackId,
          displayName: 'Preset Hero Title',
          props: { text: 'A clear value proposition' },
          style_json: { desktop: { typography: { fontSize: '40px', fontWeight: '900' } } },
        });
        await createNodeRequest({
          nodeType: 'text',
          parentNodeId: targetStackId,
          displayName: 'Preset Hero Subtitle',
          props: { text: 'Add one short sentence that explains what you do and why it matters.' },
        });
        await createNodeRequest({
          nodeType: 'button',
          parentNodeId: targetStackId,
          displayName: 'Preset Hero CTA',
          props: { text: 'Get Started' },
          style_json: {
            desktop: {
              spacing: { padding: '12px 18px' },
              background: { backgroundColor: 'var(--bld-primary)' },
              typography: { color: '#ffffff', fontWeight: '800' },
              border: { radius: '12px' },
            },
          },
        });
      } else if (presetId === 'card') {
        await handleCreateComponentPreset('card-basic');
      } else if (presetId === 'cta') {
        const cta = await createNodeRequest({
          nodeType: 'stack',
          parentNodeId: targetStackId,
          displayName: 'Preset CTA',
          style_json: {
            desktop: {
              layout: { gap: 12 },
              spacing: { padding: '20px' },
              background: { backgroundColor: 'rgba(59,130,246,0.08)' },
              border: { radius: '16px', width: '1px', color: 'rgba(59,130,246,0.25)' },
            },
          },
        });
        if (cta?.id) {
          await createNodeRequest({
            nodeType: 'heading',
            parentNodeId: cta.id,
            displayName: 'CTA Title',
            props: { text: 'Ready to get started?' },
            style_json: { desktop: { typography: { fontSize: '22px', fontWeight: '900' } } },
          });
          await createNodeRequest({
            nodeType: 'text',
            parentNodeId: cta.id,
            displayName: 'CTA Body',
            props: { text: 'Add one line of encouragement + a strong call-to-action.' },
          });
          await createNodeRequest({
            nodeType: 'button',
            parentNodeId: cta.id,
            displayName: 'CTA Button',
            props: { text: 'Contact sales' },
            style_json: {
              desktop: {
                spacing: { padding: '12px 18px' },
                background: { backgroundColor: 'var(--bld-primary)' },
                typography: { color: '#ffffff', fontWeight: '800' },
                border: { radius: '12px' },
              },
            },
          });
        }
      } else if (presetId === 'pricing') {
        const rowStack = await createNodeRequest({
          nodeType: 'stack',
          parentNodeId: targetStackId,
          displayName: 'Preset Pricing Row',
          style_json: { desktop: { layout: { flexDirection: 'row', alignItems: 'stretch', gap: 12 } } },
        });
        const addPlan = async (name, price) => {
          const card = await createNodeRequest({
            nodeType: 'stack',
            parentNodeId: rowStack.id,
            displayName: `${name} Plan`,
            style_json: {
              desktop: {
                layout: { gap: 10 },
                spacing: { padding: '16px' },
                background: { backgroundColor: '#ffffff' },
                border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.12)' },
                size: { width: '280px' },
              },
            },
          });
          await createNodeRequest({
            nodeType: 'heading',
            parentNodeId: card.id,
            displayName: `${name} Name`,
            props: { text: name },
            style_json: { desktop: { typography: { fontSize: '18px', fontWeight: '900' } } },
          });
          await createNodeRequest({
            nodeType: 'text',
            parentNodeId: card.id,
            displayName: `${name} Price`,
            props: { text: price },
            style_json: { desktop: { typography: { fontSize: '28px', fontWeight: '900' } } },
          });
          await createNodeRequest({
            nodeType: 'button',
            parentNodeId: card.id,
            displayName: `${name} Button`,
            props: { text: 'Choose plan' },
            style_json: {
              desktop: {
                spacing: { padding: '10px 14px' },
                background: { backgroundColor: 'var(--bld-primary)' },
                typography: { color: '#ffffff', fontWeight: '800' },
                border: { radius: '12px' },
              },
            },
          });
        };
        // eslint-disable-next-line no-await-in-loop
        await addPlan('Starter', '$19/mo');
        // eslint-disable-next-line no-await-in-loop
        await addPlan('Pro', '$49/mo');
        // eslint-disable-next-line no-await-in-loop
        await addPlan('Business', '$99/mo');
      }
      await reloadBuilder();
      setHasUnpublishedEdits(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingNode(false);
    }
  };

  const handleExportPage = async (format = 'html') => {
    setErrorMessage('');
    try {
      const response = await fetch(`/api/pages/${pid}/export?format=${encodeURIComponent(format)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Export failed');
      }
      const code = String(payload?.data?.code || '');
      if (!code) throw new Error('Export generated empty content');
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page-${pid}.${format === 'react' ? 'jsx' : 'html'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handlePreview = () => {
    if (!previewUrl) return;
    if (typeof window !== 'undefined') {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLivePreview = () => {
    if (!liveUrl) return;
    if (typeof window !== 'undefined') {
      window.open(liveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSiteThemeSaved = useCallback((normalized) => {
    setPage((prev) =>
      prev
        ? {
            ...prev,
            projectConfig: {
              ...(prev.projectConfig || {}),
              siteTheme: normalized,
            },
          }
        : prev
    );
  }, []);

  const handleSiteThemePersistError = useCallback((message) => {
    setErrorMessage(message);
  }, []);

  const handleSiteThemeRevisionConflict = useCallback(async () => {
    setErrorMessage('');
    await reloadBuilder();
  }, [reloadBuilder]);

  const siteThemePersistence = useMemo(
    () =>
      page?.projectId && pageIdValid
        ? {
            projectId: page.projectId,
            pageSlug: page.slug,
            initialSiteTheme: page.projectConfig?.siteTheme,
            onSiteThemeSaved: handleSiteThemeSaved,
            onPersistError: handleSiteThemePersistError,
            onRevisionConflict: handleSiteThemeRevisionConflict,
          }
        : null,
    [
      page?.projectId,
      page?.slug,
      page?.projectConfig?.siteTheme,
      pageIdValid,
      handleSiteThemeSaved,
      handleSiteThemePersistError,
      handleSiteThemeRevisionConflict,
    ]
  );

  const handleUndo = useCallback(() => {
    if (!undoStack.length) return;
    const previous = cloneTreeSnapshot(undoStack[undoStack.length - 1]?.tree);
    const current = cloneTreeSnapshot(tree);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, { ts: Date.now(), tree: current }]);
    applyTreeWithSelectionGuard(previous);
    setHasUnpublishedEdits(true);
  }, [applyTreeWithSelectionGuard, tree, undoStack]);

  const handleRedo = useCallback(() => {
    if (!redoStack.length) return;
    const next = cloneTreeSnapshot(redoStack[redoStack.length - 1]?.tree);
    const current = cloneTreeSnapshot(tree);
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, { ts: Date.now(), tree: current }]);
    applyTreeWithSelectionGuard(next);
    setHasUnpublishedEdits(true);
  }, [applyTreeWithSelectionGuard, redoStack, tree]);

  const AUTOSAVE_KEY = useMemo(() => `bld-autosave:${pid}`, [pid]);

  useEffect(() => {
    if (!pid) return undefined;
    if (!tree) return undefined;
    if (!hasUnpublishedEdits) return undefined;
    const t = window.setTimeout(() => {
      try {
        const payload = {
          ts: Date.now(),
          pageId: pid,
          selectedNodeId,
          tree,
        };
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      } catch {
        // ignore quota / serialization errors
      }
    }, 1600);
    return () => window.clearTimeout(t);
  }, [AUTOSAVE_KEY, hasUnpublishedEdits, pid, selectedNodeId, tree]);

  useEffect(() => {
    if (!pid) return;
    if (!tree || !tree.length) return;
    try {
      const raw = window.localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      const ts = Number(saved.ts);
      if (!Number.isFinite(ts) || ts <= 0) return;
      // only offer if saved is recent-ish
      if (Date.now() - ts > 1000 * 60 * 60 * 24 * 7) return;
      const savedTree = Array.isArray(saved.tree) ? saved.tree : null;
      if (!savedTree) return;
      const same = JSON.stringify(savedTree) === JSON.stringify(tree);
      if (same) return;
      const ok =
        typeof window === 'undefined' ||
        window.confirm('Autosave recovery found. Restore the last autosaved snapshot?\n\nTip: you can still Undo after restore.');
      if (!ok) return;
      pushHistorySnapshot(cloneTreeSnapshot(tree));
      applyTreeWithSelectionGuard(reconcileStructuralParents(autoFixTree(savedTree)));
      setHasUnpublishedEdits(true);
      if (saved.selectedNodeId != null) setSelectedNodeId(saved.selectedNodeId);
    } catch {
      // ignore parse errors
    }
    // run once after initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const handleOpenHistory = useCallback(() => {
    const list = undoStack
      .slice(-10)
      .map((e, i) => {
        const ts = e?.ts ? new Date(e.ts).toLocaleTimeString() : '';
        return `${i + 1}. Snapshot ${ts}`;
      })
      .join('\n');
    const msg =
      'Restore snapshot (last 10):\n\n' +
      (list || '(no snapshots yet)') +
      '\n\nEnter a number (1-10) to restore, or Cancel.';
    const raw = window.prompt(msg, '');
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isInteger(n)) return;
    const slice = undoStack.slice(-10);
    const entry = slice[n - 1];
    if (!entry?.tree) return;
    pushHistorySnapshot(cloneTreeSnapshot(tree));
    applyTreeWithSelectionGuard(cloneTreeSnapshot(entry.tree));
    setHasUnpublishedEdits(true);
  }, [applyTreeWithSelectionGuard, pushHistorySnapshot, tree, undoStack]);

  const handleResetToBlank = useCallback(() => {
    if (!tree.length) return;
    const shouldReset =
      typeof window === 'undefined' ||
      window.confirm('Reset page to blank canvas? This clears all sections until you save/undo.');
    if (!shouldReset) return;
    const beforeTree = cloneTreeSnapshot(tree);
    pushHistorySnapshot(beforeTree);
    setCopiedNodeId(null);
    applyTreeWithSelectionGuard([]);
    setHasUnpublishedEdits(true);
    setErrorMessage('');
  }, [applyTreeWithSelectionGuard, pushHistorySnapshot, tree]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase?.() || '';
      const isEditableTarget =
        target?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      if (isEditableTarget) return;
      const key = String(event.key || '').toLowerCase();
      const isMod = event.ctrlKey || event.metaKey;
      if (isMod && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (isMod && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
      } else if (isMod && key === 'd' && selectedNodeId) {
        event.preventDefault();
        handleDuplicateNode(Number(selectedNodeId));
      } else if (isMod && key === 'c' && selectedNodeId) {
        event.preventDefault();
        setCopiedNodeId(Number(selectedNodeId));
        setCopyToastMessage('Copied. Ctrl+V pastes under the selected layer.');
      } else if (isMod && key === 'v') {
        const sourceNodeId = copiedNodeId || Number(selectedNodeId || 0);
        if (!sourceNodeId) return;
        event.preventDefault();
        handlePasteNode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [copiedNodeId, handleDuplicateNode, handlePasteNode, handleRedo, handleUndo, selectedNodeId]);

  return (
    <BuilderThemeProvider persistence={siteThemePersistence}>
      <div className="bld-shell">
        {copyToastMessage ? (
          <div className="bld-shell__copy-toast" role="status" aria-live="polite">
            {copyToastMessage}
          </div>
        ) : null}
        <BuilderTopbar
          projectName={page?.projectSlug || 'default'}
          pageName={page?.title || 'Page'}
          onOpenSeo={() => setIsSeoOpen(true)}
          onOpenAudit={() => setIsAuditOpen(true)}
          clipboardNodeTypeLabel={clipboardNodeTypeLabel}
          saveAckVisible={saveAckVisible}
          device={device}
          onDeviceChange={setDevice}
          onSave={handleSave}
          onPublish={handlePublish}
          onPreview={handlePreview}
          onLivePreview={handleLivePreview}
          previewUrl={previewUrl}
          liveUrl={liveUrl}
          canOpenLivePreview={canOpenLivePreview}
          draftVersionNumber={draftVersion?.versionNumber}
          publishedVersionId={page?.publishedVersionId}
          isPublishing={isPublishing}
          isSyncingDraft={isSyncingDraft}
          hasUnpublishedEdits={hasUnpublishedEdits}
          isFreeMode={isFreeMode}
          onToggleFreeMode={handleToggleFreeMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onOpenHistory={handleOpenHistory}
          onResetToBlank={handleResetToBlank}
          isLayoutDebug={isLayoutDebug}
          onToggleLayoutDebug={() => setIsLayoutDebug((prev) => !prev)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((p) => !p)}
        />

        <PageSeoModal
          open={isSeoOpen}
          pageId={pid}
          pageSlug={page?.slug || ''}
          projectSlug={page?.projectSlug || 'default'}
          projectConfig={page?.projectConfig || null}
          tree={tree}
          onClose={() => setIsSeoOpen(false)}
          onSelectNode={(nodeId) => {
            if (!nodeId) return;
            setSelectedNodeId(Number(nodeId));
            setLeftPanelTab('layers');
          }}
        />

        <AuditModal
          open={isAuditOpen}
          pageId={pid}
          device={device}
          projectConfig={page?.projectConfig || null}
          pageSeo={page?.seo || null}
          tree={tree}
          mediaMetaByUrl={mediaMetaByUrl}
          onClose={() => setIsAuditOpen(false)}
          onSelectNode={(nodeId) => {
            if (!nodeId) return;
            setSelectedNodeId(Number(nodeId));
            setLeftPanelTab('layers');
          }}
          onReportChange={(report) => {
            setLastAuditIssues(Array.isArray(report?.issues) ? report.issues : []);
          }}
          onQuickFix={async ({ nodeId, fix }) => {
            if (!nodeId || !fix) return;
            const node = findNodeInTree(tree, Number(nodeId));
            if (!node) return;

            const applyStylePatch = (deviceKey, group, key, value) => {
              const cur = node.style_json && typeof node.style_json === 'object' ? node.style_json : {};
              const layer = (cur[deviceKey] && typeof cur[deviceKey] === 'object') ? cur[deviceKey] : {};
              const nextGroup = { ...((layer[group] && typeof layer[group] === 'object') ? layer[group] : {}), [key]: value };
              return {
                ...cur,
                [deviceKey]: {
                  ...layer,
                  [group]: nextGroup,
                },
              };
            };

            let payload = null;
            if (fix.type === 'setProp') {
              payload = { props: { ...(fix.props || {}) } };
            } else if (fix.type === 'width100') {
              payload = { style_json: applyStylePatch(fix.device || device, 'size', 'width', '100%') };
            } else if (fix.type === 'reduceGap') {
              payload = { style_json: applyStylePatch(fix.device || 'mobile', 'layout', 'gap', `${Number(fix.valuePx || 16)}px`) };
            } else if (fix.type === 'enableWrap') {
              payload = { style_json: applyStylePatch(fix.device || device, 'layout', 'flexWrap', 'wrap') };
            } else if (fix.type === 'stackMobile') {
              const s1 = applyStylePatch('mobile', 'layout', 'flexDirection', 'column');
              const s2 = (() => {
                const layer = (s1.mobile && typeof s1.mobile === 'object') ? s1.mobile : {};
                return { ...s1, mobile: { ...layer, layout: { ...(layer.layout || {}), flexWrap: 'nowrap' } } };
              })();
              payload = { style_json: s2 };
            } else if (fix.type === 'reducePadding') {
              const px = Number(fix.valuePx || 16);
              const v = `${Math.max(0, px)}px`;
              payload = {
                style_json: applyStylePatch(fix.device || 'mobile', 'spacing', 'padding', `${v} ${v} ${v} ${v}`),
              };
            } else if (fix.type === 'reduceMargin') {
              const px = Number(fix.valuePx || 0);
              const v = `${Math.max(0, px)}px`;
              payload = {
                style_json: applyStylePatch(fix.device || 'mobile', 'spacing', 'margin', `0 ${v} 0 ${v}`),
              };
            } else if (fix.type === 'reduceFontMobile') {
              const px = Math.max(8, Math.min(128, Number(fix.valuePx || 14)));
              payload = { style_json: applyStylePatch('mobile', 'typography', 'fontSize', `${Math.round(px)}px`) };
            } else if (fix.type === 'reduceSlidesPerViewMobile') {
              const current = node.props?.slidesPerView && typeof node.props.slidesPerView === 'object' ? node.props.slidesPerView : {};
              payload = { props: { slidesPerView: { ...current, mobile: 1 } } };
            } else if (fix.type === 'applyAspectRatio') {
              const w = Number(fix.width);
              const h = Number(fix.height);
              if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
              const ratio = `${Math.round(w)} / ${Math.round(h)}`;
              payload = { style_json: applyStylePatch(fix.device || 'desktop', 'size', 'aspectRatio', ratio) };
            } else if (fix.type === 'setMinHeightCls') {
              const px = Math.max(80, Math.min(640, Number(fix.valuePx || 240)));
              payload = { style_json: applyStylePatch(fix.device || device, 'size', 'minHeight', `${Math.round(px)}px`) };
            } else if (fix.type === 'reduceCarouselSlidesRendered') {
              payload = { props: { maxSlidesRendered: Number(fix.value || 8) } };
            }

            if (!payload) return;
            await handleNodeUpdate({ nodeId: node.id, payload });
          }}
        />

        <AuditBadgesOverlay
          open={isAuditOpen}
          issues={lastAuditIssues}
          onClickNode={(nodeId) => {
            if (!nodeId) return;
            setSelectedNodeId(Number(nodeId));
            setLeftPanelTab('layers');
            setIsAuditOpen(true);
          }}
        />

        <div className="bld-shell__body">
          <aside className="bld-left">
            <div className="bld-left__library">
              <div className="bld-left__tabs">
                <button
                  type="button"
                  className={`bld-left__tab ${leftPanelTab === 'elements' ? 'is-active' : ''}`}
                  onClick={() => setLeftPanelTab('elements')}
                >
                  Elements
                </button>
                <button
                  type="button"
                  className={`bld-left__tab ${leftPanelTab === 'templates' ? 'is-active' : ''}`}
                  onClick={() => setLeftPanelTab('templates')}
                >
                  Templates
                </button>
                <button
                  type="button"
                  className={`bld-left__tab ${leftPanelTab === 'reusable' ? 'is-active' : ''}`}
                  onClick={() => setLeftPanelTab('reusable')}
                >
                  Reusable
                </button>
                <button
                  type="button"
                  className={`bld-left__tab ${leftPanelTab === 'globals' ? 'is-active' : ''}`}
                  onClick={() => setLeftPanelTab('globals')}
                >
                  Globals
                </button>
                <button
                  type="button"
                  className={`bld-left__tab ${leftPanelTab === 'layers' ? 'is-active' : ''}`}
                  onClick={() => setLeftPanelTab('layers')}
                >
                  Layers
                </button>
              </div>
              {Array.isArray(selectionBreadcrumb) && selectionBreadcrumb.length ? (
                <div className="bld-left__crumb" title="Selection path">
                  {selectionBreadcrumb.join(' → ')}
                </div>
              ) : null}
              {pageSectionRows.length > 0 ? (
                <div
                  className={`bld-left__sections ${sectionsCollapsed ? 'is-collapsed' : ''}`}
                  role="region"
                  aria-label="Sections on this page"
                >
                  <div className="bld-left__sections-head">
                    <span>Sections</span>
                    <button
                      type="button"
                      className="bld-left__collapse"
                      aria-label={sectionsCollapsed ? 'Expand sections list' : 'Collapse sections list'}
                      aria-expanded={!sectionsCollapsed}
                      onClick={() => setSectionsCollapsed((p) => !p)}
                    >
                      <span aria-hidden className={`bld-left__chev ${sectionsCollapsed ? 'is-collapsed' : ''}`}>
                        ▾
                      </span>
                    </button>
                  </div>
                  <ul className="bld-left__sections-list" hidden={sectionsCollapsed}>
                    {pageSectionRows.map((row, idx) => {
                      const isActive =
                        activeSectionRowId != null && Number(activeSectionRowId) === Number(row.id);
                      return (
                        <li key={row.id} className="bld-left__sections-list__item">
                          <div className="bld-left__section-row">
                            <button
                              type="button"
                              className={`bld-left__section-chip${isActive ? ' is-active' : ''}`}
                              onClick={() => handleNodeSelect(row.id)}
                              title={`Select section: ${row.label}`}
                            >
                              <span className="bld-left__section-chip__idx" aria-hidden>
                                {idx + 1}
                              </span>
                              <span className="bld-left__section-chip__label">{row.label}</span>
                            </button>
                            <div className="bld-left__section-actions" aria-label="Reorder section">
                              <button
                                type="button"
                                className="bld-left__section-action"
                                title="Move section up"
                                aria-label="Move section up"
                                disabled={idx === 0 || isReorderingNode}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMoveSectionRow(row.id, -1);
                                }}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="bld-left__section-action"
                                title="Move section down"
                                aria-label="Move section down"
                                disabled={idx === pageSectionRows.length - 1 || isReorderingNode}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMoveSectionRow(row.id, 1);
                                }}
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {pageSectionRows.length > 0 && interiorScopeRow ? (
                <div
                  className={`bld-left__interior ${interiorCollapsed ? 'is-collapsed' : ''}`}
                  role="region"
                  aria-label="Inside this section"
                >
                  <div className="bld-left__interior-head">
                    <span>Inside this section</span>
                    <button
                      type="button"
                      className="bld-left__collapse"
                      aria-label={interiorCollapsed ? 'Expand inside this section' : 'Collapse inside this section'}
                      aria-expanded={!interiorCollapsed}
                      onClick={() => setInteriorCollapsed((p) => !p)}
                    >
                      <span aria-hidden className={`bld-left__chev ${interiorCollapsed ? 'is-collapsed' : ''}`}>
                        ▾
                      </span>
                    </button>
                  </div>
                  <div hidden={interiorCollapsed}>
                  {isRowMarkedHeader(interiorScopeRow) ? (
                    <div className="bld-left__interior-field">
                      <label className="bld-left__interior-label" htmlFor={`bld-header-layout-${interiorScopeRow.id}`}>
                        Header type
                      </label>
                      <select
                        id={`bld-header-layout-${interiorScopeRow.id}`}
                        className="bld-left__interior-select"
                        value={String(interiorScopeRow.props?.meta?.headerLayout || 'standard')}
                        disabled={isSavingNode}
                        onChange={async (e) => {
                          const rowId = interiorScopeRow.id;
                          const n = findNodeInTree(tree, rowId);
                          if (!n) return;
                          const nextLayout = e.target.value;
                          await handleNodeUpdate({
                            nodeId: rowId,
                            payload: {
                              props: {
                                ...n.props,
                                meta: { ...(n.props?.meta || {}), headerLayout: nextLayout },
                              },
                            },
                          });
                        }}
                      >
                        {HEADER_LAYOUT_PRESETS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  {isRowMarkedHeader(interiorScopeRow) ? (
                    <div className="bld-left__interior-field">
                      <label className="bld-left__interior-label" htmlFor={`bld-header-align-${interiorScopeRow.id}`}>
                        Bar alignment
                      </label>
                      <select
                        id={`bld-header-align-${interiorScopeRow.id}`}
                        className="bld-left__interior-select"
                        value={String(interiorScopeRow.props?.meta?.headerAlign || 'between')}
                        disabled={isSavingNode}
                        onChange={async (e) => {
                          const rowId = interiorScopeRow.id;
                          const n = findNodeInTree(tree, rowId);
                          if (!n) return;
                          const nextAlign = e.target.value;
                          await handleNodeUpdate({
                            nodeId: rowId,
                            payload: {
                              props: {
                                ...n.props,
                                meta: { ...(n.props?.meta || {}), headerAlign: nextAlign },
                              },
                              style_json: applyHeaderAlignToRowStyleJson(n.style_json, nextAlign),
                            },
                          });
                        }}
                      >
                        {HEADER_ALIGN_PRESETS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  {isRowMarkedFooter(interiorScopeRow) ? (
                    <div className="bld-left__interior-field">
                      <label className="bld-left__interior-label" htmlFor={`bld-footer-layout-${interiorScopeRow.id}`}>
                        Footer type
                      </label>
                      <select
                        id={`bld-footer-layout-${interiorScopeRow.id}`}
                        className="bld-left__interior-select"
                        value={String(interiorScopeRow.props?.meta?.footerLayout || 'standard')}
                        disabled={isSavingNode}
                        onChange={async (e) => {
                          const rowId = interiorScopeRow.id;
                          const n = findNodeInTree(tree, rowId);
                          if (!n) return;
                          const nextLayout = e.target.value;
                          await handleNodeUpdate({
                            nodeId: rowId,
                            payload: {
                              props: {
                                ...n.props,
                                meta: { ...(n.props?.meta || {}), footerLayout: nextLayout },
                              },
                            },
                          });
                        }}
                      >
                        {FOOTER_LAYOUT_PRESETS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <SectionInteriorList
                    nodes={interiorScopeRow.children || []}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={handleNodeSelect}
                    overflowByNodeId={overflowByNodeId}
                  />
                  </div>
                </div>
              ) : pageSectionRows.length > 0 ? (
                <div className="bld-left__interior-hint">
                  Select a section above or click anything on the canvas — columns, stacks, and blocks for that section
                  appear here.
                </div>
              ) : null}
              {!tree?.length ? (
                <div className="bld-left__quick">
                  <button
                    type="button"
                    className="bld-btn"
                    disabled={isCreatingNode}
                    onClick={() => handleCreateSection({ columnCount: 1, insertIndex: 0 })}
                  >
                    + 1-col
                  </button>
                  <button
                    type="button"
                    className="bld-btn"
                    disabled={isCreatingNode}
                    onClick={() => handleCreateSection({ columnCount: 2, insertIndex: 0 })}
                  >
                    + 2-col
                  </button>
                  <button
                    type="button"
                    className="bld-btn"
                    disabled={isCreatingNode}
                    onClick={() => handleCreateSection({ columnCount: 3, insertIndex: 0 })}
                  >
                    + 3-col
                  </button>
                  <button
                    type="button"
                    className="bld-btn"
                    disabled={isCreatingNode}
                    onClick={() => handleInsertStarterTemplate({})}
                  >
                    Starter
                  </button>
                  <button
                    type="button"
                    className="bld-btn"
                    disabled={isCreatingNode}
                    onClick={() => handleInsertHeroSectionTemplate()}
                  >
                    Hero
                  </button>
                  <button type="button" className="bld-btn" disabled={isCreatingNode} onClick={() => setLeftPanelTab('templates')}>
                    Templates tab →
                  </button>
                </div>
              ) : null}
              <div className="bld-left__library-scroll">
                <BuilderSidebar
                  activeTab={
                    leftPanelTab === 'layers'
                      ? 'layers'
                      : leftPanelTab === 'templates'
                        ? 'templates'
                        : leftPanelTab === 'reusable'
                          ? 'reusable'
                        : leftPanelTab === 'globals'
                          ? 'globals'
                          : 'blocks'
                  }
                  onTabChange={(next) => {
                    if (next === 'layers') setLeftPanelTab('layers');
                    else if (next === 'templates') setLeftPanelTab('templates');
                    else if (next === 'reusable') setLeftPanelTab('reusable');
                    else if (next === 'globals') setLeftPanelTab('globals');
                    else setLeftPanelTab('elements');
                  }}
                  selectedNode={selectedNode}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={handleNodeSelect}
                  tree={tree}
                  onCreateNode={handleCreateNode}
                  onQuickAddNode={handleQuickAddNode}
                  onCreateSection={handleCreateSection}
                  onInsertStarterTemplate={handleInsertStarterTemplate}
                  onInsertHeaderTemplate={handleInsertHeaderTemplate}
                  onCreateComponentPreset={handleCreateComponentPreset}
                  onInsertSectionTemplate={async (id) => {
                    if (id === 'header') {
                      await handleInsertSectionTemplate('header');
                      return;
                    }
                    if (id === 'hero') {
                      await handleInsertHeroSectionTemplate();
                      return;
                    }
                    if (id === 'features') {
                      await handleInsertFeaturesSectionTemplate();
                      return;
                    }
                    if (id === 'footer') {
                      await handleInsertFooterSectionTemplate();
                      return;
                    }
                    // Default: use the generic section template pipeline
                    // (keeps builder architecture intact; supports new templates like `heroLanding`).
                    await handleInsertSectionTemplate(id);
                  }}
                  onApplyFullPageTemplate={handleApplyFullPageTemplate}
                  onUpdateNode={handleNodeUpdate}
                  onDeleteNode={handleDeleteNode}
                  onReorderNode={handleReorderNode}
                  device={device}
                  isCreatingNode={isCreatingNode}
                  projectType={page?.projectType || 'website'}
                  projectPages={projectPages}
                  projectTemplates={projectTemplates}
                  onSavePageTemplate={handleSavePageTemplate}
                  onImportPageTemplate={handleImportPageTemplate}
                  reusableBlocks={reusableBlocks}
                  onSaveReusableBlock={() => {
                    if (selectedNode?.nodeType === 'row') handleSaveReusableBlock(selectedNode.id);
                    else if (activeSectionRowId) handleSaveReusableBlock(activeSectionRowId);
                  }}
                  onInsertReusableBlock={handleInsertReusableBlock}
                  onRenameReusableBlock={handleRenameReusableBlock}
                  onDeleteReusableBlock={handleDeleteReusableBlock}
                  onInsertGlobalSection={handleInsertGlobalSection}
                  onExportPage={handleExportPage}
                  globalSections={page?.projectConfig?.globalSections}
                  globalComponents={globalComponents}
                  onRefreshGlobalComponents={async () => {
                    try {
                      await fetchGlobalComponents();
                    } catch (e) {
                      setErrorMessage(e instanceof Error ? e.message : String(e));
                    }
                  }}
                  onOpenGlobalComponentEditor={openGlobalComponentEditor}
                />
              </div>
            </div>
          </aside>
          <div className="bld-center">
            {page?.projectConfig?.globalSections?.header || page?.projectConfig?.globalSections?.footer ? (
              <div className="bld-live-context-notice" role="status">
                {page?.projectConfig?.globalSections?.header ? (
                  <p>
                    <strong>Global header</strong> (logo, menu, etc.) is merged on <strong>Live</strong> and{' '}
                    <strong>Draft Preview</strong> — it is not part of this page draft, so it does not show on the
                    canvas. Edit it under{' '}
                    <button
                      type="button"
                      className="bld-live-context-notice__link"
                      onClick={() => setLeftPanelTab('globals')}
                    >
                      Globals
                    </button>{' '}
                    → Global Components.
                  </p>
                ) : null}
                {page?.projectConfig?.globalSections?.footer ? (
                  <p>
                    A <strong>global footer</strong> is also merged on Live / Draft Preview. Edit it in the same{' '}
                    <button
                      type="button"
                      className="bld-live-context-notice__link"
                      onClick={() => setLeftPanelTab('globals')}
                    >
                      Globals
                    </button>{' '}
                    tab.
                  </p>
                ) : null}
                {page?.publishedVersionId ? (
                  <p>
                    <strong>Live URL</strong> also shows the last <strong>Published</strong> page body; the canvas
                    below is your <strong>draft</strong> until you publish again.
                  </p>
                ) : null}
              </div>
            ) : null}
            <BuilderCanvas
              device={device}
              onDeviceChange={setDevice}
              tree={tree}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleNodeSelect}
              isLoading={isLoading}
              onCreateNode={handleCreateNode}
              onQuickAddNode={handleQuickAddNode}
              isCreatingNode={isCreatingNode}
              onReorderNode={handleReorderNode}
              isReorderingNode={isReorderingNode}
              onDeleteNode={handleDeleteNode}
              onRequestNavigator={() => {
                setLeftPanelTab('layers');
              }}
              onInsertStarterTemplate={({ targetRowId }) =>
                handleInsertStarterTemplate({ targetRowId })
              }
              onInsertHeaderTemplate={({ targetRowId }) =>
                handleInsertHeaderTemplate({ targetRowId, replaceExisting: true })
              }
              onInsertSectionTemplate={handleInsertSectionTemplate}
              onCreateHeroSection={() => handleInsertHeroSectionTemplate()}
              projectTemplates={projectTemplates}
              onImportPageTemplate={handleImportPageTemplate}
              onSetContainerDirection={handleSetContainerDirection}
              onAlignMenuRightInRow={handleAlignMenuRightInRow}
              onUploadLogoInRow={handleUploadLogoInRow}
              onStretchSectionFullWidth={handleStretchSectionFullWidth}
              onStretchSectionFromSelection={handleStretchSectionFromSelection}
              onAlignMenuRightFromSelection={handleAlignMenuRightFromSelection}
              onUpdateNode={handleNodeUpdate}
              onDuplicateNode={handleDuplicateNode}
              onConvertToGlobalComponent={handleConvertToGlobalComponent}
              onDetachFromGlobalComponent={handleDetachFromGlobalComponent}
              onEditGlobalComponent={openGlobalComponentEditor}
              flashPasteNodeId={flashPasteNodeId}
              flashReorderNodeId={flashReorderNodeId}
              onCopyNodeId={(nodeId) => {
                setCopiedNodeId(Number(nodeId));
                setCopyToastMessage('Copied. Ctrl+V pastes under the selected layer.');
              }}
              isSavingNode={isSavingNode}
              isDeletingNode={isDeletingNode}
              deletingNodeId={deletingNodeId}
              onCreateSection={handleCreateSection}
              projectType={page?.projectType || 'website'}
              onSaveGlobalSection={handleSaveGlobalSection}
              isFreeMode={isFreeMode}
              isLayoutDebug={isLayoutDebug}
              minimalPageChrome
              previewCssByNodeId={previewCssByNodeId}
              onSetPreviewCssForNode={setPreviewCssForNode}
              activeSpacingEdit={activeSpacingEdit}
              onOverflowDiagnosticsChange={handleOverflowDiagnostics}
              showGrid={showGrid}
            />
          </div>
          <aside className="bld-right" aria-label="Style and properties">
            <BuilderInspector
              variant="panel"
              device={device}
              onDeviceChange={setDevice}
              selectedNode={selectedNode}
              onUpdateNode={handleNodeUpdate}
              projectPages={projectPages}
              projectId={page?.projectId}
              activeTab={inspectorTab}
              onActiveTabChange={setInspectorTab}
              onSetPreviewCssForNode={setPreviewCssForNode}
              onSetActiveSpacingEdit={setActiveSpacingEdit}
              overflowDiagnostics={overflowByNodeId?.[selectedNodeId] || null}
              onEditGlobalComponent={openGlobalComponentEditor}
              onDetachFromGlobalComponent={handleDetachFromGlobalComponent}
            />
          </aside>
        </div>
        {errorMessage ? <div className="bld-shell__error">{errorMessage}</div> : null}
      </div>
    </BuilderThemeProvider>
  );
}
