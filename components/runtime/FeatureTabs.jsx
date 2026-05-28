'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { resolveFeatureTabsProps } from '@/lib/featureTabsDefaults';

/**
 * Dispatch Solutions-style feature tabs: nav bar + two-column panel (copy | image).
 * Live: local click state only. Builder: persists activeTabId + canvas inline edit.
 */
export default function FeatureTabs({
  tabs: tabsProp,
  activeTabId: activeTabIdProp,
  imageFit: imageFitProp,
  imageHeightPx: imageHeightPxProp,
  tabAlign: tabAlignProp,
  onActiveTabChange,
  builderMode = false,
  builderEditable = false,
  onPatchTab,
  onTabImageFile,
  style,
  className,
}) {
  const { tabs, activeTabId: initialActive, imageFit, imageHeightPx, tabAlign } = useMemo(
    () =>
      resolveFeatureTabsProps({
        tabs: tabsProp,
        activeTabId: activeTabIdProp,
        imageFit: imageFitProp,
        imageHeightPx: imageHeightPxProp,
        tabAlign: tabAlignProp,
      }),
    [tabsProp, activeTabIdProp, imageFitProp, imageHeightPxProp, tabAlignProp]
  );
  const alignClass =
    tabAlign === 'left'
      ? 'live-feature-tabs--align-left'
      : tabAlign === 'stretch'
        ? 'live-feature-tabs--align-stretch'
        : 'live-feature-tabs--align-center';
  const controlled = typeof onActiveTabChange === 'function';
  const [activeId, setActiveId] = useState(() => initialActive || tabs[0]?.id || '');
  const [editingTabLabelId, setEditingTabLabelId] = useState(null);
  const [navDragging, setNavDragging] = useState(false);
  const navWrapRef = useRef(null);
  const navId = useId();
  const lastPropActiveRef = useRef(initialActive || tabs[0]?.id || '');
  const imageInputRef = useRef(null);
  const bulletsListRef = useRef(null);
  const navDragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, didDrag: false, pointerId: null });
  const tabIdsSignature = useMemo(() => tabs.map((t) => t.id).join('|'), [tabs]);

  /** Tab ids changed (add/remove/reorder) — reset to saved active or first tab. */
  useEffect(() => {
    const next = String(activeTabIdProp ?? '').trim();
    const valid = tabs.some((t) => t.id === next) ? next : tabs[0]?.id || '';
    lastPropActiveRef.current = valid;
    setActiveId(valid);
    setEditingTabLabelId(null);
  }, [tabIdsSignature]);

  /** Builder only: inspector preview / save pushed a new activeTabId. */
  useEffect(() => {
    if (!controlled) return;
    const next = String(activeTabIdProp ?? '').trim();
    if (!next || !tabs.some((t) => t.id === next)) return;
    setActiveId((cur) => {
      if (cur === next) {
        lastPropActiveRef.current = next;
        return cur;
      }
      if (lastPropActiveRef.current === cur && tabs.some((t) => t.id === cur)) {
        return cur;
      }
      lastPropActiveRef.current = next;
      return next;
    });
  }, [activeTabIdProp, controlled, tabIdsSignature]);

  const activePanel = tabs.find((t) => t.id === activeId) || tabs[0];

  const onSelect = useCallback(
    (id, event) => {
      if (navDragRef.current?.didDrag) {
        navDragRef.current.didDrag = false;
        return;
      }
      if (event) {
        event.preventDefault();
        if (builderMode) event.stopPropagation();
      }
      if (!id) return;
      if (id !== activeId) {
        setEditingTabLabelId(null);
        setActiveId(id);
        lastPropActiveRef.current = id;
        onActiveTabChange?.(id);
      }
    },
    [activeId, builderMode, onActiveTabChange]
  );

  const onNavPointerDown = useCallback((event) => {
    if (event.pointerType !== 'mouse') return;
    if (event.button !== 0) return;
    const el = navWrapRef.current;
    if (!el) return;
    navDragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      didDrag: false,
      pointerId: event.pointerId,
    };
    setNavDragging(true);
  }, []);

  const onNavPointerMove = useCallback((event) => {
    const el = navWrapRef.current;
    const st = navDragRef.current;
    if (!el || !st?.active) return;
    if (st.pointerId != null && event.pointerId !== st.pointerId) return;
    const dx = event.clientX - st.startX;
    if (!st.didDrag && Math.abs(dx) > 4) {
      st.didDrag = true;
      // Only capture once we are actually dragging; otherwise it breaks normal button clicks.
      try {
        el.setPointerCapture?.(event.pointerId);
      } catch {
        // ignore
      }
    }
    if (st.didDrag) {
      event.preventDefault();
      el.scrollLeft = st.startScrollLeft - dx;
    }
  }, []);

  const onNavPointerUpOrCancel = useCallback((event) => {
    const el = navWrapRef.current;
    const st = navDragRef.current;
    if (!st?.active) return;
    if (st.pointerId != null && event.pointerId !== st.pointerId) return;
    st.active = false;
    setNavDragging(false);
    try {
      el?.releasePointerCapture?.(event.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const stopCanvasBubble = builderMode
    ? (event) => {
        event.stopPropagation();
      }
    : undefined;

  const patchActive = useCallback(
    (patch) => {
      if (!activePanel?.id || !onPatchTab) return;
      onPatchTab(activePanel.id, patch);
    },
    [activePanel?.id, onPatchTab]
  );

  const patchTabById = useCallback(
    (tabId, patch) => {
      if (!tabId || !onPatchTab) return;
      onPatchTab(tabId, patch);
    },
    [onPatchTab]
  );

  const commitBulletsFromList = useCallback(() => {
    const list = bulletsListRef.current;
    if (!list || !activePanel?.id) return;
    const items = Array.from(list.querySelectorAll('li'))
      .map((li) => String(li.innerText || '').trim())
      .filter(Boolean);
    const prev = (activePanel.bullets || []).join('\n');
    const next = items.join('\n');
    if (next !== prev) patchActive({ bullets: items });
  }, [activePanel, patchActive]);

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activePanel?.id) return;
    onTabImageFile?.(activePanel.id, file);
  };

  if (!tabs.length || !activePanel) return null;

  const panelHeightPx = Number(activePanel.imageHeightPx) > 0 ? activePanel.imageHeightPx : imageHeightPx;
  const canvasEdit = builderMode && builderEditable;

  return (
    <div
      className={['live-feature-tabs', alignClass, builderMode ? 'live-feature-tabs--builder' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {canvasEdit ? (
        <p className="live-feature-tabs__builder-hint" aria-hidden>
          Click a tab to switch · double-click tab name to rename · click panel text / image to edit
        </p>
      ) : null}

      <div
        ref={navWrapRef}
        className={`live-feature-tabs__nav-wrap${navDragging ? ' is-dragging' : ''}`}
        onPointerDown={onNavPointerDown}
        onPointerMove={onNavPointerMove}
        onPointerUp={onNavPointerUpOrCancel}
        onPointerCancel={onNavPointerUpOrCancel}
      >
        <div className="live-feature-tabs__nav" role="tablist" aria-labelledby={navId}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const editingLabel = canvasEdit && editingTabLabelId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${navId}-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`${navId}-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                className={`live-feature-tabs__tab${isActive ? ' is-active' : ''}`}
                onPointerDown={builderMode ? stopCanvasBubble : undefined}
                onClick={(event) => onSelect(tab.id, event)}
                onDoubleClick={(event) => {
                  if (!canvasEdit) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (tab.id !== activeId) onSelect(tab.id, event);
                  setEditingTabLabelId(tab.id);
                }}
              >
                {editingLabel ? (
                  <FeatureTabCanvasField
                    as="span"
                    className="live-feature-tabs__tab-label live-feature-tabs__editable"
                    value={tab.label}
                    autoFocus
                    onCommit={(next) => {
                      patchTabById(tab.id, { label: next });
                      setEditingTabLabelId(null);
                    }}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <span className="live-feature-tabs__tab-label">{tab.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${navId}-panel-${activePanel.id}`}
        role="tabpanel"
        aria-labelledby={`${navId}-${activePanel.id}`}
        className="live-feature-tabs__panel is-active"
        key={activePanel.id}
      >
        <div className="live-feature-tabs__grid">
          <div
            className={`live-feature-tabs__copy${canvasEdit ? ' live-feature-tabs__copy--editable' : ''}`}
            onPointerDown={canvasEdit ? stopCanvasBubble : undefined}
          >
            {activePanel.heading || canvasEdit ? (
              canvasEdit ? (
                <FeatureTabCanvasField
                  as="h3"
                  className="live-feature-tabs__heading live-feature-tabs__editable"
                  value={activePanel.heading}
                  onCommit={(next) => patchActive({ heading: next })}
                  onPointerDown={stopCanvasBubble}
                />
              ) : (
                <h3 className="live-feature-tabs__heading">{activePanel.heading}</h3>
              )
            ) : null}
            {activePanel.paragraph || canvasEdit ? (
              canvasEdit ? (
                <FeatureTabCanvasField
                  as="p"
                  className="live-feature-tabs__paragraph live-feature-tabs__editable"
                  value={activePanel.paragraph}
                  multiline
                  onCommit={(next) => patchActive({ paragraph: next })}
                  onPointerDown={stopCanvasBubble}
                />
              ) : (
                <p className="live-feature-tabs__paragraph">{activePanel.paragraph}</p>
              )
            ) : null}
            {activePanel.bullets?.length || canvasEdit ? (
              <ul
                ref={bulletsListRef}
                className="live-feature-tabs__bullets"
                onBlur={canvasEdit ? commitBulletsFromList : undefined}
              >
                {(activePanel.bullets?.length ? activePanel.bullets : canvasEdit ? [''] : []).map((item, bulletIdx) => (
                  <li key={`${activePanel.id}-b-${bulletIdx}`}>
                    {canvasEdit ? (
                      <FeatureTabCanvasField
                        as="span"
                        className="live-feature-tabs__editable"
                        value={item}
                        onCommit={() => commitBulletsFromList()}
                        onPointerDown={stopCanvasBubble}
                      />
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="live-feature-tabs__visual">
            <figure
              className={`live-feature-tabs__figure${canvasEdit ? ' live-feature-tabs__figure--editable' : ''}`}
              onPointerDown={canvasEdit ? stopCanvasBubble : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`${activePanel.id}-${activePanel.imageSrc}`}
                src={activePanel.imageSrc}
                alt={activePanel.imageAlt || ''}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                height={panelHeightPx > 0 ? panelHeightPx : undefined}
                style={{
                  objectFit: imageFit,
                  width: '100%',
                  height: `${panelHeightPx}px`,
                  minHeight: `${Math.min(220, panelHeightPx)}px`,
                  maxHeight: 'none',
                }}
              />
              {canvasEdit ? (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="live-feature-tabs__image-input"
                    aria-hidden
                    tabIndex={-1}
                    onChange={handleImageFile}
                  />
                  <button
                    type="button"
                    className="live-feature-tabs__image-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      imageInputRef.current?.click();
                    }}
                  >
                    Change image
                  </button>
                </>
              ) : null}
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}
