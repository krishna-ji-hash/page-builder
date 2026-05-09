'use client';

import { useMemo, useState } from 'react';
import { isValidNodeHierarchy } from '@/lib/builderHierarchy';
import { getWidgetsForProjectType } from '@/lib/builder/widgetRegistry';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { FULL_PAGE_TEMPLATES } from '@/lib/fullPageTemplates';
import { getGlobalLinkMeta, isLinkedGlobalPlaceholder } from '@/lib/globalComponentLinkMeta';

const ELEMENT_CARDS = [
  { id: 'heading', label: 'Heading', icon: 'H', supported: true },
  { id: 'text', label: 'Text', icon: 'TXT', supported: true },
  { id: 'rich_text', label: 'Rich Text', icon: 'RT', supported: true },
  { id: 'image', label: 'Image', icon: 'IMG', supported: true },
  { id: 'button', label: 'Button', icon: 'BTN', supported: true },
  { id: 'menu', label: 'Menu', icon: 'MNU', supported: true },
  { id: 'input', label: 'Input', icon: 'IN', supported: true },
  { id: 'textarea', label: 'Textarea', icon: 'TA', supported: true },
  { id: 'select', label: 'Select', icon: 'SEL', supported: true },
  { id: 'checkbox', label: 'Checkbox', icon: 'CHK', supported: true },
  { id: 'radio', label: 'Radio', icon: 'RAD', supported: true },
  { id: 'switch', label: 'Switch', icon: 'SWT', supported: true },
  { id: 'date', label: 'Date', icon: 'DT', supported: true },
  { id: 'submit', label: 'Submit', icon: 'SUB', supported: true },
  { id: 'form', label: 'Form', icon: 'FRM', supported: true },
  { id: 'table', label: 'Table', icon: 'TBL', supported: true },
  { id: 'carousel', label: 'Carousel', icon: 'CAR', supported: true },
];

const validParentTypes = new Set(['row', 'column', 'stack']);
const nodeTypeByBlockId = {};

function resolveNodeType(blockId) {
  return nodeTypeByBlockId[blockId] || blockId;
}

function resolveParentNodeIdForCreate(nodeType, selectedNode) {
  if (nodeType === 'row') {
    return null;
  }
  return selectedNode?.id || null;
}

function LayerTree({
  nodes,
  depth = 0,
  selectedNodeId,
  onSelectNode,
  collapsedMap,
  onToggleCollapse,
  onDeleteNode,
  onMoveNode,
  onMoveIntoSelected,
}) {
  const depthClass = `bld-layer-tree__item--depth-${Math.min(depth, 6)}`;
  return (
    <div className="bld-layer-tree">
      {nodes.map((node, index) => (
        <div key={node.id} className={`bld-layer-tree__branch ${depthClass}`}>
          <div className={`bld-layer-tree__item ${node.id === selectedNodeId ? 'is-selected' : ''}`}>
            {node.children?.length ? (
              <button
                type="button"
                className="bld-layer-tree__twist"
                onClick={() => onToggleCollapse?.(node.id)}
                aria-label={collapsedMap?.[node.id] ? 'Expand layer' : 'Collapse layer'}
              >
                {collapsedMap?.[node.id] ? '▸' : '▾'}
              </button>
            ) : (
              <span className="bld-layer-tree__twist is-placeholder" aria-hidden>
                ·
              </span>
            )}
            <button type="button" className="bld-layer-tree__pick" onClick={() => onSelectNode?.(node.id)}>
              <span className="bld-layer-tree__name">{node.displayName}</span>
              <span className="bld-layer-tree__type">{nodeTypeLabel(node.nodeType)}</span>
              {isLinkedGlobalPlaceholder(node) ? (
                <span
                  className="bld-chip"
                  style={{ marginLeft: 8, padding: '2px 8px', cursor: 'default' }}
                  title={
                    getGlobalLinkMeta(node)?.globalComponentName
                      ? `Linked: ${getGlobalLinkMeta(node).globalComponentName}`
                      : 'Linked global component'
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Linked
                </span>
              ) : null}
            </button>
            <div className="bld-layer-tree__actions">
              <button
                type="button"
                className="bld-layer-tree__action"
                title="Move up"
                aria-label="Move up"
                onClick={() => onMoveNode?.(node.id, -1)}
                disabled={index === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="bld-layer-tree__action"
                title="Move down"
                aria-label="Move down"
                onClick={() => onMoveNode?.(node.id, 1)}
                disabled={index === nodes.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                className="bld-layer-tree__action is-danger"
                title="Delete node"
                aria-label="Delete node"
                onClick={() => onDeleteNode?.(node.id)}
              >
                ×
              </button>
              <button
                type="button"
                className="bld-layer-tree__action"
                title="Move into selected container"
                aria-label="Move into selected container"
                onClick={() => onMoveIntoSelected?.(node.id)}
              >
                ↳
              </button>
            </div>
          </div>
          {node.children?.length && !collapsedMap?.[node.id] ? (
            <LayerTree
              nodes={node.children}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              collapsedMap={collapsedMap}
              onToggleCollapse={onToggleCollapse}
              onDeleteNode={onDeleteNode}
              onMoveNode={onMoveNode}
              onMoveIntoSelected={onMoveIntoSelected}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function nodeTypeLabel(nodeType) {
  if (nodeType === 'row') return 'Section';
  if (nodeType === 'column') return 'Column';
  if (nodeType === 'stack') return 'Stack';
  return 'Widget';
}

function ToolPanel({ title, description, onBack }) {
  return (
    <div className="bld-sidebar" role="complementary" aria-label={title}>
      <div className="bld-sidebar__head">
        <div className="bld-sidebar__title">{title}</div>
        <button
          type="button"
          className="bld-sidebar__close"
          aria-label="Back to add panel"
          onClick={onBack}
        >
          x
        </button>
      </div>
      <div className="bld-sidebar__body">
        <div className="bld-sidebar__hint">{description}</div>
      </div>
    </div>
  );
}

export default function BuilderSidebar({
  activeTab,
  onTabChange,
  selectedNode,
  selectedNodeId,
  onSelectNode,
  tree,
  onCreateNode,
  onQuickAddNode,
  onCreateSection,
  onInsertStarterTemplate,
  onInsertHeaderTemplate,
  onCreateComponentPreset,
  onInsertSectionTemplate,
  onApplyFullPageTemplate,
  onUpdateNode,
  onDeleteNode,
  onReorderNode,
  device = 'desktop',
  isCreatingNode,
  projectType = 'website',
  projectPages = [],
  projectTemplates = [],
  onSavePageTemplate,
  onImportPageTemplate,
  reusableBlocks = [],
  onSaveReusableBlock,
  onInsertReusableBlock,
  onRenameReusableBlock,
  onDeleteReusableBlock,
  onInsertGlobalSection,
  onExportPage,
  globalSections,
  globalComponents = [],
  onRefreshGlobalComponents,
  onOpenGlobalComponentEditor,
}) {
  const { tokens, setTokens } = useBuilderTheme();
  const hasGlobalHeader = Boolean(globalSections?.header);
  const hasGlobalFooter = Boolean(globalSections?.footer);
  const canCreateUnderSelection = Boolean(selectedNode && validParentTypes.has(selectedNode.nodeType));
  const [collapsedLayerMap, setCollapsedLayerMap] = useState({});
  const [selectedFullPageTemplateId, setSelectedFullPageTemplateId] = useState(
    FULL_PAGE_TEMPLATES?.[0]?.id || ''
  );

  const toggleLayerCollapse = (nodeId) =>
    setCollapsedLayerMap((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  const totalLayerCount = useMemo(() => {
    const walk = (arr) => (arr || []).reduce((acc, n) => acc + 1 + walk(n.children || []), 0);
    return walk(tree || []);
  }, [tree]);

  const findNodeLocation = (nodes, targetNodeId, parentId = null) => {
    for (let idx = 0; idx < (nodes || []).length; idx += 1) {
      const current = nodes[idx];
      if (Number(current.id) === Number(targetNodeId)) {
        return { parentId, index: idx, siblingsCount: nodes.length };
      }
      const childMatch = findNodeLocation(current.children || [], targetNodeId, current.id);
      if (childMatch) return childMatch;
    }
    return null;
  };

  const handleMoveLayer = (nodeId, delta) => {
    if (!onReorderNode) return;
    const location = findNodeLocation(tree || [], nodeId, null);
    if (!location) return;
    const nextIndex = location.index + delta;
    if (nextIndex < 0 || nextIndex >= location.siblingsCount) return;
    onReorderNode({
      nodeId,
      newParentId: location.parentId,
      newIndex: nextIndex,
    });
  };

  const findNodeById = (nodes, targetId) => {
    for (const node of nodes || []) {
      if (Number(node.id) === Number(targetId)) return node;
      const child = findNodeById(node.children || [], targetId);
      if (child) return child;
    }
    return null;
  };

  const containsNodeId = (node, targetId) => {
    if (!node) return false;
    if (Number(node.id) === Number(targetId)) return true;
    return (node.children || []).some((child) => containsNodeId(child, targetId));
  };

  const handleMoveLayerIntoSelected = (nodeId) => {
    if (!onReorderNode || !selectedNode?.id) return;
    if (!validParentTypes.has(selectedNode.nodeType)) return;
    if (Number(nodeId) === Number(selectedNode.id)) return;
    const movingNode = findNodeById(tree || [], nodeId);
    if (!movingNode) return;
    if (!isValidNodeHierarchy(movingNode.nodeType, selectedNode.nodeType)) return;
    if (containsNodeId(movingNode, selectedNode.id)) return;
    const newIndex = Array.isArray(selectedNode.children) ? selectedNode.children.length : 0;
    onReorderNode({
      nodeId,
      newParentId: selectedNode.id,
      newIndex,
    });
  };

  if (activeTab === 'styles') {
    return (
      <ToolPanel
        title="Styles"
        description="Styles mode active. Select a node and use the right inspector to edit style properties."
        onBack={() => onTabChange('blocks')}
      />
    );
  }

  if (activeTab === 'interactions') {
    return (
      <ToolPanel
        title="Interactions"
        description="Interactions mode active. Hooking animations/triggers can be added here next."
        onBack={() => onTabChange('blocks')}
      />
    );
  }

  if (activeTab === 'settings') {
    return (
      <ToolPanel
        title="Settings"
        description="Settings mode active. Page-level and node-level settings can be managed from this panel."
        onBack={() => onTabChange('blocks')}
      />
    );
  }

  if (activeTab === 'cms') {
    return (
      <ToolPanel
        title="CMS"
        description="CMS mode active. Collections and dynamic bindings can be managed from this panel."
        onBack={() => onTabChange('blocks')}
      />
    );
  }

  if (activeTab === 'layers') {
    return (
      <div className="bld-sidebar" role="complementary" aria-label="Layers panel">
        <div className="bld-sidebar__head">
          <div className="bld-sidebar__title">Layers</div>
        </div>
        <div className="bld-sidebar__body">
          <div className="bld-sidebar__hint">Click a layer to select it on the canvas.</div>
          <div className="bld-sidebar__hint">Layers: {totalLayerCount}</div>
          <LayerTree
            nodes={tree || []}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            collapsedMap={collapsedLayerMap}
            onToggleCollapse={toggleLayerCollapse}
            onDeleteNode={onDeleteNode}
            onMoveNode={handleMoveLayer}
            onMoveIntoSelected={handleMoveLayerIntoSelected}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bld-sidebar" role="complementary" aria-label="Builder sidebar">
      <div className="bld-sidebar__head">
        <div className="bld-sidebar__title">
          {activeTab === 'templates'
            ? 'Templates'
            : activeTab === 'reusable'
              ? 'Reusable Blocks'
            : activeTab === 'globals'
              ? 'Globals'
              : 'Elements'}
        </div>
      </div>

      <div className="bld-sidebar__body">
        {activeTab === 'blocks' ? (
          <>
            {!tree?.length ? (
              <div className="bld-sidebar__hint">
                Empty page: use <strong>Templates</strong> or the quick actions above, or add sections from the canvas.
              </div>
            ) : null}
            <div className="bld-sidebar__hint">
              {selectedNode
                ? `Selected: ${selectedNode.displayName} (${selectedNode.nodeType})`
                : 'Start by adding a section on the canvas, then add elements inside it.'}
            </div>
            <div className="bld-sidebar__hint">
              Project type: <strong>{projectType}</strong> (widgets loaded from registry)
            </div>

            <details className="bld-acc" open>
              <summary>Presets</summary>
              <div className="bld-acc__body bld-acc__body--grid bld-acc__body--grid-pairs">
                <button type="button" className="bld-block-card" onClick={() => onCreateComponentPreset?.('hero')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">H</span>
                  <span className="bld-block-card__label">Hero</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onCreateComponentPreset?.('cta')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">↳</span>
                  <span className="bld-block-card__label">CTA</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onCreateComponentPreset?.('card')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">C</span>
                  <span className="bld-block-card__label">Card</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onCreateComponentPreset?.('pricing')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">$</span>
                  <span className="bld-block-card__label">Pricing block</span>
                </button>
              </div>
              <div className="bld-sidebar__hint">
                Tip: select a <strong>Stack</strong> first (or a Column with a Stack) to insert presets.
              </div>
            </details>
            <details className="bld-acc" open>
              <summary>Advanced elements</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                {ELEMENT_CARDS.map((block) => {
                  const nodeType = resolveNodeType(block.id);
                  const parentType = selectedNode?.nodeType || null;
                  const canQuickAddWidget =
                    Boolean(onQuickAddNode) &&
                    Boolean(selectedNode?.id) &&
                    nodeType !== 'row' &&
                    nodeType !== 'column' &&
                    nodeType !== 'stack';
                  const hierarchyMatches = isValidNodeHierarchy(nodeType, parentType);
                  const hierarchyValid = selectedNode ? (hierarchyMatches || canQuickAddWidget) : false;
                  const allowedWidgets = getWidgetsForProjectType(projectType || 'website');
                  const allowedByProject = Boolean(allowedWidgets[nodeType]);
                  const disabled =
                    !block.supported ||
                    !allowedByProject ||
                    !canCreateUnderSelection ||
                    !hierarchyValid ||
                    isCreatingNode;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      className="bld-block-card"
                      disabled={disabled}
                      title={
                        !allowedByProject
                          ? `Not available for project type "${projectType || 'website'}"`
                          : !selectedNode
                            ? 'Select a Stack (recommended) or any container, then add an element.'
                            : !canCreateUnderSelection
                              ? 'Select a Section, Column, or Stack first'
                              : !hierarchyValid
                                ? `Invalid hierarchy: ${nodeType} cannot be added inside ${selectedNode?.nodeType || 'root'}`
                                : block.label
                      }
                      onClick={() =>
                        block.supported &&
                        (canQuickAddWidget
                          ? onQuickAddNode({
                              targetNodeId: selectedNode.id,
                              nodeType,
                            })
                          : onCreateNode({
                              nodeType,
                              parentNodeId: resolveParentNodeIdForCreate(nodeType, selectedNode),
                            }))
                      }
                    >
                      <span className="bld-block-card__icon">{block.icon}</span>
                      <span className="bld-block-card__label">{block.label}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          </>
        ) : activeTab === 'templates' ? (
          <>
            <div className="bld-sidebar__hint">
              Templates: insert starter sections and page templates.
            </div>
            <details className="bld-acc" open>
              <summary>
                Full Page Templates
                <span className="bld-acc__meta">Simple list (no cards)</span>
              </summary>
              <div className="bld-acc__body">
                <div className="bld-field">
                  <label className="bld-label">Choose template</label>
                  <select
                    className="bld-input"
                    value={selectedFullPageTemplateId}
                    onChange={(e) => setSelectedFullPageTemplateId(e.target.value)}
                    disabled={isCreatingNode}
                  >
                    {(FULL_PAGE_TEMPLATES || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bld-acc__body bld-acc__body--grid">
                  <button
                    type="button"
                    className="bld-block-card"
                    onClick={() => onApplyFullPageTemplate?.({ templateId: selectedFullPageTemplateId, mode: 'insert' })}
                    disabled={isCreatingNode || !selectedFullPageTemplateId}
                    title="Insert full page template (keeps existing sections)"
                  >
                    <span className="bld-block-card__icon">＋</span>
                    <span className="bld-block-card__label">Insert</span>
                  </button>
                  <button
                    type="button"
                    className="bld-block-card"
                    onClick={() => onApplyFullPageTemplate?.({ templateId: selectedFullPageTemplateId, mode: 'replace' })}
                    disabled={isCreatingNode || !selectedFullPageTemplateId}
                    title="Replace page with selected template"
                  >
                    <span className="bld-block-card__icon">↻</span>
                    <span className="bld-block-card__label">Replace</span>
                  </button>
                </div>
              </div>
            </details>
            <details className="bld-acc" open>
              <summary>Starters</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                <button
                  type="button"
                  className="bld-block-card"
                  onClick={() => onInsertStarterTemplate?.({})}
                  disabled={isCreatingNode}
                >
                  <span className="bld-block-card__icon">TPL</span>
                  <span className="bld-block-card__label">Starter Page</span>
                </button>
                <button
                  type="button"
                  className="bld-block-card"
                  onClick={() => onInsertHeaderTemplate?.()}
                  disabled={isCreatingNode}
                >
                  <span className="bld-block-card__icon">HDR</span>
                  <span className="bld-block-card__label">Header</span>
                </button>
              </div>
            </details>
            <details className="bld-acc" open>
              <summary>Section Templates</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                <button type="button" className="bld-block-card" onClick={() => onInsertSectionTemplate?.('header')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">HDR</span>
                  <span className="bld-block-card__label">Header</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onInsertSectionTemplate?.('hero')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">H</span>
                  <span className="bld-block-card__label">Hero</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onInsertSectionTemplate?.('features')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">≡</span>
                  <span className="bld-block-card__label">Features</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onInsertSectionTemplate?.('footer')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">FTR</span>
                  <span className="bld-block-card__label">Footer</span>
                </button>
              </div>
            </details>
            {projectTemplates.length ? (
              <details className="bld-acc" open>
                <summary>Page Templates</summary>
                <div className="bld-acc__body bld-acc__body--grid">
                  {projectTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="bld-block-card"
                      onClick={() => onImportPageTemplate?.(template.id)}
                      disabled={isCreatingNode}
                      title={`Insert template: ${template.name || 'Untitled Template'}`}
                    >
                      <span className="bld-block-card__icon">↳</span>
                      <span className="bld-block-card__label">{template.name || 'Template'}</span>
                    </button>
                  ))}
                </div>
              </details>
            ) : (
              <div className="bld-sidebar__hint">No saved page templates yet.</div>
            )}
            <details className="bld-acc" open>
              <summary>Save</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                <button
                  type="button"
                  className="bld-block-card"
                  onClick={() => onSavePageTemplate?.()}
                  disabled={isCreatingNode}
                  title="Save current page as reusable template"
                >
                  <span className="bld-block-card__icon">TPL</span>
                  <span className="bld-block-card__label">Save Page Template</span>
                </button>
              </div>
            </details>
          </>
        ) : activeTab === 'reusable' ? (
          <>
            <div className="bld-sidebar__hint">
              Reusable blocks: save any <strong>Section</strong> (row) and insert it into any page (detached copy).
            </div>
            <details className="bld-acc" open>
              <summary>Save selected section</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                <button
                  type="button"
                  className="bld-block-card"
                  onClick={() => onSaveReusableBlock?.()}
                  disabled={isCreatingNode || !selectedNodeId}
                  title="Save current selected section as reusable block"
                >
                  <span className="bld-block-card__icon">RB</span>
                  <span className="bld-block-card__label">Save as Reusable</span>
                </button>
              </div>
              <div className="bld-sidebar__hint">
                Tip: select a <strong>Section</strong> on canvas first. If a child is selected, we save its parent section.
              </div>
            </details>
            <details className="bld-acc" open>
              <summary>Library</summary>
              {reusableBlocks.length ? (
                <div className="bld-acc__body">
                  {reusableBlocks.map((b) => (
                    <div key={b.id} className="bld-reusable-card">
                      <div className="bld-reusable-card__title" title={b.name}>{b.name}</div>
                      <div className="bld-reusable-card__meta">
                        #{b.id}
                      </div>
                      <div className="bld-reusable-card__actions">
                        <button type="button" className="bld-chip" onClick={() => onInsertReusableBlock?.(b.id)}>
                          Insert
                        </button>
                        <button type="button" className="bld-chip" onClick={() => onRenameReusableBlock?.(b.id)}>
                          Rename
                        </button>
                        <button type="button" className="bld-chip bld-chip--danger" onClick={() => onDeleteReusableBlock?.(b.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bld-sidebar__hint">No reusable blocks yet.</div>
              )}
            </details>
          </>
        ) : (
          <>
            <div className="bld-sidebar__hint">
              Globals: theme tokens and global header/footer insertion.
            </div>
            <details className="bld-acc" open>
              <summary>Global Theme</summary>
              <div className="bld-acc__body">
                <div className="bld-field">
                  <label className="bld-label">Primary Color</label>
                  <input
                    type="color"
                    className="bld-input"
                    value={tokens?.primary || '#3b82f6'}
                    onChange={(event) => setTokens((prev) => ({ ...prev, primary: event.target.value }))}
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Base Text Color</label>
                  <input
                    type="color"
                    className="bld-input"
                    value={tokens?.text || '#0f172a'}
                    onChange={(event) => setTokens((prev) => ({ ...prev, text: event.target.value }))}
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Font Family</label>
                  <input
                    className="bld-input"
                    value={tokens?.fontFamily || 'Inter'}
                    onChange={(event) => setTokens((prev) => ({ ...prev, fontFamily: event.target.value }))}
                    placeholder="Inter"
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Spacing (md)</label>
                  <input
                    className="bld-input"
                    type="number"
                    min="4"
                    value={Number(tokens?.spacing?.md ?? 16)}
                    onChange={(event) =>
                      setTokens((prev) => ({
                        ...prev,
                        spacing: { ...(prev.spacing || {}), md: Number(event.target.value || 16) },
                      }))
                    }
                  />
                  <div className="bld-field-note">Used by scale pickers as the default “md”.</div>
                </div>
              </div>
            </details>
            <details className="bld-acc" open>
              <summary>Global Components</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                <button
                  type="button"
                  className="bld-block-card"
                  onClick={() => onInsertGlobalSection?.('header')}
                  disabled={isCreatingNode || !hasGlobalHeader}
                  title={
                    hasGlobalHeader
                      ? 'Insert the saved global header snapshot as a new top-level section'
                      : 'Save a global header first: canvas → select a top-level section → ⋯ → Save as global header'
                  }
                >
                  <span className="bld-block-card__icon">GH</span>
                  <span className="bld-block-card__label">Insert Global Header</span>
                </button>
                <button
                  type="button"
                  className="bld-block-card"
                  onClick={() => onInsertGlobalSection?.('footer')}
                  disabled={isCreatingNode || !hasGlobalFooter}
                  title={
                    hasGlobalFooter
                      ? 'Insert the saved global footer snapshot as a new top-level section'
                      : 'Save a global footer first: canvas → select a top-level section → ⋯ → Save as global footer'
                  }
                >
                  <span className="bld-block-card__icon">GF</span>
                  <span className="bld-block-card__label">Insert Global Footer</span>
                </button>
              </div>
              {!hasGlobalHeader && !hasGlobalFooter ? (
                <div className="bld-field-note">
                  Nothing saved yet. Use a section row’s ⋯ menu on the canvas → Save as global header/footer.
                </div>
              ) : null}
            </details>
            <details className="bld-acc" open>
              <summary>
                Linked Components Library
                <span className="bld-acc__meta">{Array.isArray(globalComponents) ? globalComponents.length : 0} items</span>
              </summary>
              <div className="bld-acc__body">
                <div className="bld-sidebar__hint">
                  Convert any section into a linked global component. Linked sections must be edited in the global editor.
                </div>
                <div className="bld-acc__body bld-acc__body--grid">
                  <button type="button" className="bld-block-card" onClick={() => onRefreshGlobalComponents?.()} disabled={isCreatingNode}>
                    <span className="bld-block-card__icon">↻</span>
                    <span className="bld-block-card__label">Refresh</span>
                  </button>
                </div>
                {Array.isArray(globalComponents) && globalComponents.length ? (
                  <div className="bld-acc__body">
                    {globalComponents.map((c) => (
                      <div key={c.id} className="bld-reusable-card">
                        <div className="bld-reusable-card__title" title={c.name}>
                          {c.name}
                        </div>
                        <div className="bld-reusable-card__meta">
                          {c.type || 'generic'} • links: {Number(c.linkedPagesCount || 0)}
                        </div>
                        <div className="bld-reusable-card__meta">
                          Updated: {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
                        </div>
                        <div className="bld-reusable-card__actions">
                          <button type="button" className="bld-chip" onClick={() => onOpenGlobalComponentEditor?.(c.id)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bld-sidebar__hint">No global components yet. Convert a section to create one.</div>
                )}
              </div>
            </details>
            <details className="bld-acc" open>
              <summary>Export</summary>
              <div className="bld-acc__body bld-acc__body--grid">
                <button type="button" className="bld-block-card" onClick={() => onExportPage?.('html')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">HTML</span>
                  <span className="bld-block-card__label">Export HTML</span>
                </button>
                <button type="button" className="bld-block-card" onClick={() => onExportPage?.('react')} disabled={isCreatingNode}>
                  <span className="bld-block-card__icon">JSX</span>
                  <span className="bld-block-card__label">Export React</span>
                </button>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}