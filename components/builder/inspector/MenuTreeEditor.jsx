'use client';

import { useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { normalizeMenuItems } from '@/lib/menuItems';
import { InspectorNumInput } from '@/components/builder/inspector/InspectorNumeric';

const MAX_DEPTH = 4;

function newId() {
  return `item-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function clone(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

function findPath(items, id, path = []) {
  for (let i = 0; i < (items || []).length; i += 1) {
    const it = items[i];
    if (!it) continue;
    if (String(it.id) === String(id)) return [...path, i];
    const kids = Array.isArray(it.children) ? it.children : [];
    const found = findPath(kids, id, [...path, i, 'children']);
    if (found) return found;
  }
  return null;
}

function getByPath(root, path) {
  let cur = root;
  for (const p of path) cur = cur?.[p];
  return cur;
}

function setAtPath(root, path, value) {
  if (!path?.length) return value;
  const out = Array.isArray(root) ? [...root] : { ...(root || {}) };
  let cur = out;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const next = cur[key];
    cur[key] = Array.isArray(next) ? [...next] : { ...(next || {}) };
    cur = cur[key];
  }
  cur[path[path.length - 1]] = value;
  return out;
}

function removeAtPath(items, path) {
  const parentPath = path.slice(0, -1);
  const idx = path[path.length - 1];
  const parent = parentPath.length ? getByPath(items, parentPath) : items;
  const arr = Array.isArray(parent) ? [...parent] : [];
  const removed = arr[idx];
  arr.splice(idx, 1);
  const next = parentPath.length ? setAtPath(items, parentPath, arr) : arr;
  return { next, removed };
}

function insertIntoChildren(items, parentId, child) {
  const p = findPath(items, parentId);
  if (!p) return items;
  const parent = getByPath(items, p);
  const children = Array.isArray(parent.children) ? [...parent.children] : [];
  children.push({ ...child, children: Array.isArray(child.children) ? child.children : [] });
  return setAtPath(items, [...p, 'children'], children);
}

function depthOfPath(path) {
  // item depth starts at 1, children adds another level
  // path like [0,'children',2,'children',1] => depth 3
  const childSegments = path.filter((x) => x === 'children').length;
  return 1 + childSegments;
}

function wouldExceedDepth(node, targetDepth) {
  let max = targetDepth;
  const walk = (n, d) => {
    if (d > max) max = d;
    (n.children || []).forEach((c) => walk(c, d + 1));
  };
  walk(node, targetDepth);
  return max > MAX_DEPTH;
}

function DroppableInto({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`bld-menu-dropinto ${isOver ? 'is-over' : ''}`.trim()}>
      {children}
    </div>
  );
}

function SortableRow({ item, depth, collapsed, onToggleCollapse, selectedId, onSelect, onPatch, onAddChild, onRemove }) {
  const sortable = useSortable({ id: String(item.id) });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const hasKids = Array.isArray(item.children) && item.children.length > 0;
  const isCollapsed = Boolean(collapsed[item.id]);
  const isSelected = String(selectedId || '') === String(item.id);

  return (
    <div ref={sortable.setNodeRef} style={style} className={`bld-menu-row ${isSelected ? 'is-selected' : ''}`.trim()}>
      <div className="bld-menu-row__head" style={{ paddingLeft: `${Math.min(28, (depth - 1) * 14)}px` }}>
        <button
          type="button"
          className="bld-menu-row__drag"
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>
        <button
          type="button"
          className="bld-menu-row__collapse"
          onClick={() => hasKids && onToggleCollapse?.(item.id)}
          disabled={!hasKids}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {hasKids ? (isCollapsed ? '▸' : '▾') : '·'}
        </button>
        <button type="button" className="bld-menu-row__pick" onClick={() => onSelect?.(item.id)} title="Edit item">
          <span className="bld-menu-row__label">{item.label || 'Item'}</span>
          <span className="bld-menu-row__to" title={item.to || '#'}>{item.to || '#'}</span>
        </button>
        <button type="button" className="bld-menu-row__action" onClick={() => onAddChild?.(item.id)} title="Add child">
          + child
        </button>
        <button type="button" className="bld-menu-row__action is-danger" onClick={() => onRemove?.(item.id)} title="Remove">
          ×
        </button>
      </div>

      {isSelected ? (
        <div className="bld-menu-row__edit">
          <div className="bld-field-grid">
            <div className="bld-field">
              <label className="bld-label">Label</label>
              <input className="bld-input" value={String(item.label || '')} onChange={(e) => onPatch(item.id, { label: e.target.value })} />
            </div>
            <div className="bld-field">
              <label className="bld-label">URL</label>
              <input className="bld-input" value={String(item.to || '')} onChange={(e) => onPatch(item.id, { to: e.target.value })} placeholder="/about or https://…" />
            </div>
            <div className="bld-field">
              <label className="bld-label">Target</label>
              <select className="bld-input" value={String(item.target || '')} onChange={(e) => onPatch(item.id, { target: e.target.value })}>
                <option value="">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
            <div className="bld-field">
              <label className="bld-label">Icon</label>
              <input className="bld-input" value={String(item.icon || '')} onChange={(e) => onPatch(item.id, { icon: e.target.value })} placeholder="star" />
            </div>
          </div>
          <div className="bld-field">
            <label className="bld-label">Description (submenu)</label>
            <input className="bld-input" value={String(item.description || '')} onChange={(e) => onPatch(item.id, { description: e.target.value })} />
          </div>

          <details className="bld-acc" style={{ marginTop: 10 }}>
            <summary>Mega menu (per item)</summary>
            <div className="bld-field" style={{ marginTop: 10 }}>
              <label className="bld-label">Enable mega for this dropdown</label>
              <select
                className="bld-input"
                value={item.mega?.enabled ? 'yes' : 'no'}
                onChange={(e) => onPatch(item.id, { mega: { ...(item.mega || {}), enabled: e.target.value === 'yes' } })}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="bld-field">
              <label className="bld-label">Columns</label>
              <InspectorNumInput
                min={1}
                max={6}
                value={item.mega?.columns ?? 2}
                onChange={(n) =>
                  onPatch(item.id, { mega: { ...(item.mega || {}), columns: n == null ? 2 : n } })
                }
              />
            </div>
            <div className="bld-field-grid">
              <div className="bld-field">
                <label className="bld-label">Featured title</label>
                <input
                  className="bld-input"
                  value={String(item.mega?.featured?.label || '')}
                  onChange={(e) =>
                    onPatch(item.id, { mega: { ...(item.mega || {}), featured: { ...(item.mega?.featured || {}), label: e.target.value } } })
                  }
                />
              </div>
              <div className="bld-field">
                <label className="bld-label">Featured link</label>
                <input
                  className="bld-input"
                  value={String(item.mega?.featured?.to || '')}
                  onChange={(e) =>
                    onPatch(item.id, { mega: { ...(item.mega || {}), featured: { ...(item.mega?.featured || {}), to: e.target.value } } })
                  }
                />
              </div>
            </div>
            <div className="bld-field">
              <label className="bld-label">Featured description</label>
              <input
                className="bld-input"
                value={String(item.mega?.featured?.description || '')}
                onChange={(e) =>
                  onPatch(item.id, { mega: { ...(item.mega || {}), featured: { ...(item.mega?.featured || {}), description: e.target.value } } })
                }
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

function renderTree({
  items,
  depth,
  collapsed,
  onToggleCollapse,
  selectedId,
  onSelect,
  onPatch,
  onAddChild,
  onRemove,
}) {
  const ids = (items || []).map((it) => String(it.id));
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {(items || []).map((it) => {
        const isCollapsed = Boolean(collapsed[it.id]);
        return (
          <div key={it.id}>
            <DroppableInto id={`into:${it.id}`}>
              <SortableRow
                item={it}
                depth={depth}
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
                selectedId={selectedId}
                onSelect={onSelect}
                onPatch={onPatch}
                onAddChild={onAddChild}
                onRemove={onRemove}
              />
            </DroppableInto>
            {!isCollapsed && Array.isArray(it.children) && it.children.length ? (
              <div className="bld-menu-children">
                {renderTree({
                  items: it.children,
                  depth: depth + 1,
                  collapsed,
                  onToggleCollapse,
                  selectedId,
                  onSelect,
                  onPatch,
                  onAddChild,
                  onRemove,
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </SortableContext>
  );
}

export default function MenuTreeEditor({ value, onChange }) {
  const initial = useMemo(() => {
    const norm = normalizeMenuItems(Array.isArray(value) ? value : []).items;
    return norm;
  }, [value]);

  const [items, setItems] = useState(initial);
  const [collapsed, setCollapsed] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  // Sync when external value changes (e.g. project-pages toggle)
  useMemo(() => {
    setItems(initial);
    // keep collapse/selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const emit = (next) => {
    const normalized = normalizeMenuItems(next).items;
    setItems(normalized);
    onChange?.(normalized);
  };

  const toggleCollapse = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addRoot = () => {
    emit([
      ...(items || []),
      {
        id: newId(),
        label: 'New item',
        to: '#',
        target: '',
        icon: '',
        description: '',
        children: [],
        dropdown: false,
        mega: null,
        kind: 'link',
      },
    ]);
  };

  const addChild = (parentId) => {
    const next = clone(items || []);
    const parentPath = findPath(next, parentId);
    if (!parentPath) return;
    const parent = getByPath(next, parentPath);
    const depth = depthOfPath(parentPath);
    if (depth + 1 > MAX_DEPTH) {
      setError(`Max nesting depth is ${MAX_DEPTH}.`);
      return;
    }
    const children = Array.isArray(parent.children) ? [...parent.children] : [];
    children.push({
      id: newId(),
      label: 'New child',
      to: '#',
      target: '',
      icon: '',
      description: '',
      children: [],
      dropdown: false,
      mega: null,
      kind: 'link',
    });
    const updated = setAtPath(next, [...parentPath, 'children'], children);
    setError('');
    emit(updated);
  };

  const removeItem = (id) => {
    const next = clone(items || []);
    const p = findPath(next, id);
    if (!p) return;
    const { next: after } = removeAtPath(next, p);
    if (String(selectedId) === String(id)) setSelectedId(null);
    emit(after);
  };

  const patchItem = (id, patch) => {
    const next = clone(items || []);
    const p = findPath(next, id);
    if (!p) return;
    const item = getByPath(next, p);
    const updated = { ...(item || {}), ...(patch || {}) };
    const after = setAtPath(next, p, updated);
    emit(after);
  };

  const reorderWithinParent = (activeId, overId) => {
    const next = clone(items || []);
    const aPath = findPath(next, activeId);
    const oPath = findPath(next, overId);
    if (!aPath || !oPath) return;
    const aParent = aPath.slice(0, -1);
    const oParent = oPath.slice(0, -1);
    // Only reorder within same array (same parent path)
    if (JSON.stringify(aParent) !== JSON.stringify(oParent)) return;
    const arr = aParent.length ? getByPath(next, aParent) : next;
    const aIdx = aPath[aPath.length - 1];
    const oIdx = oPath[oPath.length - 1];
    if (!Array.isArray(arr)) return;
    const moved = arrayMove(arr, aIdx, oIdx);
    const after = aParent.length ? setAtPath(next, aParent, moved) : moved;
    emit(after);
  };

  const moveInto = (activeId, parentId) => {
    const next = clone(items || []);
    const aPath = findPath(next, activeId);
    if (!aPath) return;
    const { next: removedTree, removed } = removeAtPath(next, aPath);
    if (!removed) return;
    // Prevent inserting into own subtree (already removed, so fine) and depth guard
    const parentPath = findPath(removedTree, parentId);
    if (!parentPath) return;
    const parentDepth = depthOfPath(parentPath);
    if (parentDepth + 1 > MAX_DEPTH || wouldExceedDepth(removed, parentDepth + 1)) {
      setError(`Max nesting depth is ${MAX_DEPTH}.`);
      return;
    }
    const after = insertIntoChildren(removedTree, parentId, removed);
    setError('');
    emit(after);
    setCollapsed((prev) => ({ ...prev, [parentId]: false }));
  };

  return (
    <div className="bld-menu-editor">
      <div className="bld-menu-editor__head">
        <div className="bld-menu-editor__title">Menu items</div>
        <div className="bld-menu-editor__actions">
          <button type="button" className="bld-chip" onClick={addRoot}>
            + Add item
          </button>
        </div>
      </div>
      {error ? <div className="bld-menu-editor__error">{error}</div> : null}
      <p className="bld-menu-editor__hint">
        Drag to reorder. Drop onto an item to nest (max depth {MAX_DEPTH}). Visual editor auto-sanitizes items.
      </p>

      <DndContext
        sensors={sensors}
        onDragEnd={({ active, over }) => {
          if (!active?.id || !over?.id) return;
          const activeId = String(active.id);
          const overId = String(over.id);
          if (overId.startsWith('into:')) {
            const parentId = overId.slice('into:'.length);
            if (parentId && parentId !== activeId) moveInto(activeId, parentId);
            return;
          }
          if (activeId !== overId) reorderWithinParent(activeId, overId);
        }}
      >
        <div className="bld-menu-tree" role="tree" aria-label="Menu tree editor">
          {renderTree({
            items,
            depth: 1,
            collapsed,
            onToggleCollapse: toggleCollapse,
            selectedId,
            onSelect: setSelectedId,
            onPatch: patchItem,
            onAddChild: addChild,
            onRemove: removeItem,
          })}
        </div>
      </DndContext>
    </div>
  );
}

