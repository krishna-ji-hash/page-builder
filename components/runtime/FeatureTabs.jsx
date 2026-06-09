'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { resolveFeatureTabsProps } from '@/lib/featureTabsDefaults';
import { FEATURE_TAB_FIELD_SELECTOR } from '@/lib/builderTextEditClick.js';
import {
  featureTabFieldHasInlineHtml,
  featureTabBulletInnerHtml,
  sanitizeFeatureTabFieldHtml,
} from '@/lib/featureTabInlineHtml';
import { inlineFontSizeOverridePropsFromHtml } from '@/lib/inlineFontSize';
import {
  featureTabPanelFigureVars,
  featureTabPanelImageInlineStyle,
} from '@/lib/featureTabPanelImage';
import { shouldNeutralizeHardcodedBodyTextColors } from '@/lib/bodyTextNeutralization.js';

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
  sectionTone = null,
  darkContentMode = false,
  onActiveTabChange,
  builderMode = false,
  builderEditable = false,
  textEditBlurCommitGuard = null,
  featureTabValueSyncGuard = null,
  onPatchTab,
  onTabImageFile,
  panelMode = 'fields',
  panelContent = null,
  style,
  className,
}) {
  const useElementsPanel = String(panelMode || 'fields').trim() === 'elements';
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
  const featureTabSanitizeOpts = useMemo(
    () => ({
      neutralizeHardcodedBodyTextColors: shouldNeutralizeHardcodedBodyTextColors({
        darkContentMode,
        sectionTone,
      }),
    }),
    [darkContentMode, sectionTone]
  );

  /** Tab ids changed (add/remove/reorder) — reset to saved active or first tab. */
  useEffect(() => {
    const next = String(activeTabIdProp ?? '').trim();
    const valid = tabs.some((t) => t.id === next) ? next : tabs[0]?.id || '';
    lastPropActiveRef.current = valid;
    setActiveId(valid);
    setEditingTabLabelId(null);
  }, [tabIdsSignature]);

  /** Builder only: inspector / saved props pushed a new activeTabId — always honor it. */
  useEffect(() => {
    if (!controlled) return;
    const next = String(activeTabIdProp ?? '').trim();
    if (!next || !tabs.some((t) => t.id === next)) return;
    setActiveId((cur) => {
      if (cur === next) return cur;
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
      if (!id || id === activeId) return;
      setEditingTabLabelId(null);
      /** Builder: save current panel only; active tab is local until Inspector sets default for live. */
      if (controlled && builderMode) {
        void (async () => {
          await onActiveTabChange?.(id);
          setActiveId(id);
          lastPropActiveRef.current = id;
        })();
        return;
      }
      if (controlled) {
        void onActiveTabChange?.(id);
        return;
      }
      setActiveId(id);
      lastPropActiveRef.current = id;
      onActiveTabChange?.(id);
    },
    [activeId, builderMode, controlled, onActiveTabChange]
  );

  /** Keep the active tab label fully visible inside the horizontal nav strip. */
  useEffect(() => {
    const wrap = navWrapRef.current;
    if (!wrap || !activeId) return;
    const tabBtn = wrap.querySelector('.live-feature-tabs__tab.is-active');
    tabBtn?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeId, tabIdsSignature]);

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
    const items = Array.from(list.querySelectorAll(FEATURE_TAB_FIELD_SELECTOR))
      .map((el) => {
        const raw = el.innerHTML;
        if (featureTabFieldHasInlineHtml(raw)) {
          return sanitizeFeatureTabFieldHtml(raw, featureTabSanitizeOpts);
        }
        return String(el.innerText || '').trim();
      })
      .filter(Boolean);
    const prev = JSON.stringify(activePanel.bullets || []);
    const next = JSON.stringify(items);
    if (next !== prev) patchTabById(activePanel.id, { bullets: items });
  }, [activePanel, patchTabById, featureTabSanitizeOpts]);

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
      {...(sectionTone === 'dark' || sectionTone === 'light' ? { 'data-section-tone': sectionTone } : {})}
    >
      {canvasEdit ? (
        <p className="live-feature-tabs__builder-hint" aria-hidden>
          {useElementsPanel
            ? 'Click a tab to switch · select blocks in the panel · + Add element (sidebar) for rows, Counter, cards'
            : 'Click a tab to edit its content · Inspector → Default active tab sets live/draft · double-click tab name to rename'}
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
                    blurCommitGuard={textEditBlurCommitGuard}
                    valueSyncGuard={featureTabValueSyncGuard}
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
        {useElementsPanel ? (
          <div
            className={`live-feature-tabs__panel-body live-feature-tabs__panel-body--elements${
              canvasEdit ? ' live-feature-tabs__panel-body--editable' : ''
            }`}
            onPointerDown={canvasEdit ? stopCanvasBubble : undefined}
          >
            {panelContent ? (
              panelContent
            ) : (
              <p className="live-feature-tabs__elements-empty">
                {canvasEdit
                  ? 'Inspector → Content → Enable section layout (elements), or add Row / Counter / Image here after switching tabs.'
                  : 'Tab panel content is empty.'}
              </p>
            )}
          </div>
        ) : (
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
                  htmlMode
                  blurCommitGuard={textEditBlurCommitGuard}
                  valueSyncGuard={featureTabValueSyncGuard}
                  onCommit={(next) => patchTabById(activePanel.id, { heading: next })}
                  onPointerDown={stopCanvasBubble}
                />
              ) : featureTabFieldHasInlineHtml(activePanel.heading) ? (
                <h3
                  className="live-feature-tabs__heading"
                  dangerouslySetInnerHTML={{ __html: sanitizeFeatureTabFieldHtml(activePanel.heading, featureTabSanitizeOpts) }}
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
                  htmlMode
                  blurCommitGuard={textEditBlurCommitGuard}
                  valueSyncGuard={featureTabValueSyncGuard}
                  onCommit={(next) => patchTabById(activePanel.id, { paragraph: next })}
                  onPointerDown={stopCanvasBubble}
                />
              ) : featureTabFieldHasInlineHtml(activePanel.paragraph) ? (
                <p
                  className="live-feature-tabs__paragraph"
                  {...inlineFontSizeOverridePropsFromHtml(activePanel.paragraph)}
                  dangerouslySetInnerHTML={{ __html: sanitizeFeatureTabFieldHtml(activePanel.paragraph, featureTabSanitizeOpts) }}
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
                  <li
                    key={`${activePanel.id}-b-${bulletIdx}`}
                    {...inlineFontSizeOverridePropsFromHtml(item)}
                  >
                    {canvasEdit ? (
                      <FeatureTabCanvasField
                        as="span"
                        className="live-feature-tabs__editable"
                        value={item}
                        htmlMode
                        blurCommitGuard={textEditBlurCommitGuard}
                        valueSyncGuard={featureTabValueSyncGuard}
                        onCommit={() => commitBulletsFromList()}
                        onPointerDown={stopCanvasBubble}
                      />
                    ) : featureTabFieldHasInlineHtml(item) ? (
                      <span
                        dangerouslySetInnerHTML={{ __html: featureTabBulletInnerHtml(item, featureTabSanitizeOpts) }}
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
              data-ft-image-fit={imageFit}
              style={featureTabPanelFigureVars(imageFit, panelHeightPx)}
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
                data-ft-panel-image=""
                style={featureTabPanelImageInlineStyle(imageFit, panelHeightPx)}
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
        )}
      </div>
    </div>
  );
}
