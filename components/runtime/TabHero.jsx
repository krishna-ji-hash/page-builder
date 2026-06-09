'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { shouldNeutralizeHardcodedBodyTextColors } from '@/lib/bodyTextNeutralization.js';
import {
  featureTabFieldHasInlineHtml,
  sanitizeFeatureTabFieldHtml,
} from '@/lib/featureTabInlineHtml';
import { inlineFontSizeOverridePropsFromHtml } from '@/lib/inlineFontSize';
import { resolveTabHeroProps } from '@/lib/tabHeroDefaults';
import { tabHeroPanelImageInlineStyle } from '@/lib/tabHeroPanelImage';

/**
 * Tab nav + full-width hero image + left overlay content card.
 */
export default function TabHero({
  panels: panelsProp,
  activePanelId: activePanelIdProp,
  tabAlign: tabAlignProp,
  defaultTabExplicit = false,
  builderMode = false,
  builderEditable = false,
  onActivePanelChange,
  onPatchPanel,
  onPanelImageFile,
  sectionTone = null,
  darkContentMode = false,
  textEditBlurCommitGuard = null,
  featureTabValueSyncGuard = null,
  style,
  className,
}) {
  const { panels, activePanelId: initialActive, tabAlign } = useMemo(
    () =>
      resolveTabHeroProps({
        panels: panelsProp,
        activePanelId: activePanelIdProp,
        tabAlign: tabAlignProp,
        defaultTabExplicit,
      }),
    [panelsProp, activePanelIdProp, tabAlignProp, defaultTabExplicit]
  );
  const alignClass =
    tabAlign === 'left'
      ? 'live-tab-hero--align-left'
      : tabAlign === 'stretch'
        ? 'live-tab-hero--align-stretch'
        : 'live-tab-hero--align-center';
  const controlled = typeof onActivePanelChange === 'function';
  const [activeId, setActiveId] = useState(() => initialActive || panels[0]?.id || '');
  const [editingTabLabelId, setEditingTabLabelId] = useState(null);
  const [navDragging, setNavDragging] = useState(false);
  const navWrapRef = useRef(null);
  const navId = useId();
  const imageInputRef = useRef(null);
  const navDragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, didDrag: false, pointerId: null });
  const panelIdsSignature = useMemo(() => panels.map((p) => p.id).join('|'), [panels]);
  const canvasEdit = builderMode && builderEditable;

  /** Panel ids changed (add/remove/reorder) — reset to saved default or first tab. */
  useEffect(() => {
    const next = String(initialActive ?? '').trim() || panels[0]?.id || '';
    setActiveId(next);
    setEditingTabLabelId(null);
  }, [panelIdsSignature]);

  /** Builder only: inspector pushed a new default active panel — honor it. */
  useEffect(() => {
    if (!controlled) return;
    const next = String(initialActive ?? '').trim();
    if (!next || !panels.some((p) => p.id === next)) return;
    setActiveId((cur) => (cur === next ? cur : next));
  }, [initialActive, controlled, panelIdsSignature]);

  const activePanel = panels.find((p) => p.id === activeId) || panels[0];

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
      setEditingTabLabelId(null);
      if (!id || id === activeId) return;
      /** Builder: active panel is local until Inspector sets default for live. */
      if (controlled && builderMode) {
        void (async () => {
          await onActivePanelChange?.(id);
          setActiveId(id);
        })();
        return;
      }
      if (controlled) {
        void onActivePanelChange?.(id);
        return;
      }
      setActiveId(id);
      onActivePanelChange?.(id);
    },
    [activeId, builderMode, controlled, onActivePanelChange]
  );

  const patchPanelById = useCallback(
    (panelId, patch) => {
      if (!panelId || !onPatchPanel || !patch) return;
      onPatchPanel(panelId, patch);
    },
    [onPatchPanel]
  );

  const stopCanvasBubble = builderMode
    ? (event) => {
        event.stopPropagation();
      }
    : undefined;

  const onNavPointerDown = useCallback((event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
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

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activePanel?.id) return;
    onPanelImageFile?.(activePanel.id, file);
  };

  if (!panels.length || !activePanel) return null;

  return (
    <div
      className={[
        'live-tab-hero',
        alignClass,
        builderMode ? 'live-tab-hero--builder' : '',
        canvasEdit ? 'live-tab-hero--editable' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-tab-hero=""
    >
      {canvasEdit ? (
        <p className="live-tab-hero__builder-hint" aria-hidden>
          Click tab to switch panel · double-click tab name to rename · click heading, text, or CTA to edit
        </p>
      ) : null}

      <div
        ref={navWrapRef}
        className={`live-tab-hero__nav-wrap${navDragging ? ' is-dragging' : ''}`}
        onPointerDown={onNavPointerDown}
        onPointerMove={onNavPointerMove}
        onPointerUp={onNavPointerUpOrCancel}
        onPointerCancel={onNavPointerUpOrCancel}
      >
        <div className="live-tab-hero__nav" role="tablist" aria-labelledby={navId}>
          {panels.map((panel) => {
            const isActive = panel.id === activeId;
            const editingLabel = canvasEdit && editingTabLabelId === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                role="tab"
                id={`${navId}-${panel.id}`}
                aria-selected={isActive}
                aria-controls={`${navId}-panel-${panel.id}`}
                tabIndex={isActive ? 0 : -1}
                className={`live-tab-hero__tab${isActive ? ' is-active' : ''}`}
                onPointerDown={builderMode ? stopCanvasBubble : undefined}
                onClick={(event) => onSelect(panel.id, event)}
                onDoubleClick={(event) => {
                  if (!canvasEdit) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (panel.id !== activeId) onSelect(panel.id, event);
                  setEditingTabLabelId(panel.id);
                }}
              >
                {editingLabel ? (
                  <FeatureTabCanvasField
                    as="span"
                    className="live-tab-hero__tab-label live-tab-hero__editable"
                    value={panel.label}
                    autoFocus
                    blurCommitGuard={textEditBlurCommitGuard}
                    valueSyncGuard={featureTabValueSyncGuard}
                    onCommit={(next) => {
                      patchPanelById(panel.id, { label: next });
                      setEditingTabLabelId(null);
                    }}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <span className="live-tab-hero__tab-label">{panel.label}</span>
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
        className="live-tab-hero__stage"
        key={activePanel.id}
        onPointerDown={canvasEdit ? stopCanvasBubble : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${activePanel.id}-${activePanel.imageSrc}`}
          className="live-tab-hero__bg"
          src={activePanel.imageSrc}
          alt={activePanel.imageAlt || ''}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          data-th-panel-image=""
          style={tabHeroPanelImageInlineStyle()}
        />
        <div className="live-tab-hero__scrim" aria-hidden />
        <div className="live-tab-hero__stage-inner">
        <div className={`live-tab-hero__card${canvasEdit ? ' live-tab-hero__card--editable' : ''}`}>
          {activePanel.heading || canvasEdit ? (
            canvasEdit ? (
              <FeatureTabCanvasField
                as="h2"
                className="live-tab-hero__heading live-tab-hero__editable"
                value={activePanel.heading}
                multiline
                htmlMode
                blurCommitGuard={textEditBlurCommitGuard}
                valueSyncGuard={featureTabValueSyncGuard}
                onCommit={(next) => patchPanelById(activePanel.id, { heading: next })}
                onPointerDown={stopCanvasBubble}
              />
            ) : featureTabFieldHasInlineHtml(activePanel.heading) ? (
              <h2
                className="live-tab-hero__heading"
                dangerouslySetInnerHTML={{
                  __html: sanitizeFeatureTabFieldHtml(activePanel.heading, tabHeroSanitizeOpts),
                }}
              />
            ) : (
              <h2 className="live-tab-hero__heading">{activePanel.heading}</h2>
            )
          ) : null}
          {activePanel.eyebrow || canvasEdit ? (
            canvasEdit ? (
              <FeatureTabCanvasField
                as="p"
                className="live-tab-hero__eyebrow live-tab-hero__editable"
                value={activePanel.eyebrow}
                htmlMode
                blurCommitGuard={textEditBlurCommitGuard}
                valueSyncGuard={featureTabValueSyncGuard}
                onCommit={(next) => patchPanelById(activePanel.id, { eyebrow: next })}
                onPointerDown={stopCanvasBubble}
              />
            ) : featureTabFieldHasInlineHtml(activePanel.eyebrow) ? (
              <p
                className="live-tab-hero__eyebrow"
                dangerouslySetInnerHTML={{
                  __html: sanitizeFeatureTabFieldHtml(activePanel.eyebrow, tabHeroSanitizeOpts),
                }}
              />
            ) : (
              <p className="live-tab-hero__eyebrow">{activePanel.eyebrow}</p>
            )
          ) : null}
          <div className="live-tab-hero__copy">
            {activePanel.paragraph || canvasEdit ? (
              canvasEdit ? (
                <FeatureTabCanvasField
                  as="p"
                  className="live-tab-hero__paragraph live-tab-hero__editable"
                  value={activePanel.paragraph}
                  multiline
                  htmlMode
                  blurCommitGuard={textEditBlurCommitGuard}
                  valueSyncGuard={featureTabValueSyncGuard}
                  onCommit={(next) => patchPanelById(activePanel.id, { paragraph: next })}
                  onPointerDown={stopCanvasBubble}
                />
              ) : featureTabFieldHasInlineHtml(activePanel.paragraph) ? (
                <p
                  className="live-tab-hero__paragraph"
                  {...inlineFontSizeOverridePropsFromHtml(activePanel.paragraph)}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeFeatureTabFieldHtml(activePanel.paragraph, tabHeroSanitizeOpts),
                  }}
                />
              ) : (
                <p className="live-tab-hero__paragraph">{activePanel.paragraph}</p>
              )
            ) : null}
          </div>
          {activePanel.ctaLabel || canvasEdit ? (
            canvasEdit ? (
              <span className="live-tab-hero__cta-wrap">
                <FeatureTabCanvasField
                  as="span"
                  className="live-tab-hero__cta live-tab-hero__editable"
                  value={activePanel.ctaLabel}
                  blurCommitGuard={textEditBlurCommitGuard}
                  valueSyncGuard={featureTabValueSyncGuard}
                  onCommit={(next) => patchPanelById(activePanel.id, { ctaLabel: next })}
                  onPointerDown={stopCanvasBubble}
                />
                <span className="live-tab-hero__cta-arrow" aria-hidden>
                  →
                </span>
              </span>
            ) : (
              <a className="live-tab-hero__cta" href={activePanel.ctaHref || '#'}>
                {activePanel.ctaLabel}
                <span className="live-tab-hero__cta-arrow" aria-hidden>
                  →
                </span>
              </a>
            )
          ) : null}
        </div>
        </div>
        {canvasEdit ? (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="live-tab-hero__image-input"
              aria-hidden
              tabIndex={-1}
              onChange={handleImageFile}
            />
            <button
              type="button"
              className="live-tab-hero__image-btn"
              onClick={(event) => {
                event.stopPropagation();
                imageInputRef.current?.click();
              }}
            >
              Change background
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
