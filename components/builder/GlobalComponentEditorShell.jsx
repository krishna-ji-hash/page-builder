'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { autoFixTree, reconcileStructuralParents, validateTree, findNodeInTree } from '@/lib/builderTree';
import { isValidNodeHierarchy } from '@/lib/builderHierarchy';
import { BuilderThemeProvider } from '@/context/BuilderThemeContext';
import BuilderCanvas from './BuilderCanvas';
import BuilderInspector from './BuilderInspector';
import '@/styles/builder/builder-shell.css';
import '@/styles/builder/builder-sidebar.css';
import '@/styles/builder/builder-canvas.css';
import '@/styles/builder/builder-inspector.css';
import '@/styles/builder/builder-responsive.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';
import '@/styles/live/live-site.css';
import '@/styles/builder/builder-live-mirror.css';
import '@/styles/builder/builder-live-parity.css';

function clone(snapshot) {
  try {
    return structuredClone(snapshot || []);
  } catch {
    return JSON.parse(JSON.stringify(snapshot || []));
  }
}

function updateNodeInTree(nodes, nodeId, updater) {
  return (nodes || []).map((node) => {
    if (node.id === nodeId) return updater(node);
    if (!node?.children?.length) return node;
    return { ...node, children: updateNodeInTree(node.children, nodeId, updater) };
  });
}

function removeNodeFromTree(nodes, nodeId) {
  const list = Array.isArray(nodes) ? nodes : [];
  return list
    .filter((n) => n?.id !== nodeId)
    .map((n) => ({
      ...n,
      children: n.children?.length ? removeNodeFromTree(n.children, nodeId) : n.children,
    }));
}

function addNodeToTree(nodes, parentId, newNode, index = null) {
  if (parentId == null) {
    const rootList = [...(nodes || [])];
    if (Number.isInteger(index) && index >= 0 && index <= rootList.length) {
      rootList.splice(index, 0, newNode);
      return rootList;
    }
    return [...rootList, newNode];
  }
  return (nodes || []).map((n) => {
    if (n.id !== parentId) {
      return n?.children?.length ? { ...n, children: addNodeToTree(n.children, parentId, newNode, index) } : n;
    }
    const kids = Array.isArray(n.children) ? [...n.children] : [];
    const idx = Number.isInteger(index) ? Math.max(0, Math.min(index, kids.length)) : kids.length;
    kids.splice(idx, 0, newNode);
    return { ...n, children: kids };
  });
}

function subtreeContainsId(node, targetId) {
  if (!node) return false;
  if (node.id === targetId) return true;
  return (node.children || []).some((c) => subtreeContainsId(c, targetId));
}

export default function GlobalComponentEditorShell({ projectId, componentId, returnTo = '/admin/builder' }) {
  const pid = Number(projectId);
  const cid = Number(componentId);
  const projectOk = Number.isInteger(pid) && pid > 0;
  const compOk = Number.isInteger(cid) && cid > 0;

  const [device, setDevice] = useState('desktop');
  const [component, setComponent] = useState(null);
  const [tree, setTree] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('content');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const nextTempIdRef = useRef(-1);

  const selectedNode = useMemo(
    () => (selectedNodeId != null ? findNodeInTree(tree, selectedNodeId) : null),
    [tree, selectedNodeId]
  );

  const load = useCallback(async () => {
    if (!projectOk || !compOk) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/projects/${pid}/global-components/${cid}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load global component');
      const item = data?.item;
      const nodes = Array.isArray(item?.snapshot?.nodes) ? item.snapshot.nodes : [];
      const fixed = reconcileStructuralParents(autoFixTree(nodes));
      validateTree(fixed);
      setComponent(item);
      setTree(fixed);
      setSelectedNodeId(fixed?.[0]?.id ?? null);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [cid, compOk, pid, projectOk]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdateNode = useCallback(async ({ nodeId, payload }) => {
    if (!nodeId || !payload) return;
    setTree((prev) => {
      const next = updateNodeInTree(prev, nodeId, (n) => {
        const mergedProps = payload.props ? { ...(n.props || {}), ...(payload.props || {}) } : n.props || {};
        const nextNode = {
          ...n,
          ...(payload.displayName !== undefined ? { displayName: payload.displayName } : {}),
          ...(payload.style_json !== undefined ? { style_json: payload.style_json } : {}),
          ...(payload.dataJson !== undefined ? { dataJson: payload.dataJson } : {}),
          ...(payload.actionsJson !== undefined ? { actionsJson: payload.actionsJson } : {}),
          ...(payload.props ? { props: mergedProps } : {}),
        };
        return nextNode;
      });
      return reconcileStructuralParents(autoFixTree(next));
    });
  }, []);

  const createLocalNode = useCallback(
    async ({ nodeType, parentNodeId = null, displayName, props, style_json }) => {
      const parent = parentNodeId != null ? findNodeInTree(tree, parentNodeId) : null;
      const parentType = parent?.nodeType ?? null;
      if (!isValidNodeHierarchy(nodeType, parentType)) {
        throw new Error(`Invalid hierarchy: ${nodeType} cannot be added inside ${parentType || 'root'}`);
      }
      const id = nextTempIdRef.current;
      nextTempIdRef.current -= 1;
      const node = {
        id,
        parentNodeId: parentNodeId ?? null,
        nodeType,
        displayName: displayName || `${nodeType}`,
        positionIndex: 0,
        props: props || {},
        style_json: style_json || {},
        dataJson: null,
        actionsJson: null,
        children: [],
      };
      setTree((prev) => reconcileStructuralParents(autoFixTree(addNodeToTree(prev, parentNodeId ?? null, node, null))));
      return node;
    },
    [tree]
  );

  const handleCreateNode = useCallback(
    async ({ nodeType, parentNodeId = null }) => {
      setErrorMessage('');
      try {
        await createLocalNode({ nodeType, parentNodeId });
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : String(e));
      }
    },
    [createLocalNode]
  );

  const handleQuickAddNode = useCallback(
    async ({ targetNodeId, nodeType }) => {
      // Keep it simple in global editor: respect the provided target as parent.
      await handleCreateNode({ nodeType, parentNodeId: targetNodeId ?? null });
    },
    [handleCreateNode]
  );

  const handleDeleteNode = useCallback(
    async (nodeId) => {
      const id = Number(nodeId);
      if (!Number.isFinite(id)) return;
      setTree((prev) => reconcileStructuralParents(autoFixTree(removeNodeFromTree(prev, id))));
      if (selectedNodeId === id) setSelectedNodeId(null);
    },
    [selectedNodeId]
  );

  const handleDuplicateNode = useCallback(
    async (nodeId) => {
      const source = findNodeInTree(tree, Number(nodeId));
      if (!source) return null;
      const idMap = new Map();
      const cloneDeep = (n, parentId = null) => {
        const newId = nextTempIdRef.current;
        nextTempIdRef.current -= 1;
        idMap.set(n.id, newId);
        const kids = Array.isArray(n.children) ? n.children : [];
        const cloned = {
          ...clone(n),
          id: newId,
          parentNodeId: parentId,
          children: [],
        };
        cloned.children = kids.map((c) => cloneDeep(c, newId));
        return cloned;
      };
      const parentId = source.parentNodeId ?? null;
      const duplicated = cloneDeep(source, parentId);
      setTree((prev) => reconcileStructuralParents(autoFixTree(addNodeToTree(prev, parentId, duplicated, null))));
      return { tree, duplicatedNodeId: duplicated.id };
    },
    [tree]
  );

  const handleReorderNode = useCallback(
    async ({ nodeId, newParentId, newIndex }) => {
      const id = Number(nodeId);
      const targetParent = newParentId != null ? Number(newParentId) : null;
      const idx = Math.max(0, Number(newIndex) || 0);
      const moving = findNodeInTree(tree, id);
      if (!moving) return;
      if (targetParent != null) {
        const parentNode = findNodeInTree(tree, targetParent);
        if (!parentNode) return;
        if (!isValidNodeHierarchy(moving.nodeType, parentNode.nodeType)) return;
        if (subtreeContainsId(moving, targetParent)) return;
      } else {
        if (!isValidNodeHierarchy(moving.nodeType, null)) return;
      }
      const without = removeNodeFromTree(tree, id);
      const moved = { ...moving, parentNodeId: targetParent };
      const next = addNodeToTree(without, targetParent, moved, idx);
      setTree(reconcileStructuralParents(autoFixTree(next)));
    },
    [tree]
  );

  const handleSave = useCallback(async () => {
    if (!projectOk || !compOk) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      const fixed = reconcileStructuralParents(autoFixTree(tree));
      validateTree(fixed);
      const res = await fetch(`/api/projects/${pid}/global-components/${cid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: fixed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save global component');
      setComponent(data?.item || component);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }, [cid, compOk, component, pid, projectOk, tree]);

  return (
    <BuilderThemeProvider persistence={projectOk ? { projectId: pid, pageSlug: 'global-component' } : null}>
      <div className="bld-shell" data-bld-mode="global-component">
        <div className="bld-shell__topbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <a className="bld-btn" href={returnTo}>
            ← Back
          </a>
          <div style={{ fontWeight: 800 }}>
            Global Component:{' '}
            <span style={{ fontWeight: 700, opacity: 0.9 }}>{component?.name || `#${cid}`}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="bld-btn" onClick={load} disabled={isLoading || isSaving}>
              Reload
            </button>
            <button type="button" className="bld-btn bld-btn--primary" onClick={handleSave} disabled={isLoading || isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <div className="bld-shell__body">
          <div className="bld-center">
            <BuilderCanvas
              device={device}
              onDeviceChange={setDevice}
              tree={tree}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              isLoading={isLoading}
              onCreateNode={handleCreateNode}
              onQuickAddNode={handleQuickAddNode}
              isCreatingNode={false}
              onReorderNode={handleReorderNode}
              isReorderingNode={false}
              onDeleteNode={handleDeleteNode}
              onUpdateNode={handleUpdateNode}
              onDuplicateNode={handleDuplicateNode}
              isSavingNode={false}
              isDeletingNode={false}
              deletingNodeId={null}
              onCreateSection={async ({ columnCount }) => {
                // Minimal section creation for global editor.
                const row = await createLocalNode({ nodeType: 'row', parentNodeId: null, displayName: 'Section' });
                for (let i = 0; i < Math.max(1, Number(columnCount) || 1); i += 1) {
                  // eslint-disable-next-line no-await-in-loop
                  await createLocalNode({ nodeType: 'column', parentNodeId: row.id, displayName: `Column ${i + 1}` });
                }
              }}
              projectType="website"
              minimalPageChrome
            />
          </div>
          <aside className="bld-right" aria-label="Style and properties">
            <BuilderInspector
              variant="panel"
              device={device}
              onDeviceChange={setDevice}
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              projectPages={[]}
              projectId={pid}
              activeTab={inspectorTab}
              onActiveTabChange={setInspectorTab}
              onSetPreviewCssForNode={() => {}}
              onSetActiveSpacingEdit={() => {}}
              overflowDiagnostics={null}
              pageTree={tree}
            />
          </aside>
        </div>
        {errorMessage ? <div className="bld-shell__error">{errorMessage}</div> : null}
      </div>
    </BuilderThemeProvider>
  );
}

