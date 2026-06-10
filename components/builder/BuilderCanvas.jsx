'use client';

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { isValidNodeHierarchy } from '@/lib/builderHierarchy';
import {
  canonicalNodeId,
  computeMoveDown,
  computeMoveUp,
  computeReorderFromDrop,
  findNodeInTree,
  getSiblingContext,
} from '@/lib/builderTree';
import { isFooterRowNode, isHeaderRowNode, isNodeEditsDisabledBySectionLock } from '@/lib/rowLayoutMeta';
import { resolveBuilderCanvasSelectTarget, isSplitHeroCarouselNode } from '@/lib/builderCanvasSelect.js';
import {
  FEATURE_TAB_FIELD_SELECTOR,
  shouldStartFeatureTabTextEdit,
  shouldStartTextEditFromCanvasClick,
} from '@/lib/builderTextEditClick.js';
import {
  execFormatOnTextRoot,
  preserveTextEditSelectionForToolbar,
  scheduleAfterCanvasSelection,
} from '@/lib/canvasTextEditSession.js';
import { placeCaretAtPointer, selectionIsInsideRoot } from '@/lib/placeCaretAtPointer.js';
import { normalizeResponsiveStyle } from '@/lib/styleNormalizer';
import { withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { mergeDeviceStyleWithTypeDefaults, mergeMenuDeviceStyle } from '@/lib/nodeLayoutDefaults';
import { SECTION_TEMPLATES } from '@/lib/sectionTemplates';
import {
  buildStatsContentStackLayoutUpdate,
  buildStatsCounterLayoutUpdate,
  ensureStatsContentStackColumnPayload,
  findStatsContentStack,
  findStatsCounterNode,
  isStatsSectionRow,
} from '@/lib/statsCounterSection';
import {
  applyTemplateSectionContrast,
  findParentRowForNode,
  sectionTemplateDataAttrsForRow,
} from '@/lib/getInTouchSection';
import { mergeImageFigureStyleForShadow } from '@/lib/boxShadowLayout';
import {
  buildBuilderLiveRenderOptions,
  canRenderBuilderLeafViaLive,
  wrapBuilderLeafForInlineEdit,
} from '@/lib/builderLiveParity';
import { getWidgetPickerEntries } from '@/lib/builder/widgetRegistry';
import { renderNode } from '@/lib/liveRenderer';
import HeaderBrandLogo from '@/components/runtime/HeaderBrandLogo';
import {
  brandLogoPropsPatchFromFormKey,
  nodeLooksLikeBrandLogo,
  normalizeBrandLogoProps,
  parseBrandLogoWidthPx,
} from '@/lib/headerLogo';
import { RuntimeProvider } from '@/components/runtime/RuntimeProvider';
import { sanitizeLiveFlowPositionCss, sanitizeLiveRootContentRowCss } from '@/lib/sanitizeLiveLayout';
import { imageFitMode, mergeImageFigureStyleForContain } from '@/lib/imageFigureStyle';
import { getRichTextAnimationStyle } from '@/lib/richTextAnimation';
import { rootSemanticTag } from '@/lib/rootSemanticTag';
import { getBuilderPortalRoot } from '@/lib/builderPortalRoot';
import { segmentRootNodes } from '@/lib/liveHeaderStack';
import { isRootPageRow, liveDocRootRowSpacingVars, rowHasSpacingPadding } from '@/lib/liveDocSectionSpacing';
import {
  resolveHeaderLayoutMode,
  sanitizeHeaderRowCss,
} from '@/lib/headerLayoutMode';
import {
  headerBehaviorCssClasses,
  headerBehaviorDataAttrs,
  headerBehaviorRenderExtras,
  resolveHeaderBehaviorFromMeta,
} from '@/lib/headerBehavior.js';
import {
  landmarkContentDataAttrs,
  livePageCssVarOverridesForPage,
  resolveBodyLayout,
  resolveLandmarkContentMaxWidthPx,
  resolveLandmarkContentWidth,
  resolveSectionContentMaxWidthPx,
  resolveSectionContentWidth,
  rowSectionStripDataAttrs,
  sectionContentDataAttrs,
} from '@/lib/livePageCssVars';
import { bindInteractionObservers } from '@/lib/interactionScrollRuntime';
import { bindHeaderBehaviorScroll } from '@/lib/headerBehaviorScroll';
import { interactionPresentationClass, resolveLeafInteractionShell, deviceStyleForInteractionPreview } from '@/lib/nodeInteractionCss';
import { getDeviceStyle, sanitizeInlineMarginCss, styleToCss } from '@/lib/styleToCss';
import {
  applySectionLayoutToDeviceStyle,
  applySectionItemsChildToDeviceStyle,
  getSectionLayoutClasses,
  normalizeSectionLayout,
  nodeIsSectionItemsHost,
  sectionLayoutDataAttrs,
} from '@/lib/sectionLayout';
import { liveResponsiveLayoutClasses } from '@/lib/liveResponsiveClasses';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { mergeNodeStyleWithSiteTheme, normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { alignThemeTokensWithSiteTheme, themeTokensToCssVariableStyle } from '@/lib/themeTokens';
import Carousel from '@/components/runtime/Carousel';
import {
  featureTabsPropsFingerprint,
  patchFeatureTabs,
  resolveFeatureTabsProps,
} from '@/lib/featureTabsDefaults';
import {
  parseStatDisplayValue,
  patchStatsCounterItemFields,
  resolveStatsCounterProps,
} from '@/lib/statsCounterDefaults';
import {
  patchTabHeroPanel,
  resolveActiveTabHeroPanelIdFromDom,
  resolveTabHeroProps,
} from '@/lib/tabHeroDefaults';
import {
  findFeatureTabPanelStack,
  isFeatureTabsElementPanelMode,
  resolveActiveFeatureTabPanelIdFromDom,
} from '@/lib/featureTabPanels';
import { buildFeatureTabPanelPatchFromDom } from '@/lib/featureTabPanelCommit';
import { sanitizeFeatureTabFieldHtml, featureTabFieldHasInlineHtml } from '@/lib/featureTabInlineHtml';
import { BLD_FORMATTING_LOCK_ATTR } from '@/components/builder/canvas/FeatureTabCanvasField';
import { appendFaqItem, patchFaqItems, resolveFaqAccordionProps } from '@/lib/faqAccordionDefaults';
import Menu from '@/components/runtime/Menu';
import { applyBindingsToString } from '@/lib/cms/cmsBindings';
import { isProbablyInlineHtml, sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import {
  normalizeInlineTextProps,
  propsPatchForTextContent,
  resolveInlineTextHtml,
} from '@/lib/richTextNodeProps';
import {
  applyFontSizePxInRoot,
  ensureFontSizeMarkupInRoot,
  applyRichColorInRoot,
  execRichCommandInRoot,
  readFontSizePxFromRoot,
  restoreRichTextSelection,
  saveRichTextSelection,
  selectionNonCollapsedInRoot,
} from '@/lib/richTextExecCommands';
import { clearInlineFontSizeOnHost, stripToolbarFontSizeFromHtml } from '@/lib/inlineFontSize';
import {
  computeFloatingToolbarBesidePosition,
  computeFloatingToolbarPosition,
  resolveFloatingToolbarAnchorRect,
} from '@/lib/floatingTextToolbarPosition.js';
import {
  FLOATING_TOOLBAR_SELECTOR,
  isFocusInFloatingToolbar,
} from '@/lib/inlineEditBlurGuard';
import {
  isSiteContentDarkMode,
  shouldNeutralizeHardcodedBodyTextColors,
} from '@/lib/bodyTextNeutralization';
import { sectionToneDataAttrForCss } from '@/lib/liveSectionContrastVars.js';
import { applySectionToneToLeafCss, resolveSectionToneForNode } from '@/lib/sectionToneContext.js';
import { neutralizeLightSurfaceDeviceStyle } from '@/lib/sectionSurfaceNeutralization.js';
import { neutralizeLeafTextCssObject } from '@/lib/sanitizeRichHtml';
import ResizeHandle from './canvas/ResizeHandle';
import InlineEdit from './canvas/InlineEdit';
import AddSectionModal from './canvas/AddSectionModal';
import WidgetPicker from './canvas/WidgetPicker';
import BuilderOnboardingOverlay from './canvas/BuilderOnboardingOverlay';
import ColumnResizeOverlay from './canvas/ColumnResizeOverlay';
import GapHandlesOverlay from './canvas/GapHandlesOverlay';
import SpacingGuidesOverlay from './canvas/SpacingGuidesOverlay';
import GridOverlay from './canvas/GridOverlay';
import RichTextEditor from './RichTextEditor';
import FontSizeStepper, { clampFontSizePx, FONT_SIZE_MAX_PX, FONT_SIZE_MIN_PX } from './FontSizeStepper';
import { getGlobalLinkMeta } from '@/lib/globalComponentLinkMeta';
import { normalizeHeadingLevel as normalizeHeadingTag, semanticHeadingTypography } from '@/lib/headingLevel';
import { finalizeLeafDeviceStyle } from '@/lib/leafStylePipeline';
import {
  applyCompactHeaderDeviceStyle,
  ensureHeaderActionsVisibleCss,
  headerBarClassesForNode,
  headerColumnHasMultipleStacks,
  isHeaderActionsColumnNode,
  isHeaderActionsStackNode,
  isSiteHeaderRowForCompact,
  nodeSubtreeHasType,
} from '@/lib/headerCompactLayout';
import {
  buildImageAlignStylePatch,
  getImageParentFlexDirection,
  mapImageObjectPositionCss,
  readImageAlignAxes,
  resolveImageShellAlignFromProps,
  splitImageNodeCss,
} from '@/lib/imageBlockAlign';

const SECTION_TEMPLATE_IDS = new Set(Object.keys(SECTION_TEMPLATES));

/** WordPress-like inline formatting toolbar icons (24px viewBox). */
function WpIconBold() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function WpIconLink() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1m-4-2 1 1a5 5 0 0 1-7 7l-1-1a5 5 0 0 1 0-7" />
    </svg>
  );
}

function WpIconAlignLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5h18v2H3V5zm0 6h12v2H3v-2zm0 6h18v2H3v-2z" />
    </svg>
  );
}

function WpIconAlignCenter() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5h18v2H3V5zm3 6h12v2H9v-2zm-3 6h18v2H3v-2z" />
    </svg>
  );
}

function WpIconAlignRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5h18v2H3V5zm6 6h12v2H9v-2zm0 6h12v2H9v-2z" />
    </svg>
  );
}

function WpIconAlignTop() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4l-6 6h4v10h4V10h4l-6-6z" />
    </svg>
  );
}

function WpIconAlignBottom() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 20l6-6h-4V4h-4v10H6l6 6z" />
    </svg>
  );
}

/**
 * Floating toolbars use pointerdown preventDefault so the canvas does not treat the press as drag/pan.
 * That same cancelation applies to the event's original target, which breaks native `<select>` and color inputs.
 */
function consumeFloatingToolbarPointerForCanvas(event) {
  const t = event.target;
  if (t && typeof t.closest === 'function') {
    const inToolbar = t.closest('.bld-floating-inline-toolbar, .bld-floating-quick-toolbar, .bld-wp-toolbar');
    if (inToolbar) {
      const native = t.closest(
        'select, option, textarea, input, button, label, .bld-font-size-stepper, .bld-font-size-stepper__input, .bld-font-size-stepper__btn'
      );
      if (native && inToolbar.contains(native)) {
        event.stopPropagation();
        return;
      }
    }
  }
  event.preventDefault();
}

function isFocusInsideFloatingToolbar() {
  return isFocusInFloatingToolbar();
}

const LIVE_MIRROR_HEADING_ROOT_SELECTOR = [
  '.bld-demo-heading',
  '.bld-rich-text',
  '.bld-rich-content',
  '.bld-rich-heading',
  '.bld-section-title',
  '.bld-column-title',
].join(', ');

const LIVE_MIRROR_TEXT_ROOT_SELECTOR = [
  '.bld-demo-paragraph',
  '.bld-demo-text',
  '.bld-paragraph',
  '.bld-rich-text',
  '.bld-rich-content',
].join(', ');

function getRichTextCommandRoot({
  isInlineEditing,
  isRichTextEditing,
  isFeatureTabFieldEditing,
  inlineEditWrapRef,
  nodeElementRef,
  nodeType,
  pinnedTextEditRoot = null,
}) {
  if (isInlineEditing && inlineEditWrapRef?.current) {
    const ed = inlineEditWrapRef.current.querySelector('[contenteditable="true"], [contenteditable=""]');
    if (ed) return ed;
  }
  const shell = nodeElementRef?.current;
  if (!shell) return null;
  if (
    (nodeType === 'tabs' || nodeType === 'tab_hero' || nodeType === 'stats_counter') &&
    isFeatureTabFieldEditing
  ) {
    const focused = shell.querySelector(`${FEATURE_TAB_FIELD_SELECTOR}:focus`);
    if (focused) return focused;
    if (pinnedTextEditRoot && shell.contains(pinnedTextEditRoot)) return pinnedTextEditRoot;
    return shell.querySelector(FEATURE_TAB_FIELD_SELECTOR);
  }
  if (nodeType === 'rich_text' && isRichTextEditing) {
    return (
      shell.querySelector('.bld-rich-text--editing[contenteditable], .bld-rich-text[contenteditable]') ||
      shell.querySelector('.bld-rich-text--editing, .bld-rich-text')
    );
  }
  if (nodeType === 'heading') {
    return shell.querySelector(LIVE_MIRROR_HEADING_ROOT_SELECTOR);
  }
  if (nodeType === 'text' || nodeType === 'paragraph') {
    return shell.querySelector(LIVE_MIRROR_TEXT_ROOT_SELECTOR);
  }
  if (nodeType === 'button') return shell.querySelector('.bld-demo-button');
  return null;
}

function parseTypographyFontSizePx(raw, fallback = 16) {
  const s = String(raw || '').trim();
  if (!s) return fallback;
  const m = s.match(/^([\d.]+)\s*px$/i);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? Math.round(n) : fallback;
  }
  return fallback;
}

function applyDeviceStylePatch(existingStyle, device, patch, nodeType = null, siteTheme = null) {
  const normalizedCurrent = normalizeResponsiveStyle(existingStyle || {}, { nodeType, siteTheme });
  const desktopBase = normalizedCurrent.desktop || {};
  const currentDeviceStyle = getDeviceStyle(normalizedCurrent, device) || {};

  const STYLE_GROUPS = ['layout', 'spacing', 'size', 'typography', 'colors', 'background', 'effects', 'border', 'menu'];

  const targetDeviceMerged = {
    ...currentDeviceStyle,
  };
  for (const key of STYLE_GROUPS) {
    const p = patch?.[key];
    if (p == null || typeof p !== 'object' || Array.isArray(p)) continue;
    const cur = currentDeviceStyle[key];
    targetDeviceMerged[key] = { ...(cur && typeof cur === 'object' ? cur : {}), ...p };
  }

  const buildOverride = (baseGroup = {}, mergedGroup = {}) => {
    const out = {};
    Object.keys(mergedGroup).forEach((key) => {
      if (mergedGroup[key] !== baseGroup[key]) out[key] = mergedGroup[key];
    });
    return Object.keys(out).length ? out : undefined;
  };

  const nextStyle = {
    ...normalizedCurrent,
    desktop: desktopBase,
  };

  if (device === 'desktop') {
    nextStyle.desktop = targetDeviceMerged;
  } else {
    nextStyle[device] = {};
    for (const key of STYLE_GROUPS) {
      const ov = buildOverride(desktopBase[key] || {}, targetDeviceMerged[key] || {});
      if (ov) nextStyle[device][key] = ov;
    }
    Object.keys(nextStyle[device]).forEach((key) => {
      if (!nextStyle[device][key]) delete nextStyle[device][key];
    });
  }

  return {
    style_json: nextStyle,
    previewCss: styleToCss(targetDeviceMerged, siteTheme),
    targetDeviceMerged,
  };
}

/** Columns inside section rows use CSS `flex: 1 1 0`, which ignores plain width — neutralize when user sets width. */
function withFlexWidthOverride(nodeType, patch) {
  const w = patch.size?.width;
  if (!w || typeof w !== 'string') return patch;
  if (nodeType !== 'column' && nodeType !== 'stack' && nodeType !== 'rich_text') return patch;

  const pct = String(w).trim();
  if (pct === '100%' || pct === '100') {
    return {
      ...patch,
      layout: {
        ...(patch.layout || {}),
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0%',
        minWidth: 0,
        maxWidth: '100%',
      },
      size: {
        ...(patch.size || {}),
        width: '100%',
      },
    };
  }

  return {
    ...patch,
    layout: {
      ...(patch.layout || {}),
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: w,
      minWidth: 0,
    },
  };
}

function clampNumber(n, min, max) {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function snapGapToScale(px, siteTheme) {
  const scale = [
    { id: 'xs', px: Number(siteTheme?.spacing?.xs ?? 4) },
    { id: 'sm', px: Number(siteTheme?.spacing?.sm ?? 8) },
    { id: 'md', px: Number(siteTheme?.spacing?.md ?? 16) },
    { id: 'lg', px: Number(siteTheme?.spacing?.lg ?? 24) },
    { id: 'xl', px: Number(siteTheme?.spacing?.xl ?? 32) },
  ].filter((s) => Number.isFinite(s.px));
  if (!scale.length) return { gap: Math.max(0, Math.round(px)), gapScale: '' };
  let best = scale[0];
  let bestDist = Math.abs(best.px - px);
  for (const s of scale) {
    const d = Math.abs(s.px - px);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return { gap: best.px, gapScale: best.id };
}

function dropCollisionDetection(args) {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length) return pointerHits;
  return closestCenter(args);
}

function renderNodeContent(node, renderOpts = {}) {
  const {
    isInlineEditing,
    inlineDraftText,
    onInlineDraftChange,
    onInlineEditStart,
    onInlineEditCommit,
    onInlineEditCancel,
    inlineEditBlurCommitGuard,
    isSavingNode,
    sectionEditLocked = false,
    isRichTextEditing,
    onRichTextEditStart,
    onRichTextCommit,
    onRichTextCancel,
    richBlockStyle,
    menuStyle,
    widgetCss,
    device,
    cmsBindingContext,
    neutralizeBodyColorsPreview = false,
    neutralizeBodyColorsPersist = false,
    onTabsActiveChange = null,
    onFeatureTabsPatch = null,
    onFeatureTabsImageFile = null,
    onStatsCounterPatch = null,
    onTabHeroPatch = null,
    onTabHeroImageFile = null,
    onTabHeroActiveChange = null,
    onFaqOpenChange = null,
    onFaqAccordionPatch = null,
    onFaqAccordionAddItem = null,
    onSplitHeroSlidePatch = null,
    onSplitHeroSlideImageFile = null,
    siteTheme = null,
    themeTokens = null,
    insideSiteHeaderRow = false,
    builderPageId = null,
    builderProjectId = null,
    formPreviewMode = null,
    sectionTone = null,
    textEditToolbarOpen = false,
    textEditBlurCommitGuard = null,
    featureTabValueSyncGuard = null,
    renderFeatureTabPanel = null,
  } = renderOpts;
  const liveStylePresets = renderOpts.stylePresets ?? null;
  const liveAnimationPresets = renderOpts.animationPresets ?? null;
  const bind = (s) => (cmsBindingContext ? applyBindingsToString(String(s || ''), cmsBindingContext) : s);

  const builderCanvasHooks =
    onTabsActiveChange ||
    onFeatureTabsPatch ||
    onFeatureTabsImageFile ||
    onStatsCounterPatch ||
    onTabHeroPatch ||
    onTabHeroImageFile ||
    onTabHeroActiveChange ||
    onFaqOpenChange ||
    onSplitHeroSlidePatch ||
    sectionEditLocked ||
    textEditBlurCommitGuard ||
    featureTabValueSyncGuard
      ? {
          sectionEditLocked,
          textEditBlurCommitGuard,
          featureTabValueSyncGuard,
          ...(onTabsActiveChange ||
          onFeatureTabsPatch ||
          onFeatureTabsImageFile ||
          typeof renderFeatureTabPanel === 'function'
            ? {
                tabs: {
                  ...(onTabsActiveChange ? { onActiveTabChange: onTabsActiveChange } : {}),
                  ...(onFeatureTabsPatch ? { onPatchTab: onFeatureTabsPatch } : {}),
                  ...(onFeatureTabsImageFile ? { onTabImageFile: onFeatureTabsImageFile } : {}),
                  ...(typeof renderFeatureTabPanel === 'function' ? { renderPanel: renderFeatureTabPanel } : {}),
                },
              }
            : {}),
          ...(onStatsCounterPatch
            ? {
                statsCounter: {
                  onPatchItem: onStatsCounterPatch,
                },
              }
            : {}),
          ...(onTabHeroPatch || onTabHeroImageFile || onTabHeroActiveChange
            ? {
                tabHero: {
                  ...(onTabHeroPatch ? { onPatchPanel: onTabHeroPatch } : {}),
                  ...(onTabHeroImageFile ? { onPanelImageFile: onTabHeroImageFile } : {}),
                  ...(onTabHeroActiveChange ? { onActivePanelChange: onTabHeroActiveChange } : {}),
                },
              }
            : {}),
          ...(onFaqOpenChange
            ? {
                accordion: {
                  onOpenItemChange: onFaqOpenChange,
                  onPatchItem: onFaqAccordionPatch,
                  onAddItem: onFaqAccordionAddItem,
                },
              }
            : {}),
          ...(onSplitHeroSlidePatch
            ? {
                splitHero: {
                  onPatchSlide: onSplitHeroSlidePatch,
                  onSlideImageFile: onSplitHeroSlideImageFile,
                },
              }
            : {}),
        }
      : null;

  const liveRenderOptions = buildBuilderLiveRenderOptions({
    device: device || 'desktop',
    siteTheme,
    themeTokens,
    stylePresets: liveStylePresets,
    animationPresets: liveAnimationPresets,
    insideSiteHeaderRow,
    builderCanvas: builderCanvasHooks,
    pageId: builderPageId,
    projectId: builderProjectId,
    builderInlineCss: widgetCss || undefined,
    formPreviewMode: formPreviewMode || null,
    sectionTone: sectionTone || null,
    builderTree: renderOpts.builderTree || null,
  });

  const renderViaLive = () => {
    if (
      !canRenderBuilderLeafViaLive(node.nodeType, {
        inlineEditing: isInlineEditing,
        richTextEditing: isRichTextEditing,
        cmsBindingContext: Boolean(cmsBindingContext),
      })
    ) {
      return null;
    }
    const preview = renderNode(node, String(node.id ?? 'leaf'), liveRenderOptions);
    if (preview == null) return null;
    return wrapBuilderLeafForInlineEdit(node, preview, onInlineEditStart);
  };

  if (node.nodeType === 'heading') {
    const anim = getRichTextAnimationStyle(node.props?.animation || {});
    const HeadingTag = normalizeHeadingTag(node.props?.tag);
    const rawText = node.props?.text || '';
    const headingNorm = normalizeInlineTextProps(node.props || {});
    const headingHtmlMode =
      isInlineEditing &&
      (headingNorm.richText.enabled ||
        textEditToolbarOpen ||
        isProbablyInlineHtml(inlineDraftText) ||
        isProbablyInlineHtml(rawText));
    if (isInlineEditing) {
      return (
        <InlineEdit
          className="bld-inline-text-editor bld-inline-text-editor--heading"
          value={inlineDraftText}
          onChange={onInlineDraftChange}
          onCommit={() => onInlineEditCommit(node)}
          onCancel={onInlineEditCancel}
          blurCommitGuard={inlineEditBlurCommitGuard}
          disabled={isSavingNode || sectionEditLocked}
          htmlMode={headingHtmlMode}
        />
      );
    }
    if (cmsBindingContext) {
      const defaultLabel = 'Heading';
      if (isProbablyInlineHtml(rawText)) {
        const safe = sanitizeInlineLeafHtml(rawText, {
          neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPreview,
        });
        return (
          <HeadingTag
            className={`bld-demo-heading ${anim.className || ''}`.trim()}
            style={{ ...(widgetCss || {}), ...(anim.style || {}) }}
            onDoubleClick={(event) => onInlineEditStart(node, event)}
            dangerouslySetInnerHTML={{ __html: safe || defaultLabel }}
          />
        );
      }
      return (
        <HeadingTag
          className={`bld-demo-heading ${anim.className || ''}`.trim()}
          style={{ ...(widgetCss || {}), ...(anim.style || {}) }}
          onDoubleClick={(event) => onInlineEditStart(node, event)}
        >
          {bind(rawText || defaultLabel)}
        </HeadingTag>
      );
    }
    const liveHeading = renderViaLive();
    if (liveHeading) return liveHeading;
  }
  if (node.nodeType === 'text' || node.nodeType === 'paragraph') {
    const isParagraph = node.nodeType === 'paragraph';
    const demoTextClass = isParagraph ? 'bld-demo-paragraph' : 'bld-demo-text';
    const anim = getRichTextAnimationStyle(node.props?.animation || {});
    const rawText = node.props?.text || '';
    const textNorm = normalizeInlineTextProps(node.props || {});
    const textHtmlMode =
      isInlineEditing &&
      (textNorm.richText.enabled ||
        textEditToolbarOpen ||
        isProbablyInlineHtml(inlineDraftText) ||
        isProbablyInlineHtml(rawText));
    if (isInlineEditing) {
      return (
        <InlineEdit
          className={`bld-inline-text-editor bld-inline-text-editor--text${isParagraph ? ' bld-inline-text-editor--paragraph' : ''}`}
          multiline
          value={inlineDraftText}
          onChange={onInlineDraftChange}
          onCommit={() => onInlineEditCommit(node)}
          onCancel={onInlineEditCancel}
          blurCommitGuard={inlineEditBlurCommitGuard}
          disabled={isSavingNode || sectionEditLocked}
          htmlMode={textHtmlMode}
        />
      );
    }
    if (cmsBindingContext) {
      const defaultLabel = isParagraph ? 'Add your paragraph text here.' : 'Text block content';
      if (isProbablyInlineHtml(rawText)) {
        const safe = sanitizeInlineLeafHtml(rawText, {
          neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPreview,
        });
        return (
          <p
            className={`${demoTextClass} ${anim.className || ''}`.trim()}
            style={{ ...(widgetCss || {}), ...(anim.style || {}) }}
            onDoubleClick={(event) => onInlineEditStart(node, event)}
            dangerouslySetInnerHTML={{ __html: safe || defaultLabel }}
          />
        );
      }
      return (
        <p
          className={`${demoTextClass} ${anim.className || ''}`.trim()}
          style={{ ...(widgetCss || {}), ...(anim.style || {}) }}
          onDoubleClick={(event) => onInlineEditStart(node, event)}
        >
          {bind(rawText || defaultLabel)}
        </p>
      );
    }
    const liveText = renderViaLive();
    if (liveText) return liveText;
  }
  if (node.nodeType === 'button') {
    const anim = getRichTextAnimationStyle(node.props?.animation || {});
    if (isInlineEditing) {
      return (
        <InlineEdit
          className="bld-inline-text-editor bld-inline-text-editor--button"
          value={inlineDraftText}
          onChange={onInlineDraftChange}
          onCommit={() => onInlineEditCommit(node)}
          onCancel={onInlineEditCancel}
          blurCommitGuard={inlineEditBlurCommitGuard}
          disabled={isSavingNode || sectionEditLocked}
        />
      );
    }
    if (cmsBindingContext) {
      return (
        <button
          type="button"
          className={`bld-demo-button ${anim.className || ''}`.trim()}
          style={{ ...(widgetCss || {}), ...(anim.style || {}) }}
          onDoubleClick={(event) => onInlineEditStart(node, event)}
        >
          {bind(node.props?.text || 'Button')}
        </button>
      );
    }
    const liveButton = renderViaLive();
    if (liveButton) return liveButton;
  }
  if (node.nodeType === 'rich_text') {
    if (!isRichTextEditing) {
      const liveRich = renderViaLive();
      if (liveRich) return liveRich;
    }
    const animRich = getRichTextAnimationStyle(node.props?.animation || {});
    const mergedRt = {
      ...(richBlockStyle || {}),
      ...(animRich.style || {}),
    };
    return (
      <RichTextEditor
        html={node.props?.content || '<p></p>'}
        isEditing={Boolean(isRichTextEditing)}
        onStartEdit={onRichTextEditStart}
        onCommit={onRichTextCommit}
        onCancel={onRichTextCancel}
        disabled={Boolean(isSavingNode || sectionEditLocked)}
        style={{ ...(widgetCss || {}), ...(mergedRt || {}) }}
        className={`bld-rich-text--canvas ${animRich.className || ''}`.trim()}
        neutralizeBodyColorsPreview={neutralizeBodyColorsPreview}
        neutralizeBodyColorsPersist={neutralizeBodyColorsPersist}
        useFloatingToolbar
      />
    );
  }

  if (node.nodeType === 'modal') {
    const preview = renderNode(node, String(node.id ?? 'modal'), {
      ...liveRenderOptions,
      builderCanvas: builderCanvasHooks,
    });
    if (preview != null) return preview;
  }

  if (node.nodeType === 'image' && nodeLooksLikeBrandLogo(node)) {
    const brandLive = renderViaLive();
    if (brandLive) return brandLive;
    const figureStyle =
      imageFitMode(node.props?.imageFit) === 'contain'
        ? mergeImageFigureStyleForContain(widgetCss || {})
        : widgetCss || {};
    return (
      <figure className="bld-demo-image-wrap live-brand-logo" style={figureStyle}>
        <HeaderBrandLogo
          props={node.props}
          siteTheme={siteTheme}
          themeTokens={themeTokens}
          sectionTone={sectionTone}
          builderTree={renderOpts.builderTree}
          nodeId={node.id}
          device={device || 'desktop'}
          inSiteHeader={insideSiteHeaderRow}
        />
      </figure>
    );
  }

  const liveLeaf = renderViaLive();
  if (liveLeaf) return liveLeaf;

  if (node.nodeType === 'image') {
    const objectPosition = mapImageObjectPositionCss(node.props?.imageObjectPosition);
    const imageStyle = {
      objectFit: node.props?.imageFit || 'cover',
      ...(objectPosition ? { objectPosition } : {}),
      ...(Number(node.props?.imageHeightPx || 0) > 0
        ? { height: `${Number(node.props?.imageHeightPx || 0)}px` }
        : {}),
    };
    const src = cmsBindingContext ? bind(node.props?.src || '') : node.props?.src || '';
    const alt = cmsBindingContext ? bind(node.props?.alt || '') : node.props?.alt || '';
    const figureStyle = mergeImageFigureStyleForShadow(
      imageFitMode(node.props?.imageFit) === 'contain'
        ? mergeImageFigureStyleForContain(widgetCss || {})
        : widgetCss || {},
      widgetCss?.boxShadow
    );
    return (
      <figure className="bld-demo-image-wrap" style={figureStyle}>
        <img
          src={src || '/builder-placeholder.svg'}
          alt={alt || ''}
          className="bld-demo-image"
          style={imageStyle || undefined}
        />
        {node.props?.caption ? <figcaption className="bld-demo-image-caption">{node.props.caption}</figcaption> : null}
      </figure>
    );
  }

  return null;
}

function DropZone({
  id,
  label,
  validationParentType,
  draggingNodeType,
  isDisabled = false,
  showLabel = true,
  className = '',
}) {
  const invalidWhileDragging =
    draggingNodeType && !isValidNodeHierarchy(draggingNodeType, validationParentType ?? null);
  const disabled = isDisabled || invalidWhileDragging;

  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  const zoneKind = String(id || '').startsWith('before-')
    ? 'before'
    : String(id || '').startsWith('inside-')
      ? 'inside'
      : String(id || '').startsWith('root-drop')
        ? 'after'
        : 'inside';
  const zoneLabel =
    zoneKind === 'before' ? 'Place above' : zoneKind === 'after' ? 'Place at end' : 'Drop into layout';
  // Keep canvas clean: show drop targets only while dragging.
  // Hook must always run to preserve consistent hook order.
  if (!draggingNodeType) return null;
  return (
    <div
      ref={setNodeRef}
      className={`bld-drop-zone bld-drop-zone--${zoneKind} ${isOver && !disabled ? 'is-over' : ''} ${isOver && disabled ? 'is-over-invalid' : ''} ${disabled ? 'is-disabled' : ''} ${showLabel ? '' : 'is-minimal'} ${className}`.trim()}
    >
      {showLabel ? zoneLabel || label : null}
    </div>
  );
}

function friendlyFreeMoveSnapSummary(guideX, guideY) {
  const x =
    guideX === 'left'
      ? 'left edge'
      : guideX === 'center-x'
        ? 'horizontal center'
        : guideX === 'right'
          ? 'right edge'
          : null;
  const y =
    guideY === 'top'
      ? 'top edge'
      : guideY === 'center-y'
        ? 'vertical center'
        : guideY === 'bottom'
          ? 'bottom edge'
          : null;
  if (x && y) return `Snapped — ${x} · ${y}`;
  if (x) return `Snapped — ${x}`;
  if (y) return `Snapped — ${y}`;
  return 'Snapped';
}

function friendlyNeighborGapLine(gaps, spacing) {
  if (gaps) {
    const entries = [
      ['left', gaps.gapL],
      ['right', gaps.gapR],
      ['above', gaps.gapT],
      ['below', gaps.gapB],
    ].filter(([, v]) => v != null && v < 900);
    if (entries.length) {
      const [dir, px] = entries.reduce((a, b) => (a[1] <= b[1] ? a : b));
      const where =
        dir === 'left' ? 'to the left' : dir === 'right' ? 'to the right' : dir === 'above' ? 'above' : 'below';
      return `${px}px ${where}`;
    }
  }
  if (spacing) {
    const m = Math.min(spacing.left, spacing.right, spacing.top, spacing.bottom);
    return `${m}px from frame edge`;
  }
  return '';
}

function CanvasFloatingToolbar({
  dragListeners,
  dragDisabled = false,
  onDuplicate,
  onDelete,
  duplicateDisabled,
  deleteDisabled,
  menuItems,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const wrapRef = useRef(null);
  const dragAltHintId = useId();

  useEffect(() => {
    if (!moreOpen) return undefined;
    const handle = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setMoreOpen(false);
      }
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [moreOpen]);

  const visibleMenu = (menuItems || []).filter((item) => item && !item.hidden);

  return (
    <div
      ref={wrapRef}
      className="bld-canvas-toolbar bld-row__toolbar-inline"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="bld-drag-handle-wrap">
        <button
          type="button"
          className="bld-row__toolbar-btn bld-row__toolbar-btn--drag"
          title="Drag to reorder layers · Turn on Free mode in the top bar to drag-position widgets · Hold Alt while dragging to duplicate"
          aria-label="Drag to reorder"
          aria-describedby={dragAltHintId}
          disabled={dragDisabled}
          {...(dragDisabled ? {} : dragListeners)}
        >
          <span className="bld-row__grip" aria-hidden>
            ⋮⋮
          </span>
        </button>
        <span id={dragAltHintId} className="bld-drag-handle-hint" role="tooltip">
          Hold Alt while dragging to duplicate
        </span>
      </span>
      <button
        type="button"
        className="bld-row__toolbar-btn"
        title="Copy this block"
        aria-label="Duplicate"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onDuplicate?.(event);
        }}
        disabled={duplicateDisabled}
      >
        ⧉
      </button>
      <button
        type="button"
        className="bld-row__toolbar-btn bld-row__toolbar-btn--danger"
        title="Remove from page"
        aria-label="Delete"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.(event);
        }}
        disabled={deleteDisabled}
      >
        ×
      </button>
      {visibleMenu.length ? (
        <div className="bld-canvas-toolbar__more" onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className={`bld-row__toolbar-btn bld-row__toolbar-btn--more${moreOpen ? ' is-open' : ''}`.trim()}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            title="More"
            aria-label="More actions"
            onClick={(event) => {
              event.stopPropagation();
              setMoreOpen((prev) => !prev);
            }}
          >
            ⋯
          </button>
          {moreOpen ? (
            <div className="bld-canvas-toolbar__dropdown" role="menu">
              {visibleMenu.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className="bld-canvas-toolbar__menu-item"
                  disabled={Boolean(item.disabled)}
                  onMouseDown={
                    item.useMouseDown
                      ? (event) => {
                          setMoreOpen(false);
                          item.onSelect?.(event);
                        }
                      : undefined
                  }
                  onClick={
                    item.useMouseDown
                      ? undefined
                      : (event) => {
                          event.stopPropagation();
                          setMoreOpen(false);
                          item.onSelect?.(event);
                        }
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Renders per-tab panel stack children inside Feature Tabs (elements mode). */
function FeatureTabPanelChildren({ panelStack, nodeRendererProps }) {
  const kids = panelStack?.children;
  if (!Array.isArray(kids) || !kids.length) return null;
  return (
    <div className="bld-feature-tab-panel-children">
      {kids.map((childNode) => (
        <NodeRenderer
          key={childNode.id}
          node={childNode}
          parentNodeType="stack"
          {...nodeRendererProps}
        />
      ))}
    </div>
  );
}

function NodeRenderer({
  node,
  rowIndex = null,
  selectedNodeId,
  onSelectNode,
  parentNodeType,
  draggingNodeType,
  device,
  previewCssByNodeId,
  previewIxByNodeId = {},
  onSetPreviewCssForNode,
  formPreviewByNodeId = {},
  activeSpacingEdit,
  onReportOverflow,
  rowRole,
  onDeleteNode,
  onRequestNavigator,
  onInsertStarterTemplate,
  onInsertHeaderTemplate,
  onSetContainerDirection,
  onUpdateNode,
  onCreateNode,
  onQuickAddNode,
  onDuplicateNode,
  onReorderNode,
  isReorderingNode,
  /** Full page tree — used for section lock (read-only under locked sections). */
  tree = null,
  rowSiblingsCount = null,
  isCreatingNode,
  isSavingNode,
  isDeletingNode,
  deletingNodeId,
  onOpenWidgetPicker,
  showSectionAddButtonBefore = false,
  onOpenSectionInsert,
  hoveredNodeId,
  onHoverNode,
  onSaveGlobalSection,
  onConvertToGlobalComponent,
  onDetachFromGlobalComponent,
  onEditGlobalComponent,
  onAlignMenuRightInRow,
  onUploadLogoInRow,
  onStretchSectionFullWidth,
  onStretchSectionFromSelection,
  onAlignMenuRightFromSelection,
  isFreeMode = false,
  /** HTML tag for root rows only (`main` / `header` / `footer` / `section`), matches liveRenderer. */
  rowSemanticTag = null,
  /** Copy node id for keyboard paste / duplicate-from-buffer (shell). */
  onCopyNodeId,
  /** Briefly pulse outline on this node id after paste (shell). */
  flashPasteNodeId = null,
  /** Briefly highlight node after list reorder drop (canvas). */
  flashReorderNodeId = null,
  onAddSectionPreviewEnter,
  onAddSectionPreviewLeave,
  onFreeMoveBrush,
  freeMoveBrushActive = false,
  cmsContext = null,
  cmsPreviewByCollection = null,
  insideSiteHeaderRow = false,
  builderPageId = null,
  builderProjectId = null,
  /** Section row layout preset — passed to `sectionItemsHost` stacks (parity with liveRenderer). */
  sectionLayout = null,
  sectionTemplateId = null,
  /** Direct child of a section items host (blog/pricing/team card row). */
  insideSectionItemsHost = false,
  parentSectionLayout = null,
}) {
  const isSelected = node.id === selectedNodeId;
  const pendingTextEditPointerRef = useRef(null);
  const activeTextEditRootRef = useRef(null);
  const handleSelect = (event) => {
    const selectTarget = resolveBuilderCanvasSelectTarget(event, node.id);
    if (selectTarget === 'nav') {
      event.stopPropagation();
      return;
    }
    if (String(selectTarget) !== String(node.id)) {
      event.stopPropagation();
      onSelectNode(selectTarget);
      return;
    }
    event.stopPropagation();
    onSelectNode(node.id);
  };

  /** Capture phase: parent column/stack must select nested split-hero carousel before bubble stops. */
  const handleSelectCapture = (event) => {
    const selectTarget = resolveBuilderCanvasSelectTarget(event, node.id);
    if (selectTarget === 'nav') return;
    if (String(selectTarget) !== String(node.id)) {
      onSelectNode(selectTarget);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectNode(node.id);
  };

  const handleKeyDown = (event) => {
    const target = event.target;
    const tagName = target?.tagName?.toLowerCase?.() || '';
    const isEditableTarget =
      target?.isContentEditable ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      tagName === 'option';
    if (isEditableTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectNode(node.id);
    }
  };

  const isContainer = node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack';
  const isNodeActive = isSelected;
  const canResizeNode = isFreeMode ? true : !isContainer;
  const supportsInlineTextEdit =
    node.nodeType === 'heading' ||
    node.nodeType === 'text' ||
    node.nodeType === 'paragraph' ||
    node.nodeType === 'button';
  const featureTabsElementsMode =
    node.nodeType === 'tabs' && isFeatureTabsElementPanelMode(node.props);
  const supportsStatsInlineEdit = node.nodeType === 'stats_counter';
  const supportsTabHeroCompoundEdit = node.nodeType === 'tab_hero';
  const supportsFloatingTextToolbar =
    supportsInlineTextEdit ||
    node.nodeType === 'rich_text' ||
    node.nodeType === 'tab_hero' ||
    (node.nodeType === 'tabs' && !featureTabsElementsMode);

  const repeatCfg =
    node?.props?.meta?.cms?.repeat && typeof node.props.meta.cms.repeat === 'object' && !Array.isArray(node.props.meta.cms.repeat)
      ? node.props.meta.cms.repeat
      : null;
  const repeatCollectionSlug = typeof repeatCfg?.collectionSlug === 'string' ? repeatCfg.collectionSlug : '';
  const repeatEnabled = Boolean(repeatCfg);

  // Builder preview: use a single sample item (no structural duplication in canvas).
  const effectiveCmsContext =
    cmsContext && typeof cmsContext === 'object'
      ? cmsContext
      : null;
  const childCmsContext =
    repeatEnabled && repeatCollectionSlug
      ? {
          ...(effectiveCmsContext || {}),
          sys: { ...(effectiveCmsContext?.sys || {}), collection: repeatCollectionSlug },
          // item is injected by BuilderCanvas root after preview fetch; keep through.
        }
      : effectiveCmsContext;
  const sectionEditLocked =
    Array.isArray(tree) &&
    tree.length > 0 &&
    isNodeEditsDisabledBySectionLock(tree, node.id);
  /** Latest tabs props — avoids stale closure when tab content + activeTabId save in quick succession. */
  const nodePropsRef = useRef(node.props);
  nodePropsRef.current = node.props;
  const featureTabSwitchInFlightRef = useRef(null);
  const featureTabsSavedFingerprintRef = useRef(
    node.nodeType === 'tabs' ? featureTabsPropsFingerprint(node.props) : ''
  );
  const featureTabsPersistTimerRef = useRef(null);
  const featureTabsPersistChainRef = useRef(Promise.resolve());
  const featureTabsPendingPropsRef = useRef(null);

  const flushFeatureTabsPersist = useCallback(
    async ({ immediate = false, skipHistorySnapshot = false } = {}) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tabs') return;
      if (featureTabsPersistTimerRef.current) {
        window.clearTimeout(featureTabsPersistTimerRef.current);
        featureTabsPersistTimerRef.current = null;
      }
      const run = async () => {
        const nextProps = nodePropsRef.current;
        if (!nextProps) return;
        featureTabsPendingPropsRef.current = null;
        const fp = featureTabsPropsFingerprint(nextProps);
        if (fp === featureTabsSavedFingerprintRef.current) return;
        await onUpdateNode({
          nodeId: node.id,
          payload: { props: nextProps },
          skipHistorySnapshot,
        });
        featureTabsSavedFingerprintRef.current = fp;
      };
      featureTabsPersistChainRef.current = featureTabsPersistChainRef.current.then(run).catch(() => {});
      if (immediate) await featureTabsPersistChainRef.current;
    },
    [node.id, node.nodeType, onUpdateNode, sectionEditLocked]
  );

  const queueFeatureTabsPersist = useCallback(
    (nextProps, { immediate = false, skipHistorySnapshot = false } = {}) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tabs' || !nextProps) return;
      nodePropsRef.current = nextProps;
      featureTabsPendingPropsRef.current = nextProps;
      if (immediate) {
        void flushFeatureTabsPersist({ immediate: true, skipHistorySnapshot });
        return;
      }
      if (featureTabsPersistTimerRef.current) window.clearTimeout(featureTabsPersistTimerRef.current);
      featureTabsPersistTimerRef.current = window.setTimeout(() => {
        featureTabsPersistTimerRef.current = null;
        void flushFeatureTabsPersist({ skipHistorySnapshot: true });
      }, 800);
    },
    [flushFeatureTabsPersist, node.nodeType, onUpdateNode, sectionEditLocked]
  );

  useEffect(() => {
    if (node.nodeType !== 'tabs') return;
    nodePropsRef.current = node.props;
    featureTabsSavedFingerprintRef.current = featureTabsPropsFingerprint(node.props);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset queue state only when tabs node changes
  }, [node.id]);

  const handleFeatureTabsPatch = useCallback(
    async (tabId, patch, options = {}) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tabs' || !patch) return;
      const { tabs } = resolveFeatureTabsProps(nodePropsRef.current);
      const index = tabs.findIndex((t) => t.id === tabId);
      if (index < 0) return;
      const nextTabs = patchFeatureTabs(tabs, index, patch);
      const nextProps = { ...(nodePropsRef.current || {}), tabs: nextTabs };
      const immediate = Boolean(options.immediate);
      queueFeatureTabsPersist(nextProps, { immediate, skipHistorySnapshot: !immediate });
      if (immediate) await featureTabsPersistChainRef.current;
    },
    [node.nodeType, onUpdateNode, queueFeatureTabsPersist, sectionEditLocked]
  );
  const handleFeatureTabsImageFile = useCallback(
    async (tabId, file) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tabs' || !file?.type?.startsWith?.('image/')) return;
      const { tabs } = resolveFeatureTabsProps(nodePropsRef.current);
      const index = tabs.findIndex((t) => t.id === tabId);
      if (index < 0) return;

      const applyImagePatch = async (patch) => {
        const freshTabs = resolveFeatureTabsProps(nodePropsRef.current).tabs;
        const freshIndex = freshTabs.findIndex((t) => t.id === tabId);
        if (freshIndex < 0) return;
        const nextTabs = patchFeatureTabs(freshTabs, freshIndex, patch);
        const nextProps = { ...(nodePropsRef.current || {}), tabs: nextTabs };
        queueFeatureTabsPersist(nextProps, { immediate: true });
      };

      if (Number(builderProjectId) > 0) {
        try {
          const { uploadFeatureTabPanelImage } = await import('@/lib/featureTabMedia.js');
          const patch = await uploadFeatureTabPanelImage(builderProjectId, file);
          await applyImagePatch(patch);
          return;
        } catch {
          /* fall through to inline preview only when upload unavailable */
        }
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (!src) return;
        await applyImagePatch({
          imageSrc: src,
          image: src,
          imageAlt: String(file.name || '').replace(/\.[^.]+$/, '') || tabs[index]?.label || '',
        });
      };
      reader.readAsDataURL(file);
    },
    [builderProjectId, node.nodeType, onUpdateNode, queueFeatureTabsPersist, sectionEditLocked]
  );
  const featureTabsPatchHandler = node.nodeType === 'tabs' ? handleFeatureTabsPatch : null;
  const featureTabsImageHandler = node.nodeType === 'tabs' ? handleFeatureTabsImageFile : null;
  const handleStatsCounterPatch = useCallback(
    async (index, patch) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'stats_counter' || !patch) return;
      const { items } = resolveStatsCounterProps(node.props);
      const nextItems = patchStatsCounterItemFields(items, index, patch);
      await onUpdateNode({
        nodeId: node.id,
        payload: { props: { ...(node.props || {}), items: nextItems } },
      });
    },
    [node.id, node.nodeType, node.props, onUpdateNode, sectionEditLocked]
  );
  const statsCounterPatchHandler = node.nodeType === 'stats_counter' ? handleStatsCounterPatch : null;
  const handleTabHeroPatch = useCallback(
    async (panelId, patch) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tab_hero' || !patch) return;
      const { panels } = resolveTabHeroProps(node.props);
      const index = panels.findIndex((p) => p.id === panelId);
      if (index < 0) return;
      const nextPanels = patchTabHeroPanel(panels, index, patch);
      await onUpdateNode({
        nodeId: node.id,
        payload: { props: { ...(node.props || {}), panels: nextPanels } },
      });
    },
    [node.id, node.nodeType, node.props, onUpdateNode, sectionEditLocked]
  );
  const handleTabHeroImageFile = useCallback(
    async (panelId, file) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tab_hero' || !file?.type?.startsWith?.('image/')) return;
      const applyImagePatch = async (patch) => {
        const { panels } = resolveTabHeroProps(node.props);
        const index = panels.findIndex((p) => p.id === panelId);
        if (index < 0) return;
        const nextPanels = patchTabHeroPanel(panels, index, patch);
        await onUpdateNode({
          nodeId: node.id,
          payload: { props: { ...(node.props || {}), panels: nextPanels } },
        });
      };
      if (Number(builderProjectId) > 0) {
        try {
          const { uploadFeatureTabPanelImage } = await import('@/lib/featureTabMedia.js');
          const patch = await uploadFeatureTabPanelImage(builderProjectId, file);
          await applyImagePatch(patch);
          return;
        } catch {
          // fall through to data URL preview
        }
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (!src) return;
        await applyImagePatch({
          imageSrc: src,
          image: src,
          imageAlt: String(file.name || '').replace(/\.[^.]+$/, '') || 'Hero background',
        });
      };
      reader.readAsDataURL(file);
    },
    [builderProjectId, node.id, node.nodeType, node.props, onUpdateNode, sectionEditLocked]
  );
  /** Builder tab switch is session-local; live opens first tab until Inspector sets default. */
  const handleTabHeroActiveChange = useCallback(async () => {}, []);
  const tabHeroPatchHandler = node.nodeType === 'tab_hero' ? handleTabHeroPatch : null;
  const tabHeroImageHandler = node.nodeType === 'tab_hero' ? handleTabHeroImageFile : null;
  const tabHeroActiveChangeHandler = node.nodeType === 'tab_hero' ? handleTabHeroActiveChange : null;
  const handleFaqOpenChange = useCallback(
    async (itemId) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'accordion') return;
      const nextId = String(itemId || '').trim();
      if (String(node.props?.openItemId || '') === nextId) return;
      await onUpdateNode({
        nodeId: node.id,               
        payload: {
          props: {        
            openItemId: nextId,
          },
        },
      });
    },
    [node.id, node.nodeType, node.props, onUpdateNode, sectionEditLocked]
  );
  const faqOpenChangeHandler = node.nodeType === 'accordion' ? handleFaqOpenChange : null;
  const handleFaqAccordionPatch = useCallback(
    async (itemId, patch) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'accordion' || !patch) return;
      const { items } = resolveFaqAccordionProps(node.props);
      const index = items.findIndex((it) => it.id === itemId);
      if (index < 0) return;
      const next = patchFaqItems(items, index, patch);
      await onUpdateNode({
        nodeId: node.id,
        payload: {
          props: {
            ...(node.props || {}),
            items: next,
          },
        },
      });
    },
    [node.id, node.nodeType, node.props, onUpdateNode, sectionEditLocked]
  );
  const faqAccordionPatchHandler = node.nodeType === 'accordion' ? handleFaqAccordionPatch : null;
  const handleFaqAccordionAddItem = useCallback(async () => {
    if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'accordion') return;
    const { items } = resolveFaqAccordionProps(node.props);
    const next = appendFaqItem(items);
    const newItem = next[next.length - 1];
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          items: next,
          openItemId: newItem?.id || '',
        },
      },
    });
  }, [node.id, node.nodeType, node.props, onUpdateNode, sectionEditLocked]);
  const faqAccordionAddItemHandler = node.nodeType === 'accordion' ? handleFaqAccordionAddItem : null;
  const handleSplitHeroSlidePatch = useCallback(
    async (slideId, patch) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'carousel' || !patch) return;
      if (!isSplitHeroCarouselNode(node)) return;
      const slides = Array.isArray(node.props?.slides) ? node.props.slides : [];
      const index = slides.findIndex((s) => String(s?.id) === String(slideId));
      if (index < 0) return;
      const current = slides[index] || {};
      const merged = { ...current, ...patch };
      if (patch.cta && typeof patch.cta === 'object') {
        merged.cta = { ...(current.cta || {}), ...patch.cta };
      }
      const next = slides.map((s, i) => (i === index ? merged : s));
      await onUpdateNode({
        nodeId: node.id,
        payload: {
          props: {
            ...(node.props || {}),
            slides: next,
          },
        },
      });
    },
    [node, onUpdateNode, sectionEditLocked]
  );
  const handleSplitHeroSlideImageFile = useCallback(
    async (slideId, file) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'carousel' || !file?.type?.startsWith?.('image/')) return;
      if (!isSplitHeroCarouselNode(node)) return;
      const slides = Array.isArray(node.props?.slides) ? node.props.slides : [];
      const index = slides.findIndex((s) => String(s?.id) === String(slideId));
      if (index < 0) return;

      const applySlidePatch = async (patch) => {
        const freshSlides = Array.isArray(nodePropsRef.current?.slides) ? nodePropsRef.current.slides : slides;
        const freshIndex = freshSlides.findIndex((s) => String(s?.id) === String(slideId));
        if (freshIndex < 0) return;
        const current = freshSlides[freshIndex] || {};
        const next = freshSlides.map((s, i) => (i === freshIndex ? { ...current, ...patch } : s));
        await onUpdateNode({
          nodeId: node.id,
          payload: {
            props: {
              ...(nodePropsRef.current || node.props || {}),
              slides: next,
            },
          },
        });
      };

      if (Number(builderProjectId) > 0) {
        try {
          const { uploadCarouselSlideImage } = await import('@/lib/featureTabMedia.js');
          const patch = await uploadCarouselSlideImage(builderProjectId, file, { folder: 'split-hero' });
          await applySlidePatch(patch);
          return;
        } catch {
          /* fall through to inline preview when upload unavailable */
        }
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (!src) return;
        await applySlidePatch({
          imageSrc: src,
          image: src,
          imageAlt: String(file.name || '').replace(/\.[^.]+$/, '') || slides[index]?.title || '',
        });
      };
      reader.readAsDataURL(file);
    },
    [builderProjectId, node, onUpdateNode, sectionEditLocked]
  );
  const splitHeroSlidePatchHandler = isSplitHeroCarouselNode(node) ? handleSplitHeroSlidePatch : null;
  const splitHeroSlideImageHandler = isSplitHeroCarouselNode(node) ? handleSplitHeroSlideImageFile : null;
  const headingTag = normalizeHeadingTag(node.props?.tag);
  const wpToolbarHeadingId = useId();
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isRichTextEditing, setIsRichTextEditing] = useState(false);
  const [isFeatureTabFieldEditing, setIsFeatureTabFieldEditing] = useState(false);
  const [textEditToolbarOpen, setTextEditToolbarOpen] = useState(false);
  const [toolbarFontSizeLive, setToolbarFontSizeLive] = useState(null);
  const showFloatingTextToolbar = textEditToolbarOpen && isSelected && !sectionEditLocked;
  const dragLocked = isInlineEditing || isRichTextEditing || sectionEditLocked;
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `node-${node.id}`,
    data: { nodeId: node.id, nodeType: node.nodeType },
    disabled: dragLocked,
  });
  const usesLiveNodeClass =
    isContainer ||
    node.nodeType === 'menu' ||
    node.nodeType === 'rich_text' ||
    node.nodeType === 'divider' ||
    node.nodeType === 'carousel';
  const isDividerLeaf = node.nodeType === 'divider';
  const shellCarriesLeafLayout = isContainer || isDividerLeaf;
  const compoundFullWidthShell =
    !shellCarriesLeafLayout &&
    (node.nodeType === 'stats_counter' ||
      node.nodeType === 'tab_hero' ||
      node.nodeType === 'tabs' ||
      node.nodeType === 'accordion');
  const selKind =
    isSelected && node.nodeType === 'row'
      ? 'bld-sel-section'
      : isSelected && node.nodeType === 'column'
        ? 'bld-sel-column'
        : isSelected && node.nodeType === 'stack'
          ? 'bld-sel-stack'
          : isSelected
            ? 'bld-sel-widget'
            : '';
  const headerBarClasses = headerBarClassesForNode(node, {
    device,
    insideSiteHeaderRow,
    headerLayout:
      node.props?.meta?.headerLayout ||
      (isSiteHeaderRowForCompact(node) ? resolveHeaderLayoutMode(node.props?.meta || {}) : ''),
  });
  const rowHeaderBehavior =
    node.nodeType === 'row' ? resolveHeaderBehaviorFromMeta(node.props?.meta || {}) : null;
  const rowHeaderRevealExtras =
    node.nodeType === 'row' && rowHeaderBehavior
      ? headerBehaviorRenderExtras(rowHeaderBehavior)
      : { style: {}, attrs: {} };
  const headerBehaviorClass =
    rowHeaderBehavior ? headerBehaviorCssClasses(rowHeaderBehavior) : '';
  const [inlineDraftText, setInlineDraftText] = useState('');
  const [inlinePanelText, setInlinePanelText] = useState('');
  const [inlinePanelImageSrc, setInlinePanelImageSrc] = useState('');
  const [inlinePanelImageAlt, setInlinePanelImageAlt] = useState('');
  const [inlinePanelMenuItems, setInlinePanelMenuItems] = useState('');
  const [inlinePanelError, setInlinePanelError] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const isCommittingInlineEditRef = useRef(false);
  const [interactionPreviewStyle, setInteractionPreviewStyle] = useState(null);
  const [dragAssist, setDragAssist] = useState(null);
  const [overflowLocal, setOverflowLocal] = useState(null);
  const [imageToolbarFixedPos, setImageToolbarFixedPos] = useState(null);
  const imageToolbarRef = useRef(null);
  const nodeElementRef = useRef(null);
  const inlineEditWrapRef = useRef(null);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState(null);
  const [fallbackToolbarPos, setFallbackToolbarPos] = useState(null);
  const floatingToolbarRef = useRef(null);
  const floatingToolbarPosRef = useRef(null);
  const floatingToolbarFreezeRef = useRef(false);
  const floatingToolbarFreezeTimerRef = useRef(null);
  const toolbarColorPickerOpenRef = useRef(false);
  const wasSelectedRef = useRef(isSelected);
  const { siteTheme, themeTokens, stylePresets, animationPresets } = useBuilderTheme();
  const alignedContentTokens = useMemo(
    () => alignThemeTokensWithSiteTheme(normalizeSiteTheme(siteTheme), themeTokens),
    [siteTheme, themeTokens]
  );
  const ancestorSectionTone = useMemo(
    () =>
      tree?.length && node?.id
        ? resolveSectionToneForNode(tree, node.id, device, siteTheme, alignedContentTokens)
        : null,
    [tree, node?.id, device, siteTheme, alignedContentTokens]
  );
  const darkContentMode = isSiteContentDarkMode(siteTheme, alignedContentTokens);
  const neutralizeBodyColors = shouldNeutralizeHardcodedBodyTextColors({
    darkContentMode,
    sectionTone: ancestorSectionTone,
  });
  const neutralizeBodyColorsPreview = neutralizeBodyColors;
  const neutralizeBodyColorsPersist = neutralizeBodyColors;

  const commitActiveFeatureTabPanelFromDom = useCallback(async () => {
    if (sectionEditLocked || node.nodeType !== 'tabs' || !featureTabsPatchHandler) return;
    const shell = nodeElementRef.current;
    if (!shell) return;
    const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
    const built = buildFeatureTabPanelPatchFromDom(shell, nodePropsRef.current, sanitizeOpts);
    if (!built) return;
    await featureTabsPatchHandler(built.tabId, built.patch, { immediate: true });
  }, [
    sectionEditLocked,
    node.nodeType,
    featureTabsPatchHandler,
    neutralizeBodyColorsPersist,
  ]);

  const handleTabsActiveChangeWithCommit = useCallback(
    async (_tabId) => {
      if (sectionEditLocked || !onUpdateNode || node.nodeType !== 'tabs') return;
      if (featureTabSwitchInFlightRef.current) {
        await featureTabSwitchInFlightRef.current;
      }
      let release = () => {};
      featureTabSwitchInFlightRef.current = new Promise((resolve) => {
        release = resolve;
      });
      try {
        const shell = nodeElementRef.current;
        const baseProps = nodePropsRef.current || {};
        const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
        const built = buildFeatureTabPanelPatchFromDom(shell, baseProps, sanitizeOpts);
        if (!built?.tabId || !built.patch) return;
        const { tabs } = resolveFeatureTabsProps(baseProps);
        const idx = tabs.findIndex((t) => t.id === built.tabId);
        if (idx < 0) return;
        const nextTabs = patchFeatureTabs(tabs, idx, built.patch);
        const nextProps = { ...baseProps, tabs: nextTabs };
        queueFeatureTabsPersist(nextProps, { immediate: true });
        await featureTabsPersistChainRef.current;
      } finally {
        release();
        featureTabSwitchInFlightRef.current = null;
      }
    },
    [
      sectionEditLocked,
      node.nodeType,
      onUpdateNode,
      neutralizeBodyColorsPersist,
      queueFeatureTabsPersist,
    ]
  );

  const tabsActiveChangeHandler =
    node.nodeType === 'tabs' ? handleTabsActiveChangeWithCommit : null;

  const rawDevice = getDeviceStyle(node.style_json, device);
  const surfaceReady = neutralizeLightSurfaceDeviceStyle(rawDevice, siteTheme, alignedContentTokens, node);
  const themed = mergeNodeStyleWithSiteTheme(surfaceReady, siteTheme, node.nodeType, { treeNode: node });
  const gapReady = withResolvedLayoutGap(themed, siteTheme);
  const nodeMetaForLayout =
    node.props?.meta && typeof node.props.meta === 'object' ? node.props.meta : {};
  const rowMetaForLayout = node.nodeType === 'row' ? nodeMetaForLayout : {};
  const sectionTemplateIdForLayout =
    (node.nodeType === 'row' && rowMetaForLayout.sectionTemplate && String(rowMetaForLayout.sectionTemplate)) ||
    sectionTemplateId ||
    '';
  const isSectionItemsHost = node.nodeType === 'stack' && nodeIsSectionItemsHost(node);
  const layoutConfigSource =
    isSectionItemsHost
      ? sectionLayout
      : node.nodeType === 'row' && rowMetaForLayout.sectionTemplate
        ? rowMetaForLayout.sectionLayout
        : sectionLayout;
  const activeSectionLayout =
    layoutConfigSource != null || sectionTemplateIdForLayout
      ? normalizeSectionLayout(layoutConfigSource, sectionTemplateIdForLayout)
      : null;
  const shouldApplySectionLayout =
    activeSectionLayout &&
    (isSectionItemsHost || (node.nodeType === 'row' && nodeMetaForLayout.sectionColumnLayout));
  let layoutReady = gapReady;
  if (shouldApplySectionLayout) {
    layoutReady = applySectionLayoutToDeviceStyle(gapReady, activeSectionLayout, device);
  }
  const isSectionColumnRow = node.nodeType === 'row' && Boolean(nodeMetaForLayout.sectionColumnLayout);
  const layoutForChrome =
    activeSectionLayout && (isSectionItemsHost || isSectionColumnRow) ? activeSectionLayout : null;
  const sectionLayoutClass = layoutForChrome ? getSectionLayoutClasses(layoutForChrome) : '';
  const sectionLayoutAttr = isSectionItemsHost && layoutForChrome ? sectionLayoutDataAttrs(layoutForChrome) : {};
  const sectionColumnAttrs =
    isSectionColumnRow && layoutForChrome
      ? {
          'data-bld-section-columns': 'true',
          'data-bld-layout-direction': layoutForChrome.direction,
          'data-bld-layout-mobile-stack': layoutForChrome.mobileStack ? 'true' : 'false',
        }
      : {};
  const childSectionLayout =
    node.nodeType === 'row' && rowMetaForLayout.sectionTemplate
      ? normalizeSectionLayout(rowMetaForLayout.sectionLayout, rowMetaForLayout.sectionTemplate)
      : sectionLayout;
  const childSectionTemplateId =
    node.nodeType === 'row' && rowMetaForLayout.sectionTemplate
      ? String(rowMetaForLayout.sectionTemplate)
      : sectionTemplateId;
  const classNames = [
    ...(usesLiveNodeClass ? ['live-node'] : []),
    node.nodeType === 'row'
      ? 'bld-row'
      : node.nodeType === 'column'
        ? 'bld-column'
        : node.nodeType === 'stack'
          ? 'bld-stack'
          : 'bld-block',
    sectionLayoutClass,
    liveResponsiveLayoutClasses(node.style_json),
    headerBarClasses,
    headerBehaviorClass,
    selKind,
    isSelected ? 'is-selected' : '',
    isDragging ? 'is-dragging' : '',
    flashPasteNodeId === node.id ? 'bld-node--paste-flash' : '',
    flashReorderNodeId === node.id ? 'bld-node--reorder-flash' : '',
    deletingNodeId === node.id ? 'bld-node--deleting' : '',
    isInlineEditing ||
    isRichTextEditing ||
    ((node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') &&
      isFeatureTabFieldEditing)
      ? 'bld-node--editing-focus'
      : '',
    sectionEditLocked ? 'bld-node--section-locked' : '',
    node.nodeType === 'image' ? 'bld-block--image' : '',
    node.nodeType === 'image' && nodeLooksLikeBrandLogo(node) ? 'bld-block--brand-logo' : '',
    node.nodeType === 'carousel' ? 'bld-block--carousel' : '',
    node.nodeType === 'stats_counter' ? 'bld-block--stats-counter' : '',
    node.nodeType === 'tab_hero' ? 'bld-block--tab-hero' : '',
    isSplitHeroCarouselNode(node) ? 'bld-block--split-hero-carousel' : '',
    isDividerLeaf ? 'live-divider bld-divider-shell' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  let deviceStyle = finalizeLeafDeviceStyle(
    node,
    device,
    mergeDeviceStyleWithTypeDefaults(
      node.nodeType,
      node.nodeType === 'menu'
        ? mergeMenuDeviceStyle(
            node.props?.orientation === 'column' ? 'column' : 'row',
            layoutReady,
            { align: node.props?.align },
            siteTheme
          )
        : layoutReady,
      { treeNode: node }
    )
  );
  const siteHeaderRow = isSiteHeaderRowForCompact(node);
  const compactHeaderBar =
    (device === 'mobile' || device === 'tablet') && (siteHeaderRow || insideSiteHeaderRow);
  deviceStyle = applyCompactHeaderDeviceStyle(node, device, deviceStyle, insideSiteHeaderRow);
  if (insideSectionItemsHost && parentSectionLayout && node.nodeType === 'stack') {
    deviceStyle = applySectionItemsChildToDeviceStyle(deviceStyle, parentSectionLayout, device);
  }
  const childInsideSiteHeaderRow = insideSiteHeaderRow || siteHeaderRow;
  const childInsideSectionItemsHost = isSectionItemsHost;
  const childParentSectionLayout = layoutForChrome || activeSectionLayout || parentSectionLayout;
  const externalPreviewRawEarly = previewCssByNodeId?.[node.id] || null;
  const previewIx = previewIxByNodeId?.[node.id];
  const deviceStyleWithPreviewIx = previewIx
    ? { ...deviceStyle, interactions: previewIx }
    : deviceStyle;
  const deviceStyleForIx = deviceStyleForInteractionPreview(
    deviceStyleWithPreviewIx,
    externalPreviewRawEarly,
    animationPresets
  );
  const imageAlignAxes = readImageAlignAxes(node.props || {});
  const imageParentFlexDirection = useMemo(() => {
    if (node.nodeType !== 'image' || !Array.isArray(tree) || !tree.length) return 'column';
    return getImageParentFlexDirection(tree, node.id, device, siteTheme);
  }, [node.nodeType, node.id, tree, device, siteTheme]);
  let nodeCss =
    styleToCss(deviceStyle, siteTheme, {
      nodeType: node.nodeType,
      animationPresets,
      darkContentMode,
      sectionTone: ancestorSectionTone,
    }) || undefined;
  if (compactHeaderBar && siteHeaderRow) {
    nodeCss = {
      ...(nodeCss || {}),
      display: 'grid',
      gridTemplateColumns: 'minmax(0, max-content) auto',
      gridTemplateRows: 'auto',
      alignItems: 'center',
      columnGap: '10px',
      width: '100%',
      flexDirection: undefined,
      flexWrap: undefined,
      justifyContent: undefined,
    };
  }
  if (compactHeaderBar && insideSiteHeaderRow && node.nodeType === 'column' && headerColumnHasMultipleStacks(node)) {
    nodeCss = {
      ...(nodeCss || {}),
      display: 'grid',
      gridTemplateColumns: 'minmax(0, max-content) auto',
      gridTemplateRows: 'auto',
      alignItems: 'center',
      columnGap: '10px',
      width: '100%',
    };
  }
  if (compactHeaderBar && insideSiteHeaderRow && node.nodeType === 'column') {
    if (nodeSubtreeHasType(node, 'menu')) {
      nodeCss = {
        ...(nodeCss || {}),
        display: 'flex',
        gridColumn: '2',
        gridRow: '1',
        justifySelf: 'end',
        alignSelf: 'center',
        marginLeft: 0,
        marginRight: 0,
        width: 'auto',
        maxWidth: 'none',
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        flex: undefined,
        justifyContent: 'flex-end',
        alignItems: 'center',
      };
    } else if (
      nodeSubtreeHasType(node, 'image') ||
      String(node.displayName || '')
        .toLowerCase()
        .includes('logo')
    ) {
      nodeCss = {
        ...(nodeCss || {}),
        gridColumn: '1',
        gridRow: '1',
        justifySelf: 'start',
        alignSelf: 'center',
        width: 'auto',
        maxWidth: 'min(56vw, 200px)',
        flexGrow: 0,
        flex: undefined,
      };
    }
  }
  if (compactHeaderBar && insideSiteHeaderRow && node.nodeType === 'stack') {
    if (nodeSubtreeHasType(node, 'menu')) {
      nodeCss = {
        ...(nodeCss || {}),
        display: 'flex',
        gridColumn: '2',
        gridRow: '1',
        justifySelf: 'end',
        alignSelf: 'center',
        marginLeft: 0,
        width: 'auto',
        justifyContent: 'flex-end',
        alignItems: 'center',
      };
    } else if (
      nodeSubtreeHasType(node, 'image') ||
      String(node.displayName || '')
        .toLowerCase()
        .includes('logo')
    ) {
      nodeCss = {
        ...(nodeCss || {}),
        gridColumn: '1',
        gridRow: '1',
        justifySelf: 'start',
        alignSelf: 'center',
        width: 'auto',
        maxWidth: 'min(56vw, 200px)',
      };
    }
  }
  if (compactHeaderBar && node.nodeType === 'menu') {
    nodeCss = {
      ...(nodeCss || {}),
      marginLeft: 'auto',
      width: 'auto',
      justifyContent: 'flex-end',
      alignSelf: 'center',
    };
  }
  if (
    device === 'desktop' &&
    insideSiteHeaderRow &&
    (isHeaderActionsStackNode(node) || isHeaderActionsColumnNode(node))
  ) {
    nodeCss = ensureHeaderActionsVisibleCss(nodeCss);
  }
  if (
    node.nodeType === 'heading' ||
    node.nodeType === 'text' ||
    node.nodeType === 'paragraph' ||
    node.nodeType === 'rich_text'
  ) {
    nodeCss = neutralizeLeafTextCssObject(nodeCss || {}, {
      darkContentMode,
      sectionTone: ancestorSectionTone,
    });
    nodeCss = applySectionToneToLeafCss(nodeCss, ancestorSectionTone, {
      nodeType: node.nodeType,
      darkContentMode,
    });
  }
  /** Match liveRenderer: any direct `.live-doc` child row gets spacing vars (not only when semantic tag resolves). */
  const isRootLiveDocRow = node.nodeType === 'row' && Array.isArray(tree) && isRootPageRow(tree, node);
  if (isRootLiveDocRow && isHeaderRowNode(node)) {
    nodeCss = sanitizeHeaderRowCss(nodeCss || {}, node.props?.meta || {});
  }
  const rootRowSpacingVars =
    isRootLiveDocRow && node?.props?.meta ? liveDocRootRowSpacingVars(node.props.meta) : null;
  const nodeCssWithRootSpacing =
    rootRowSpacingVars && Object.keys(rootRowSpacingVars).length ? { ...(nodeCss || {}), ...rootRowSpacingVars } : nodeCss;
  const liveRootGapAfterAttrs =
    isRootLiveDocRow &&
    rootRowSpacingVars &&
    Object.prototype.hasOwnProperty.call(rootRowSpacingVars, '--live-row-gap-after')
      ? { 'data-live-root-gap-after': 'true' }
      : {};
  const liveRootGapBeforeAttrs =
    isRootLiveDocRow &&
    rootRowSpacingVars &&
    Object.prototype.hasOwnProperty.call(rootRowSpacingVars, '--live-row-gap-before')
      ? { 'data-live-root-gap-before': 'true' }
      : {};
  const rowMetaForStrip =
    node.props?.meta && typeof node.props.meta === 'object' && !Array.isArray(node.props.meta) ? node.props.meta : {};
  const stripRowIsHeader = isHeaderRowNode(node);
  const stripRowIsFooter = isFooterRowNode(node);
  const isRootContentRow =
    isRootLiveDocRow &&
    node.nodeType === 'row' &&
    !stripRowIsHeader &&
    !stripRowIsFooter &&
    (rowSemanticTag === 'section' || rowSemanticTag === 'main');
  const sectionWidthCtx = {
    isLiveDocRootRow: isRootLiveDocRow,
    isHeaderRow: stripRowIsHeader,
    isFooterRow: stripRowIsFooter,
    isRootContentRow,
  };
  const stripAttrs =
    node.nodeType === 'row' ? rowSectionStripDataAttrs(isRootLiveDocRow, rowMetaForStrip, sectionWidthCtx) : {};
  const landmarkContentAttrs =
    node.nodeType === 'row' ? landmarkContentDataAttrs(rowMetaForStrip, sectionWidthCtx) : {};
  const sectionContentAttrs =
    node.nodeType === 'row' ? sectionContentDataAttrs(rowMetaForStrip, sectionWidthCtx) : {};
  const landmarkContentMode =
    isRootLiveDocRow && (stripRowIsHeader || stripRowIsFooter)
      ? resolveLandmarkContentWidth(rowMetaForStrip, {
          isHeaderRow: stripRowIsHeader,
          isFooterRow: stripRowIsFooter,
        })
      : '';
  const nodeCssWithLandmarkContent =
    landmarkContentMode === 'boxed'
      ? {
          ...(nodeCssWithRootSpacing || {}),
          '--live-header-content-max-width': `${resolveLandmarkContentMaxWidthPx(rowMetaForStrip, deviceStyle?.layout?.maxWidth)}px`,
        }
      : nodeCssWithRootSpacing;
  const sectionContentMode =
    node.nodeType === 'row' ? resolveSectionContentWidth(rowMetaForStrip, sectionWidthCtx) : '';
  let nodeCssWithSectionContent =
    sectionContentMode === 'boxed'
      ? {
          ...(nodeCssWithLandmarkContent || {}),
          '--live-section-content-max-width': `${resolveSectionContentMaxWidthPx(rowMetaForStrip, deviceStyle?.layout?.maxWidth)}px`,
        }
      : nodeCssWithLandmarkContent;
  const parentRowForCol = node.nodeType === 'column' ? findParentRowForNode(tree, node.id) : null;
  const rowChildColumnIndex =
    parentRowForCol?.children?.findIndex((c) => String(c?.id) === String(node.id)) ?? -1;
  const templateContrast = applyTemplateSectionContrast(node, nodeCssWithSectionContent || nodeCss, {
    tree,
    device,
    siteTheme,
    sectionTemplateId:
      node.props?.meta?.sectionTemplate ||
      sectionTemplateDataAttrsForRow(parentRowForCol)['data-section-template'] ||
      undefined,
    rowChildColumnIndex: rowChildColumnIndex >= 0 ? rowChildColumnIndex : undefined,
  });
  nodeCssWithSectionContent = templateContrast.css;
  const rowPaddingDefinedAttrs =
    isRootLiveDocRow &&
    (rowSemanticTag === 'section' || rowSemanticTag === 'main') &&
    rowHasSpacingPadding(deviceStyle)
      ? { 'data-live-row-padding-defined': 'true' }
      : {};
  let nodeCssLiveLayout = nodeCssWithSectionContent;
  if (nodeCssLiveLayout) {
    nodeCssLiveLayout = sanitizeLiveFlowPositionCss(nodeCssLiveLayout);
    if (isRootContentRow) {
      nodeCssLiveLayout = sanitizeLiveRootContentRowCss(nodeCssLiveLayout);
    }
    nodeCssLiveLayout = sanitizeInlineMarginCss(nodeCssLiveLayout);
    /* Shadow reserve margin only on published live — avoids a large empty gap under images in the canvas. */
  }
  const externalPreviewRaw = previewCssByNodeId?.[node.id] || null;
  const externalPreview =
    device === 'desktop' &&
    insideSiteHeaderRow &&
    (isHeaderActionsStackNode(node) || isHeaderActionsColumnNode(node)) &&
    externalPreviewRaw
      ? ensureHeaderActionsVisibleCss(externalPreviewRaw)
      : externalPreviewRaw;
  const inlineStyle = sanitizeInlineMarginCss(
    interactionPreviewStyle || externalPreview || nodeCssLiveLayout || undefined
  );
  const rowInlineStyle =
    node.nodeType === 'row' &&
    rowHeaderRevealExtras.style &&
    Object.keys(rowHeaderRevealExtras.style).length
      ? sanitizeInlineMarginCss({ ...inlineStyle, ...rowHeaderRevealExtras.style })
      : inlineStyle;
  const leafInteractionShell = !shellCarriesLeafLayout
    ? resolveLeafInteractionShell({
        deviceStyle: deviceStyleForIx,
        previewCss: externalPreview,
        animationPresets,
      })
    : { ixStyle: null, ixClass: '' };
  const leafWidgetShellStyle = (() => {
    if (shellCarriesLeafLayout) return inlineStyle;
    const ixStyle = leafInteractionShell.ixStyle || {};
    if (!compoundFullWidthShell) {
      return Object.keys(ixStyle).length ? ixStyle : undefined;
    }
    return sanitizeInlineMarginCss({
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
      minWidth: 0,
      boxSizing: 'border-box',
      ...ixStyle,
    });
  })();
  const isImageLeaf = node.nodeType === 'image';
  const imageCssSplit = isImageLeaf ? splitImageNodeCss(inlineStyle) : null;
  const imageShellAlignLive = resolveImageShellAlignFromProps(node.props || {}, imageParentFlexDirection);
  const hasImageAlign =
    imageAlignAxes.horizontal || imageAlignAxes.vertical || node.props?.imageBlockAlign;
  const imageShellStyle = (() => {
    if (!isImageLeaf || (!imageCssSplit?.shell && !hasImageAlign)) return undefined;
    return sanitizeInlineMarginCss({ ...(imageCssSplit?.shell || {}), ...imageShellAlignLive });
  })();
  const imageFigureStyle = imageCssSplit?.figure;
  const isRow = node.nodeType === 'row';
  const ancestorRowForBuilderAttrs = isRow ? node : findParentRowForNode(tree, node.id);
  const builderSectionTemplateAttrs = ancestorRowForBuilderAttrs
    ? sectionTemplateDataAttrsForRow(ancestorRowForBuilderAttrs)
    : {};
  const tplRoleAttrs =
    node.props?.meta?.tplRole != null && String(node.props.meta.tplRole).trim()
      ? { 'data-tpl-role': String(node.props.meta.tplRole).trim() }
      : {};
  let sectionToneAttrs =
    node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack'
      ? {
          ...sectionToneDataAttrForCss(nodeCssWithSectionContent || nodeCss),
          ...templateContrast.toneAttrs,
        }
      : {};
  const linkedMeta = isRow ? getGlobalLinkMeta(node) : null;
  const isLinkedGlobal = Boolean(linkedMeta);
  const isRowEmpty = isRow && !node.children?.length;
  const isDirectionalContainer = node.nodeType === 'column' || node.nodeType === 'stack';
  const supportsDirectManipulation = true;

  const addGridToRow = async (event, columnCount) => {
    event.preventDefault();
    event.stopPropagation();
    if (sectionEditLocked) return;
    if (node.nodeType !== 'row') return;
    onSelectNode(node.id);
    for (let i = 0; i < columnCount; i += 1) {
      if (onQuickAddNode) {
        // Quick add auto-resolves hierarchy in shell.
        // For row+column this adds direct columns.
        // eslint-disable-next-line no-await-in-loop
        await onQuickAddNode({ targetNodeId: node.id, nodeType: 'column' });
      } else {
        // eslint-disable-next-line no-await-in-loop
        await onCreateNode?.({ nodeType: 'column', parentNodeId: node.id });
      }
    }
  };

  const commitStylePatch = async (patch) => {
    if (sectionEditLocked) return;
    if (!onUpdateNode || !patch) return;
    const next = applyDeviceStylePatch(
      node.style_json,
      device,
      withFlexWidthOverride(node.nodeType, patch),
      node.nodeType,
      siteTheme
    );
    await onUpdateNode({
      nodeId: node.id,
      payload: { style_json: next.style_json },
    });
  };

  const commitStylePatchAllDevices = async (patch) => {
    if (sectionEditLocked) return;
    if (!onUpdateNode || !patch) return;
    const devices = ['desktop', 'tablet', 'mobile'];
    let nextStyleJson = node.style_json;
    for (const d of devices) {
      const next = applyDeviceStylePatch(
        nextStyleJson,
        d,
        withFlexWidthOverride(node.nodeType, patch),
        node.nodeType,
        siteTheme
      );
      nextStyleJson = next.style_json;
    }
    await onUpdateNode({
      nodeId: node.id,
      payload: { style_json: nextStyleJson },
    });
  };

  const startResizeWithMouse = (event) => {
    if (!isFreeMode) return;
    if (sectionEditLocked) return;
    if (!supportsDirectManipulation || isSavingNode || isDragging || Boolean(draggingNodeType)) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectNode(node.id);
    const element = nodeElementRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    const handleMove = (moveEvent) => {
      const nextWidth = Math.max(80, Math.round(startWidth + (moveEvent.clientX - startX)));
      const nextHeight = Math.max(40, Math.round(startHeight + (moveEvent.clientY - startY)));
      const resizeLayoutPatch = node.nodeType !== 'row' ? { alignSelf: 'flex-start' } : {};
      const next = applyDeviceStylePatch(
        node.style_json,
        device,
        withFlexWidthOverride(node.nodeType, {
          layout: resizeLayoutPatch,
          size: {
            width: `${nextWidth}px`,
            height: `${nextHeight}px`,
          },
        }),
        node.nodeType,
        siteTheme
      );
      setInteractionPreviewStyle(next.previewCss);
    };

    const handleUp = async (upEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      const nextWidth = Math.max(80, Math.round(startWidth + (upEvent.clientX - startX)));
      const nextHeight = Math.max(40, Math.round(startHeight + (upEvent.clientY - startY)));
      const resizeLayoutPatch = node.nodeType !== 'row' ? { alignSelf: 'flex-start' } : {};
      setInteractionPreviewStyle(null);
      await commitStylePatch({
        layout: resizeLayoutPatch,
        size: {
          width: `${nextWidth}px`,
          height: `${nextHeight}px`,
        },
      });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const adjustNodeSize = async ({ widthDelta = 0, heightDelta = 0 }) => {
    const element = nodeElementRef.current;
    const rect = element?.getBoundingClientRect?.();
    const widthFromStyle = parseFloat(String(deviceStyle?.size?.width || '').replace('px', ''));
    const heightFromStyle = parseFloat(String(deviceStyle?.size?.height || '').replace('px', ''));
    const baseWidth = Number.isFinite(widthFromStyle) ? widthFromStyle : Math.round(rect?.width || 240);
    const baseHeight = Number.isFinite(heightFromStyle) ? heightFromStyle : Math.round(rect?.height || 120);
    const nextWidth = Math.max(80, Math.round(baseWidth + widthDelta));
    const nextHeight = Math.max(40, Math.round(baseHeight + heightDelta));
    const sizePatch = {};
    if (widthDelta) sizePatch.width = `${nextWidth}px`;
    if (heightDelta) sizePatch.height = `${nextHeight}px`;
    if (!Object.keys(sizePatch).length) return;
    await commitStylePatch({
      layout: node.nodeType !== 'row' ? { alignSelf: 'flex-start' } : {},
      size: sizePatch,
    });
  };

  const startMoveWithMouse = (event) => {
    if (sectionEditLocked) return;
    if (!supportsDirectManipulation || isSavingNode || isDragging || Boolean(draggingNodeType)) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectNode(node.id);
    onFreeMoveBrush?.(true);
    const normalized = normalizeResponsiveStyle(node.style_json || {}, { nodeType: node.nodeType, siteTheme });
    const currentStyle = getDeviceStyle(normalized, device) || {};
    const startLeft = parseFloat(currentStyle.layout?.left || '0') || 0;
    const startTop = parseFloat(currentStyle.layout?.top || '0') || 0;
    const startX = event.clientX;
    const startY = event.clientY;
    // Shrinking layout containers (stack/column) to fit-content makes the builder confusing
    // (child widgets like Carousel look "tiny" vs live). Only shrink true content blocks.
    const shouldShrinkToContent = node.nodeType === 'image' || node.nodeType === 'button';
    const element = nodeElementRef.current;
    const parentRect = element?.offsetParent?.getBoundingClientRect?.() || element?.parentElement?.getBoundingClientRect?.();
    const rect = element?.getBoundingClientRect?.();
    const elementWidth = Math.round(rect?.width || 0);
    const elementHeight = Math.round(rect?.height || 0);
    const snapThreshold = 8;
    const clampToParent = (leftPx, topPx) => {
      if (!parentRect || elementWidth <= 0 || elementHeight <= 0) {
        return { left: leftPx, top: topPx };
      }
      const maxLeft = Math.max(0, Math.round(parentRect.width - elementWidth));
      const maxTop = Math.max(0, Math.round(parentRect.height - elementHeight));
      return {
        left: Math.max(0, Math.min(maxLeft, leftPx)),
        top: Math.max(0, Math.min(maxTop, topPx)),
      };
    };

    const handleMove = (moveEvent) => {
      const rawLeft = Math.round(startLeft + (moveEvent.clientX - startX));
      const rawTop = Math.round(startTop + (moveEvent.clientY - startY));
      const bounded = clampToParent(rawLeft, rawTop);
      let nextLeft = bounded.left;
      let nextTop = bounded.top;
      let guideX = null;
      let guideY = null;
      if (parentRect && elementWidth > 0 && elementHeight > 0) {
        const maxLeft = Math.max(0, Math.round(parentRect.width - elementWidth));
        const maxTop = Math.max(0, Math.round(parentRect.height - elementHeight));
        const centerX = Math.round((parentRect.width - elementWidth) / 2);
        const centerY = Math.round((parentRect.height - elementHeight) / 2);
        const snapXTargets = [
          { value: 0, key: 'left' },
          { value: centerX, key: 'center-x' },
          { value: maxLeft, key: 'right' },
        ];
        const snapYTargets = [
          { value: 0, key: 'top' },
          { value: centerY, key: 'center-y' },
          { value: maxTop, key: 'bottom' },
        ];
        for (const target of snapXTargets) {
          if (Math.abs(nextLeft - target.value) <= snapThreshold) {
            nextLeft = target.value;
            guideX = target.key;
            break;
          }
        }
        for (const target of snapYTargets) {
          if (Math.abs(nextTop - target.value) <= snapThreshold) {
            nextTop = target.value;
            guideY = target.key;
            break;
          }
        }
        const spacing = {
          left: nextLeft,
          right: Math.max(0, maxLeft - nextLeft),
          top: nextTop,
          bottom: Math.max(0, maxTop - nextTop),
        };
        const isSnap = Boolean(guideX || guideY);
        const prScreen = element.offsetParent?.getBoundingClientRect?.();
        let vline = null;
        let hline = null;
        if (isSnap && prScreen && elementWidth > 0 && elementHeight > 0) {
          if (guideX === 'left') vline = prScreen.left;
          else if (guideX === 'center-x') vline = prScreen.left + prScreen.width / 2;
          else if (guideX === 'right') vline = prScreen.right;
          if (guideY === 'top') hline = prScreen.top;
          else if (guideY === 'center-y') hline = prScreen.top + prScreen.height / 2;
          else if (guideY === 'bottom') hline = prScreen.bottom;
        }
        let gaps = null;
        const er = element.getBoundingClientRect?.();
        const parentEl = element.offsetParent;
        if (!isSnap && er && parentEl instanceof Element) {
          const others = [...parentEl.querySelectorAll('[data-bld-node]')].filter((el) => el !== element);
          const ecx = (er.left + er.right) / 2;
          const ecy = (er.top + er.bottom) / 2;
          let gapL = null;
          let gapR = null;
          let gapT = null;
          let gapB = null;
          for (const el of others) {
            const cr = el.getBoundingClientRect();
            const ccx = (cr.left + cr.right) / 2;
            const ccy = (cr.top + cr.bottom) / 2;
            if (Math.abs(ecy - ccy) <= Math.max(er.height, cr.height) * 0.65) {
              const dL = er.left - cr.right;
              const dR = cr.left - er.right;
              if (dL >= -1 && dL < 800) gapL = gapL == null ? dL : Math.min(gapL, dL);
              if (dR >= -1 && dR < 800) gapR = gapR == null ? dR : Math.min(gapR, dR);
            }
            if (Math.abs(ecx - ccx) <= Math.max(er.width, cr.width) * 0.65) {
              const dT = er.top - cr.bottom;
              const dB = cr.top - er.bottom;
              if (dT >= -1 && dT < 800) gapT = gapT == null ? dT : Math.min(gapT, dT);
              if (dB >= -1 && dB < 800) gapB = gapB == null ? dB : Math.min(gapB, dB);
            }
          }
          gaps = {
            gapL: gapL != null ? Math.round(Math.max(0, gapL)) : null,
            gapR: gapR != null ? Math.round(Math.max(0, gapR)) : null,
            gapT: gapT != null ? Math.round(Math.max(0, gapT)) : null,
            gapB: gapB != null ? Math.round(Math.max(0, gapB)) : null,
          };
        }
        if (isSnap) {
          setDragAssist({
            mode: 'snap',
            snapSummary: friendlyFreeMoveSnapSummary(guideX, guideY),
            vline,
            hline,
          });
        } else {
          setDragAssist({
            mode: 'free',
            spacingLine: friendlyNeighborGapLine(gaps, spacing),
          });
        }
      } else {
        setDragAssist(null);
      }
      const next = applyDeviceStylePatch(
        node.style_json,
        device,
        {
          layout: {
            position: 'absolute',
            left: `${nextLeft}px`,
            top: `${nextTop}px`,
            ...(shouldShrinkToContent ? { alignSelf: 'flex-start', maxWidth: 'fit-content' } : {}),
          },
          ...(shouldShrinkToContent ? { size: { width: 'fit-content' } } : {}),
        },
        node.nodeType,
        siteTheme
      );
      setInteractionPreviewStyle(next.previewCss);
    };

    const handleUp = async (upEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      onFreeMoveBrush?.(false);
      const rawLeft = Math.round(startLeft + (upEvent.clientX - startX));
      const rawTop = Math.round(startTop + (upEvent.clientY - startY));
      const bounded = clampToParent(rawLeft, rawTop);
      const nextLeft = bounded.left;
      const nextTop = bounded.top;
      setInteractionPreviewStyle(null);
      setDragAssist(null);
      await commitStylePatch({
        layout: {
          position: 'absolute',
          left: `${nextLeft}px`,
          top: `${nextTop}px`,
          ...(shouldShrinkToContent ? { alignSelf: 'flex-start', maxWidth: 'fit-content' } : {}),
        },
        ...(shouldShrinkToContent ? { size: { width: 'fit-content' } } : {}),
      });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const maybeStartDirectMove = (event) => {
    if (!isFreeMode || !isSelected) return;
    if (sectionEditLocked) return;
    if (event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (node.nodeType === 'menu') {
      const navMenu = target.closest('nav.menu');
      if (navMenu && !target.closest('a.menu-item')) {
        event.preventDefault();
        startMoveWithMouse(event);
        return;
      }
    }
    const interactiveSelector =
      'button,input,textarea,select,a,[role="button"],[role="tab"],.live-feature-tabs__tab,.live-feature-tabs__image-btn,.live-faq-accordion__chevron-btn,.live-faq-accordion__add-btn,.live-faq-accordion__editable,.bld-demo-feature-tabs .live-feature-tabs__copy--editable,.live-tab-hero__tab,.live-tab-hero__image-btn,.live-tab-hero__editable,[data-bld-feature-tab-field],[contenteditable="true"],[contenteditable=""],.bld-transform-handle,.bld-node-controls,.bld-canvas-toolbar,.bld-canvas-toolbar__dropdown,.live-carousel__split-nav,.live-carousel__split-arrow,.live-carousel__split-dot,.live-carousel__arrow,.live-carousel__dot';
    if (target.closest(interactiveSelector)) return;
    startMoveWithMouse(event);
  };

  const openAddForRow = (event) => {
    event.stopPropagation();
    if (sectionEditLocked) return;
    onSelectNode(node.id);
    onOpenWidgetPicker?.(node.id);
  };
  const openAddSectionAfterRow = (event) => {
    event.stopPropagation();
    if (sectionEditLocked) return;
    if (!Number.isInteger(rowIndex)) return;
    onSelectNode(node.id);
    onOpenSectionInsert?.(rowIndex + 1);
  };

  const openAddForNode = (event) => {
    event.stopPropagation();
    if (sectionEditLocked) return;
    onSelectNode(node.id);
    onOpenWidgetPicker?.(node.id);
  };

  const deleteThisNode = (event) => {
    event?.stopPropagation?.();
    if (sectionEditLocked) return;
    const nid = canonicalNodeId(node.id);
    if (nid == null) return;
    onDeleteNode?.(nid);
  };

  const duplicateThisNode = (event) => {
    event?.stopPropagation?.();
    if (sectionEditLocked) return;
    const nid = canonicalNodeId(node.id);
    if (nid == null) return;
    onDuplicateNode?.(nid);
  };

  const handleRichTextEditStart = () => {
    if (sectionEditLocked) return;
    onSelectNode(node.id);
    setIsRichTextEditing(true);
  };

  const handleRichTextCommit = async (sanitizedHtml) => {
    setIsRichTextEditing(false);
    if (sectionEditLocked) return;
    if (!onUpdateNode) return;
    const prev = String(node.props?.content || '');
    if (prev === sanitizedHtml) return;
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          content: sanitizedHtml,
        },
      },
    });
  };

  const handleRichTextCancel = () => {
    setIsRichTextEditing(false);
  };

  const inlineEditDraftFromProps = (targetProps) => {
    const norm = normalizeInlineTextProps(targetProps || {});
    return resolveInlineTextHtml(norm) || norm.text || '';
  };

  const getTextCommandRoot = useCallback(
    (extra = {}) =>
      getRichTextCommandRoot({
        isInlineEditing,
        isRichTextEditing,
        isFeatureTabFieldEditing,
        inlineEditWrapRef,
        nodeElementRef,
        nodeType: node.nodeType,
        pinnedTextEditRoot: activeTextEditRootRef.current,
        ...extra,
      }),
    [
      isInlineEditing,
      isRichTextEditing,
      isFeatureTabFieldEditing,
      node.nodeType,
      inlineEditWrapRef,
      nodeElementRef,
    ]
  );

  const syncActiveTextEditRoot = useCallback(() => {
    const root = getTextCommandRoot();
    if (root) activeTextEditRootRef.current = root;
    return root;
  }, [
    getTextCommandRoot,
  ]);

  const focusActiveTextEditRoot = useCallback(
    (options = {}) => {
      const root = syncActiveTextEditRoot();
      if (!root || typeof root.focus !== 'function') return;

      const pointerEvent = options.pointerEvent;
      if (pointerEvent && placeCaretAtPointer(root, pointerEvent)) {
        preserveTextEditSelectionForToolbar(root);
        return;
      }

      if (!options.forceEnd && selectionIsInsideRoot(root)) {
        preserveTextEditSelectionForToolbar(root);
        return;
      }

      root.focus();
      try {
        const sel = window.getSelection();
        if (!sel) return;
        const range = document.createRange();
        range.selectNodeContents(root);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        preserveTextEditSelectionForToolbar(root);
      } catch {
        /* ignore */
      }
    },
    [syncActiveTextEditRoot]
  );

  const beginTextEditSession = useCallback(
    (event) => {
      if (sectionEditLocked) return;
      setTextEditToolbarOpen(true);
      if (
        (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') &&
        shouldStartFeatureTabTextEdit(event)
      ) {
        const field = event?.target?.closest?.(FEATURE_TAB_FIELD_SELECTOR);
        if (field) {
          activeTextEditRootRef.current = field;
        }
        setIsFeatureTabFieldEditing(true);
        scheduleAfterCanvasSelection(() => {
          const root = activeTextEditRootRef.current || syncActiveTextEditRoot();
          if (
            root &&
            document.activeElement === root &&
            selectionIsInsideRoot(root)
          ) {
            preserveTextEditSelectionForToolbar(root);
          } else {
            focusActiveTextEditRoot({ pointerEvent: event });
          }
          const liveRoot = syncActiveTextEditRoot();
          if (liveRoot) setToolbarFontSizeLive(readFontSizePxFromRoot(liveRoot, 16));
        });
        return;
      }
      if (!shouldStartTextEditFromCanvasClick(event, node.nodeType)) return;
      if (supportsInlineTextEdit) {
        if (!isInlineEditing) {
          setInlineDraftText(inlineEditDraftFromProps(node.props));
          setIsInlineEditing(true);
        }
        scheduleAfterCanvasSelection(() => {
          focusActiveTextEditRoot({ pointerEvent: event });
          const root = syncActiveTextEditRoot();
          if (root) setToolbarFontSizeLive(readFontSizePxFromRoot(root, 16));
        });
      } else if (node.nodeType === 'rich_text') {
        if (!isRichTextEditing) handleRichTextEditStart();
        scheduleAfterCanvasSelection(() => {
          focusActiveTextEditRoot({ pointerEvent: event });
          const root = syncActiveTextEditRoot();
          if (root) setToolbarFontSizeLive(readFontSizePxFromRoot(root, 16));
        });
      }
    },
    [
      sectionEditLocked,
      node.nodeType,
      supportsInlineTextEdit,
      isInlineEditing,
      isRichTextEditing,
      node.props,
      inlineEditDraftFromProps,
      syncActiveTextEditRoot,
      focusActiveTextEditRoot,
      handleRichTextEditStart,
    ]
  );

  const queueTextEditSession = useCallback(
    (event) => {
      if (!event || sectionEditLocked) return;
      const wantsCompoundField =
        (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') &&
        shouldStartFeatureTabTextEdit(event);
      const wantsLeaf = shouldStartTextEditFromCanvasClick(event, node.nodeType);
      if (!wantsCompoundField && !wantsLeaf) return;
      if (isSelected) {
        beginTextEditSession(event);
        return;
      }
      pendingTextEditPointerRef.current = event;
      onSelectNode(node.id);
    },
    [sectionEditLocked, node.nodeType, node.id, isSelected, beginTextEditSession, onSelectNode]
  );

  const handleTextEditPointerDownCapture = useCallback(
    (event) => {
      if (event.button !== 0) return;
      queueTextEditSession(event);
    },
    [queueTextEditSession]
  );

  const handleStatsFieldPointerDownCapture = useCallback(
    (event) => {
      if (event.button !== 0 || sectionEditLocked) return;
      if (!shouldStartFeatureTabTextEdit(event)) return;
      if (!isSelected) onSelectNode(node.id);
    },
    [sectionEditLocked, isSelected, node.id, onSelectNode]
  );

  const handleTabHeroFieldPointerDownCapture = useCallback(
    (event) => {
      if (event.button !== 0 || sectionEditLocked) return;
      if (!shouldStartFeatureTabTextEdit(event)) return;
      if (!isSelected) {
        onSelectNode(node.id);
        return;
      }
      beginTextEditSession(event);
    },
    [sectionEditLocked, isSelected, node.id, onSelectNode, beginTextEditSession]
  );

  const isTabHeroSectionRow =
    node.nodeType === 'row' && String(node.props?.meta?.sectionTemplate || '').trim() === 'tabHero';

  const handleNestedCompoundFieldPointerDownCapture = useCallback(
    (event) => {
      if (event.button !== 0 || sectionEditLocked) return;
      if (!shouldStartFeatureTabTextEdit(event)) return;
      const selectTarget = resolveBuilderCanvasSelectTarget(event, node.id);
      if (selectTarget === 'nav') return;
      if (String(selectTarget) === String(node.id)) return;
      onSelectNode(selectTarget);
    },
    [sectionEditLocked, node.id, onSelectNode]
  );

  useEffect(() => {
    if (!isSelected || !pendingTextEditPointerRef.current) return;
    const ev = pendingTextEditPointerRef.current;
    pendingTextEditPointerRef.current = null;
    scheduleAfterCanvasSelection(() => beginTextEditSession(ev));
  }, [isSelected, beginTextEditSession]);

  const resolveFloatingToolbarWrapEl = () => {
    if (supportsInlineTextEdit && isInlineEditing && inlineEditWrapRef.current) {
      return inlineEditWrapRef.current;
    }
    if (node.nodeType === 'rich_text' && isRichTextEditing && nodeElementRef.current) {
      return (
        nodeElementRef.current.querySelector('.bld-rich-text--editing[contenteditable], .bld-rich-text[contenteditable]') ||
        nodeElementRef.current
      );
    }
    if (
      (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') &&
      isFeatureTabFieldEditing &&
      nodeElementRef.current
    ) {
      const anchorSel =
        node.nodeType === 'tab_hero'
          ? '.live-tab-hero__card'
          : node.nodeType === 'stats_counter'
            ? '.live-stats-counter'
            : '.live-feature-tabs__copy';
      return (
        nodeElementRef.current.querySelector(`${FEATURE_TAB_FIELD_SELECTOR}:focus`) ||
        nodeElementRef.current.querySelector(anchorSel) ||
        nodeElementRef.current
      );
    }
    return null;
  };

  const persistFeatureTabFieldFromRoot = async (root, htmlOverride = null) => {
    if (!root || node.nodeType !== 'tabs' || !featureTabsPatchHandler) return false;
    const { tabs } = resolveFeatureTabsProps(node.props);
    const activeTabId = resolveActiveFeatureTabPanelIdFromDom(nodeElementRef.current, node.props);
    const panel = tabs.find((t) => t.id === activeTabId) || tabs[0];
    if (!panel?.id) return false;
    const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
    const rawHtml =
      typeof htmlOverride === 'string' ? htmlOverride : ensureFontSizeMarkupInRoot(root);
    let patch = null;
    if (root.classList.contains('live-feature-tabs__heading')) {
      patch = {
        heading: sanitizeFeatureTabFieldHtml(rawHtml, sanitizeOpts),
      };
    } else if (root.classList.contains('live-feature-tabs__paragraph')) {
      patch = {
        paragraph: sanitizeFeatureTabFieldHtml(rawHtml, sanitizeOpts),
      };
    } else if (root.closest('.live-feature-tabs__bullets')) {
      const list = nodeElementRef.current?.querySelector('.live-feature-tabs__bullets');
      if (!list) return false;
      const items = Array.from(list.querySelectorAll(FEATURE_TAB_FIELD_SELECTOR))
        .map((el) => {
          const raw =
            el === root && typeof htmlOverride === 'string' ? htmlOverride : el.innerHTML;
          if (featureTabFieldHasInlineHtml(raw)) {
            return sanitizeFeatureTabFieldHtml(raw, sanitizeOpts);
          }
          return String(el.innerText || '').trim();
        })
        .filter(Boolean);
      patch = { bullets: items };
    } else if (root.classList.contains('live-feature-tabs__tab-label')) {
      patch = { label: String(root.innerText || '').trim() };
    }
    if (!patch) return false;
    await featureTabsPatchHandler(panel.id, patch, { immediate: true });
    return true;
  };

  const persistTabHeroFieldFromRoot = async (root, htmlOverride = null) => {
    if (!root || node.nodeType !== 'tab_hero' || !tabHeroPatchHandler) return false;
    const { panels } = resolveTabHeroProps(node.props);
    const activePanelId = resolveActiveTabHeroPanelIdFromDom(nodeElementRef.current, node.props);
    const panel = panels.find((p) => p.id === activePanelId) || panels[0];
    if (!panel?.id) return false;
    const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
    const rawHtml =
      typeof htmlOverride === 'string' ? htmlOverride : ensureFontSizeMarkupInRoot(root);
    let patch = null;
    if (root.classList.contains('live-tab-hero__heading')) {
      patch = { heading: sanitizeFeatureTabFieldHtml(rawHtml, sanitizeOpts) };
    } else if (root.classList.contains('live-tab-hero__eyebrow')) {
      patch = { eyebrow: sanitizeFeatureTabFieldHtml(rawHtml, sanitizeOpts) };
    } else if (root.classList.contains('live-tab-hero__paragraph')) {
      patch = { paragraph: sanitizeFeatureTabFieldHtml(rawHtml, sanitizeOpts) };
    } else if (root.classList.contains('live-tab-hero__cta')) {
      patch = { ctaLabel: String(root.innerText || '').trim() };
    } else if (root.classList.contains('live-tab-hero__tab-label')) {
      patch = { label: String(root.innerText || '').trim() };
    }
    if (!patch) return false;
    await tabHeroPatchHandler(panel.id, patch);
    return true;
  };

  const persistStatsCounterFieldFromRoot = async (root, htmlOverride = null) => {
    if (!root || node.nodeType !== 'stats_counter' || !statsCounterPatchHandler) return false;
    const itemEl = root.closest?.('.live-stats-counter__item');
    const index = Number(itemEl?.getAttribute?.('data-stat-index'));
    if (!Number.isInteger(index) || index < 0) return false;
    const rawText =
      typeof htmlOverride === 'string' ? htmlOverride : String(root.innerText || '').trim();
    if (root.classList.contains('live-stats-counter__value')) {
      await statsCounterPatchHandler(index, parseStatDisplayValue(rawText));
      return true;
    }
    if (root.classList.contains('live-stats-counter__label')) {
      await statsCounterPatchHandler(index, { label: rawText });
      return true;
    }
    return false;
  };

  const persistCompoundFieldFromRoot = async (root, htmlOverride = null) => {
    if (node.nodeType === 'tabs') return persistFeatureTabFieldFromRoot(root, htmlOverride);
    if (node.nodeType === 'tab_hero') return persistTabHeroFieldFromRoot(root, htmlOverride);
    if (node.nodeType === 'stats_counter') return persistStatsCounterFieldFromRoot(root, htmlOverride);
    return false;
  };

  useEffect(() => {
    if (!supportsInlineTextEdit || !isInlineEditing) return;
    if (textEditToolbarOpen) return;
    setInlineDraftText(node.props?.text || '');
  }, [isInlineEditing, node.props?.text, supportsInlineTextEdit, textEditToolbarOpen]);

  useEffect(() => {
    setIsRichTextEditing(false);
  }, [node.id]);

  useEffect(() => {
    if (!isSelected) setIsRichTextEditing(false);
  }, [isSelected]);

  useEffect(() => {
    if (!showFloatingTextToolbar && !isFeatureTabFieldEditing && !isInlineEditing) {
      activeTextEditRootRef.current = null;
    }
  }, [showFloatingTextToolbar, isFeatureTabFieldEditing, isInlineEditing]);

  useEffect(() => {
    if (
      (node.nodeType !== 'tabs' && node.nodeType !== 'tab_hero') ||
      !isSelected ||
      sectionEditLocked
    ) {
      return undefined;
    }
    const shell = nodeElementRef.current;
    if (!shell) return undefined;
    const onFocusIn = (event) => {
      const field = event.target?.closest?.(FEATURE_TAB_FIELD_SELECTOR);
      if (!field) return;
      const prevRoot = activeTextEditRootRef.current;
      if (prevRoot && prevRoot !== field && shell.contains(prevRoot)) {
        void persistCompoundFieldFromRoot(prevRoot);
      }
      activeTextEditRootRef.current = field;
      setIsFeatureTabFieldEditing(true);
      setTextEditToolbarOpen(true);
      scheduleAfterCanvasSelection(() => {
        const root = syncActiveTextEditRoot();
        if (root) setToolbarFontSizeLive(readFontSizePxFromRoot(root, 16));
      });
    };
    shell.addEventListener('focusin', onFocusIn, true);
    return () => shell.removeEventListener('focusin', onFocusIn, true);
  }, [node.nodeType, isSelected, sectionEditLocked, node.id, syncActiveTextEditRoot]);

  useEffect(() => {
    if (
      (node.nodeType !== 'tabs' && node.nodeType !== 'tab_hero') ||
      !isSelected ||
      sectionEditLocked
    ) {
      return;
    }
    const shell = nodeElementRef.current;
    if (!shell) return;
    const focused =
      shell.querySelector(`${FEATURE_TAB_FIELD_SELECTOR}:focus`) ||
      (shell.contains(document.activeElement) &&
      document.activeElement?.closest?.(FEATURE_TAB_FIELD_SELECTOR));
    if (!focused) return;
    activeTextEditRootRef.current = focused;
    setIsFeatureTabFieldEditing(true);
    setTextEditToolbarOpen(true);
    setToolbarFontSizeLive(readFontSizePxFromRoot(focused, 16));
  }, [isSelected, node.nodeType, node.id, sectionEditLocked]);

  useEffect(() => {
    if (!showFloatingTextToolbar) return undefined;
    const onSelectionChange = () => {
      const root = activeTextEditRootRef.current || syncActiveTextEditRoot();
      if (root) preserveTextEditSelectionForToolbar(root);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [showFloatingTextToolbar, syncActiveTextEditRoot]);

  useEffect(() => {
    setInlinePanelText(node.props?.text || '');
    setInlinePanelImageSrc(node.props?.src || '');
    setInlinePanelImageAlt(node.props?.alt || '');
    setInlinePanelMenuItems(
      JSON.stringify(Array.isArray(node.props?.items) ? node.props.items : [], null, 2)
    );
    setInlinePanelError('');
  }, [node.id, node.props?.text, node.props?.src, node.props?.alt, node.props?.items]);

  const freezeFloatingToolbar = useCallback((ms = 1200) => {
    floatingToolbarFreezeRef.current = true;
    if (floatingToolbarFreezeTimerRef.current) clearTimeout(floatingToolbarFreezeTimerRef.current);
    floatingToolbarFreezeTimerRef.current = setTimeout(() => {
      floatingToolbarFreezeRef.current = false;
      floatingToolbarFreezeTimerRef.current = null;
    }, ms);
  }, []);

  useLayoutEffect(() => {
    if (!showFloatingTextToolbar) {
      floatingToolbarPosRef.current = null;
      setFloatingToolbarPos(null);
      setFallbackToolbarPos(null);
      return undefined;
    }
    let raf = 0;
    const update = () => {
      if (floatingToolbarFreezeRef.current || isFocusInsideFloatingToolbar()) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (floatingToolbarFreezeRef.current || isFocusInsideFloatingToolbar()) return;
        syncActiveTextEditRoot();
        const wrapEl = resolveFloatingToolbarWrapEl();
        const anchorRect = resolveFloatingToolbarAnchorRect({ wrapRef: { current: wrapEl } });
        const wrapRect = wrapEl?.getBoundingClientRect?.();

        const tb = floatingToolbarRef.current?.getBoundingClientRect?.();
        const toolbarSize =
          tb && Number.isFinite(tb.width) && tb.width > 0
            ? { width: tb.width, height: tb.height || 48 }
            : { width: 420, height: 44 };

        const anchor =
          anchorRect ||
          (wrapRect && wrapRect.width >= 0
            ? {
                left: wrapRect.left,
                top: wrapRect.top,
                bottom: wrapRect.bottom,
                width: wrapRect.width,
                height: wrapRect.height,
              }
            : null);
        if (!anchor) return;

        const pos = computeFloatingToolbarPosition(anchor, toolbarSize, {
          margin: node.nodeType === 'tabs' ? 14 : 10,
          gap: 10,
        });
        floatingToolbarPosRef.current = pos;
        setFloatingToolbarPos(pos);
        setFallbackToolbarPos(pos);
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    document.addEventListener('selectionchange', update, true);
    return () => {
      cancelAnimationFrame(raf);
      if (floatingToolbarFreezeTimerRef.current) {
        clearTimeout(floatingToolbarFreezeTimerRef.current);
        floatingToolbarFreezeTimerRef.current = null;
      }
      floatingToolbarFreezeRef.current = false;
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('selectionchange', update, true);
    };
  }, [
    showFloatingTextToolbar,
    isInlineEditing,
    isRichTextEditing,
    isFeatureTabFieldEditing,
    isSelected,
    node.id,
    inlineDraftText,
    node.nodeType,
    syncActiveTextEditRoot,
  ]);

  const showImageMediaToolbar =
    (node.nodeType === 'image' || node.nodeType === 'menu') && isNodeActive && !sectionEditLocked;

  useLayoutEffect(() => {
    if (!showImageMediaToolbar) {
      setImageToolbarFixedPos(null);
      return undefined;
    }
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const shell = nodeElementRef.current;
        if (!shell) return;
        const rect = shell.getBoundingClientRect();
        const tb = imageToolbarRef.current?.getBoundingClientRect?.();
        const toolbarSize = {
          width: tb && tb.width > 0 ? tb.width : 188,
          height: tb && tb.height > 0 ? tb.height : 118,
        };
        const pos = computeFloatingToolbarBesidePosition(rect, toolbarSize, {
          gap: 12,
          preferBelow: nodeLooksLikeBrandLogo(node),
        });
        setImageToolbarFixedPos(pos);
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showImageMediaToolbar, node.id, node.nodeType, node.props?.logoWidth, deviceStyle?.size?.width]);

  const handleInlineEditStart = (targetNode, event) => {
    if (sectionEditLocked) return;
    if (!supportsInlineTextEdit || targetNode.id !== node.id) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectNode(node.id);
    setIsInlineEditing(true);
    setInlineDraftText(inlineEditDraftFromProps(targetNode.props));
  };

  const handleInlineEditCancel = () => {
    setIsInlineEditing(false);
    isCommittingInlineEditRef.current = false;
    setInlineDraftText(inlineEditDraftFromProps(node.props));
  };

  const handleInlineEditCommit = async (targetNode) => {
    if (isCommittingInlineEditRef.current) return;
    if (sectionEditLocked) return;
    if (!supportsInlineTextEdit || targetNode.id !== node.id) return;
    isCommittingInlineEditRef.current = true;
    let nextText = inlineDraftText;
    if (
      (targetNode.nodeType === 'heading' ||
        targetNode.nodeType === 'text' ||
        targetNode.nodeType === 'paragraph') &&
      isProbablyInlineHtml(nextText)
    ) {
      nextText = sanitizeInlineLeafHtml(nextText, { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist });
    }
    setIsInlineEditing(false);
    if (!onUpdateNode) {
      isCommittingInlineEditRef.current = false;
      return;
    }
    const prevDraft = inlineEditDraftFromProps(targetNode.props);
    if (prevDraft === nextText) {
      isCommittingInlineEditRef.current = false;
      return;
    }
    try {
      await onUpdateNode({
        nodeId: targetNode.id,
        payload: {
          props: {
            ...targetNode.props,
            ...propsPatchForTextContent(targetNode.props || {}, nextText),
          },
        },
      });
    } finally {
      isCommittingInlineEditRef.current = false;
    }
  };

  const endTextEditSession = useCallback(async () => {
    if (
      (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') &&
      (isFeatureTabFieldEditing || activeTextEditRootRef.current)
    ) {
      const tabRoot =
        activeTextEditRootRef.current ||
        nodeElementRef.current?.querySelector(`${FEATURE_TAB_FIELD_SELECTOR}:focus`) ||
        nodeElementRef.current?.querySelector(FEATURE_TAB_FIELD_SELECTOR);
      if (tabRoot) await persistCompoundFieldFromRoot(tabRoot);
    }
    setTextEditToolbarOpen(false);
    setToolbarFontSizeLive(null);
    const root = nodeElementRef.current?.querySelector?.(
      `${FEATURE_TAB_FIELD_SELECTOR}:focus, [contenteditable="true"]:focus, [contenteditable=""]:focus`
    );
    activeTextEditRootRef.current = null;
    const shouldBlurFocusedRoot =
      textEditToolbarOpen ||
      isInlineEditing ||
      isRichTextEditing ||
      isFeatureTabFieldEditing;
    if (root && typeof root.blur === 'function' && shouldBlurFocusedRoot) root.blur();
    if (isInlineEditing) {
      await handleInlineEditCommit(node);
    } else {
      setIsInlineEditing(false);
    }
    setIsFeatureTabFieldEditing(false);
    if (isRichTextEditing) setIsRichTextEditing(false);
    setFloatingToolbarPos(null);
    setFallbackToolbarPos(null);
  }, [
    node,
    node.nodeType,
    isInlineEditing,
    isRichTextEditing,
    isFeatureTabFieldEditing,
    textEditToolbarOpen,
    handleInlineEditCommit,
    persistCompoundFieldFromRoot,
  ]);

  useEffect(() => {
    wasSelectedRef.current = isSelected;
    if (isSelected) return;
    const shell = nodeElementRef.current;
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    const focusedField =
      shell && active && shell.contains(active)
        ? active.closest?.(FEATURE_TAB_FIELD_SELECTOR)
        : null;
    if (focusedField) {
      if (
        node.nodeType === 'tabs' ||
        node.nodeType === 'tab_hero' ||
        node.nodeType === 'stats_counter'
      ) {
        void persistCompoundFieldFromRoot(focusedField);
      }
      return;
    }
    void endTextEditSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close toolbar when selection leaves this node
  }, [isSelected, node.id]);

  useEffect(() => {
    if (!textEditToolbarOpen || !isSelected || sectionEditLocked) return undefined;
    const shell = nodeElementRef.current;
    const onPointerDown = (event) => {
      if (toolbarColorPickerOpenRef.current) return;
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      if (target.closest(FLOATING_TOOLBAR_SELECTOR)) return;
      if (target.closest('.bld-floating-inline-toolbar, .bld-wp-toolbar')) return;
      if (shell?.contains(target)) return;
      void endTextEditSession();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [textEditToolbarOpen, isSelected, sectionEditLocked, node.id, endTextEditSession]);

  const handleInlinePanelSave = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (sectionEditLocked) return;
    setInlinePanelError('');
    if (!onUpdateNode) return;

    const nextProps = { ...node.props };
    if (
      node.nodeType === 'heading' ||
      node.nodeType === 'text' ||
      node.nodeType === 'paragraph' ||
      node.nodeType === 'button'
    ) {
      nextProps.text = inlinePanelText;
    } else if (node.nodeType === 'image') {
      nextProps.src = inlinePanelImageSrc;
      nextProps.alt = inlinePanelImageAlt;
    } else if (node.nodeType === 'menu') {
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(inlinePanelMenuItems || '[]');
      } catch {
        setInlinePanelError('Menu JSON is invalid.');
        return;
      }
      if (!Array.isArray(parsedItems)) {
        setInlinePanelError('Menu items array hona chahiye.');
        return;
      }
      nextProps.items = parsedItems;
    } else {
      return;
    }

    await onUpdateNode({
      nodeId: node.id,
      payload: { props: nextProps },
    });
  };

  const handleInlineImagePick = (event) => {
    if (sectionEditLocked) return;
    const file = event.target.files?.[0];
    if (!file || !file.type?.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    setIsReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      setInlinePanelImageSrc(src);
      setInlinePanelImageAlt((prev) => prev || file.name.replace(/\.[^.]+$/, ''));
      setIsReadingImage(false);
      event.target.value = '';
    };
    reader.onerror = () => {
      setIsReadingImage(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const updateImageProps = async (patch) => {
    if (sectionEditLocked) return;
    if (node.nodeType !== 'image' || !onUpdateNode) return;
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          ...patch,
        },
      },
    });
  };

  const adjustImageCropHeight = async (delta) => {
    if (node.nodeType !== 'image') return;
    const currentHeight = Number(node.props?.imageHeightPx || 0);
    const nextHeight = Math.max(0, currentHeight + delta);
    await updateImageProps({ imageHeightPx: nextHeight });
  };

  const adjustImageBlockWidth = async (delta) => {
    if (node.nodeType !== 'image') return;
    const widthFromStyle = parseFloat(String(deviceStyle?.size?.width || '').replace('px', ''));
    const widthFromRect = Math.round(nodeElementRef.current?.getBoundingClientRect?.().width || 0);
    const baseWidth = Number.isFinite(widthFromStyle) ? widthFromStyle : widthFromRect || 320;
    const nextWidth = Math.max(120, Math.round(baseWidth + delta));
    const keepPosition = String(deviceStyle?.layout?.position || '').trim();
    await commitStylePatch({
      layout: {
        alignSelf: 'flex-start',
        maxWidth: `${nextWidth}px`,
        ...(keepPosition ? { position: keepPosition } : {}),
      },
      size: { width: `${nextWidth}px` },
    });
  };

  const measureBrandLogoFillWidthPx = () => {
    const shell = nodeElementRef.current;
    const logoSlot = shell?.closest?.('.site-header-logo');
    const measureEl = logoSlot || shell?.parentElement;
    const rect = measureEl?.getBoundingClientRect?.();
    if (rect?.width > 48) {
      return Math.max(48, Math.min(400, Math.round(rect.width)));
    }
    return 220;
  };

  const commitBrandLogoWidthPx = async (nextWidth) => {
    if (sectionEditLocked || !onUpdateNode) return;
    if (node.nodeType !== 'image' || !nodeLooksLikeBrandLogo(node)) return;
    const widthPx = Math.max(48, Math.min(400, Math.round(Number(nextWidth) || 160)));
    const propsPatch = brandLogoPropsPatchFromFormKey('logoWidth', widthPx, node.props || {});
    if (!propsPatch) return;
    const sizeStylePatch = {
      layout: { alignSelf: 'flex-start', maxWidth: `${widthPx}px` },
      size: { width: `${widthPx}px`, height: 'auto' },
    };
    let nextStyleJson = node.style_json;
    for (const d of ['desktop', 'tablet', 'mobile']) {
      const next = applyDeviceStylePatch(
        nextStyleJson,
        d,
        withFlexWidthOverride(node.nodeType, sizeStylePatch),
        node.nodeType,
        siteTheme
      );
      nextStyleJson = next.style_json;
    }
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          ...propsPatch,
        },
        style_json: nextStyleJson,
      },
    });
  };

  const adjustBrandLogoWidth = async (delta) => {
    if (node.nodeType !== 'image' || !nodeLooksLikeBrandLogo(node)) return;
    const normalized = normalizeBrandLogoProps(node.props || {});
    const current = parseBrandLogoWidthPx(normalized.width, 160);
    const nextWidth = Math.max(48, Math.min(400, Math.round(current + delta)));
    await commitBrandLogoWidthPx(nextWidth);
  };

  const quickBrandLogoFullWidth = async () => {
    if (node.nodeType !== 'image' || !nodeLooksLikeBrandLogo(node)) return;
    await commitBrandLogoWidthPx(measureBrandLogoFillWidthPx());
  };

  const adjustNodeWidth = async (delta) => {
    const widthFromStyle = parseFloat(String(deviceStyle?.size?.width || '').replace('px', ''));
    const widthFromRect = Math.round(nodeElementRef.current?.getBoundingClientRect?.().width || 0);
    const baseWidth = Number.isFinite(widthFromStyle) ? widthFromStyle : widthFromRect || 320;
    const nextWidth = Math.max(80, Math.round(baseWidth + delta));
    const patch = {
      size: { width: `${nextWidth}px` },
      layout: node.nodeType !== 'row' ? { alignSelf: 'flex-start', maxWidth: `${nextWidth}px` } : {},
    };
    await commitStylePatch(patch);
  };

  const quickSetHeadingTag = async (rawTag) => {
    if (sectionEditLocked) return;
    if (node.nodeType !== 'heading' || !onUpdateNode) return;
    const tag = normalizeHeadingTag(rawTag);
    const typo = semanticHeadingTypography(tag);
    const next = applyDeviceStylePatch(
      node.style_json,
      device,
      withFlexWidthOverride(node.nodeType, { typography: typo }),
      node.nodeType,
      siteTheme
    );
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          tag,
        },
        style_json: next.style_json,
      },
    });
  };

  const beginToolbarColorPicker = () => {
    toolbarColorPickerOpenRef.current = true;
    freezeFloatingToolbar(4000);
    const root = activeTextEditRootRef.current || syncActiveTextEditRoot();
    preserveTextEditSelectionForToolbar(root);
    return root;
  };

  const handleFloatingToolbarPointerDown = (event) => {
    const root = activeTextEditRootRef.current || syncActiveTextEditRoot();
    preserveTextEditSelectionForToolbar(root);
    consumeFloatingToolbarPointerForCanvas(event);
    freezeFloatingToolbar(1600);
  };

  const endToolbarColorPicker = () => {
    window.setTimeout(() => {
      toolbarColorPickerOpenRef.current = false;
    }, 200);
  };

  const inlineEditBlurCommitGuard = () =>
    toolbarColorPickerOpenRef.current || isFocusInFloatingToolbar();
  const textEditBlurCommitGuard = inlineEditBlurCommitGuard;
  const featureTabValueSyncGuard = () => textEditToolbarOpen;

  const persistRichHtmlFromCommand = async (command, value) => {
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs' &&
      node.nodeType !== 'tab_hero' &&
      node.nodeType !== 'stats_counter'
    ) {
      return false;
    }
    const root =
      activeTextEditRootRef.current || getTextCommandRoot();
    if (!root) return false;
    const result = execFormatOnTextRoot(root, command, value);
    if (!result) return false;
    const { before, after } = result;
    if (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') {
      await persistCompoundFieldFromRoot(root);
      return true;
    }
    if (node.nodeType === 'rich_text') {
      const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
      if (sanitizeRichHtml(before, sanitizeOpts) === sanitizeRichHtml(after, sanitizeOpts)) {
        return false;
      }
      const content = sanitizeRichHtml(after, sanitizeOpts);
      if (!isRichTextEditing || !onUpdateNode) return false;
      await onUpdateNode({
        nodeId: node.id,
        payload: {
          props: {
            ...(node.props || {}),
            content,
          },
        },
      });
      return true;
    }
    if (
      sanitizeInlineLeafHtml(before, { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist }) ===
      sanitizeInlineLeafHtml(after, { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist })
    ) {
      return false;
    }
    const text = sanitizeInlineLeafHtml(after, { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist });
    if (isInlineEditing) {
      setInlineDraftText(text);
      return true;
    }
    if (!onUpdateNode) return false;
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          ...propsPatchForTextContent(node.props || {}, text),
        },
      },
    });
    return true;
  };

  const quickToggleBold = async () => {
    if (sectionEditLocked) return;
    if (node.nodeType === 'button') {
      const current = String(deviceStyle?.typography?.fontWeight || '400');
      const next = current === '700' ? '400' : '700';
      await commitStylePatch({
        typography: { fontWeight: next },
      });
      return;
    }
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs' &&
      node.nodeType !== 'tab_hero'
    )
      return;
    const applied = await persistRichHtmlFromCommand('bold');
    if (!applied) {
      const current = String(deviceStyle?.typography?.fontWeight || '400');
      const next = current === '700' ? '400' : '700';
      await commitStylePatch({ typography: { fontWeight: next } });
    }
  };

  const quickRichFormat = (command, value) => async () => {
    if (sectionEditLocked) return;
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs' &&
      node.nodeType !== 'tab_hero'
    )
      return;
    await persistRichHtmlFromCommand(command, value);
  };

  const quickClearFormatting = async () => {
    if (sectionEditLocked) return;
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs' &&
      node.nodeType !== 'tab_hero'
    )
      return;
    const root =
      activeTextEditRootRef.current || getTextCommandRoot();
    if (!root) return;
    if (selectionNonCollapsedInRoot(root)) {
      execFormatOnTextRoot(root, 'removeFormat');
      execFormatOnTextRoot(root, 'unlink');
    } else {
      root.textContent = root.textContent || '';
    }
    clearInlineFontSizeOnHost(root);
    if (root.innerHTML && /<[a-z]/i.test(root.innerHTML)) {
      root.innerHTML = stripToolbarFontSizeFromHtml(root.innerHTML);
    }
    if (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') {
      await persistCompoundFieldFromRoot(root);
      return;
    }
    if (node.nodeType === 'rich_text') {
      const content = sanitizeRichHtml(root.innerHTML, {
        neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
      });
      if (!isRichTextEditing || !onUpdateNode) return;
      await onUpdateNode({
        nodeId: node.id,
        payload: {
          props: {
            ...(node.props || {}),
            content,
          },
        },
      });
      return;
    }
    const after = sanitizeInlineLeafHtml(root.innerHTML, {
      neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
    });
    if (isInlineEditing) {
      setInlineDraftText(after);
      return;
    }
    if (!onUpdateNode) return;
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          ...propsPatchForTextContent(node.props || {}, after),
        },
      },
    });
  };

  const syncInlineEditorFromRoot = (root) => {
    if (!root || !isInlineEditing) return;
    const html = root.innerHTML;
    const text = sanitizeInlineLeafHtml(html, {
      neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
    });
    setInlineDraftText(text || html);
  };

  const quickSetTextColor = async (color) => {
    if (sectionEditLocked) return;
    const hex = String(color || '').trim();
    if (!hex) return;

    const root = getTextCommandRoot();

    const applyToEditor = () => {
      if (!root) return;
      root.style.setProperty('color', hex);
      root.style.setProperty('--node-text', hex);
    };

    if (node.nodeType === 'heading' || node.nodeType === 'text' || node.nodeType === 'paragraph') {
      if (root) {
        const result = applyRichColorInRoot(root, 'foreColor', hex);
        if (result) {
          const after = sanitizeInlineLeafHtml(result.after, {
            neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
          });
          const before = sanitizeInlineLeafHtml(result.before, {
            neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
          });
          if (isInlineEditing) {
            applyToEditor();
            if (after !== before) {
              setInlineDraftText(after);
            } else {
              syncInlineEditorFromRoot(root);
            }
          } else if (after !== before && onUpdateNode) {
            await onUpdateNode({
              nodeId: node.id,
              payload: {
                props: {
                  ...(node.props || {}),
                  ...propsPatchForTextContent(node.props || {}, after),
                },
              },
            });
            await commitStylePatch({
              typography: { color: hex },
              colors: { textColor: hex },
            });
            return;
          }
        } else if (isInlineEditing) {
          applyToEditor();
        }
      }
    }

    await commitStylePatch({
      typography: { color: hex },
      colors: { textColor: hex },
    });
  };

  const quickSetHighlightColor = async (color) => {
    if (sectionEditLocked) return;
    const hex = String(color || '').trim();
    if (!hex) return;

    const root = getTextCommandRoot();

    if ((node.nodeType === 'heading' || node.nodeType === 'text' || node.nodeType === 'paragraph') && root) {
      const result = applyRichColorInRoot(root, 'hiliteColor', hex);
      if (result) {
        const after = sanitizeInlineLeafHtml(result.after, {
          neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
        });
        const before = sanitizeInlineLeafHtml(result.before, {
          neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
        });
        if (isInlineEditing) {
          if (after !== before) {
            setInlineDraftText(after);
          } else {
            syncInlineEditorFromRoot(root);
          }
        } else if (after !== before && onUpdateNode) {
          await onUpdateNode({
            nodeId: node.id,
            payload: {
              props: {
                ...(node.props || {}),
                ...propsPatchForTextContent(node.props || {}, after),
              },
            },
          });
          return;
        }
      }
    }

    const applied = await persistRichHtmlFromCommand('hiliteColor', hex);
    if (!applied) {
      await commitStylePatch({
        colors: { backgroundColor: hex },
        background: { backgroundColor: hex },
      });
    }
  };

  const quickSetLink = async () => {
    if (sectionEditLocked) return;
    if (!onUpdateNode) return;
    if (node.nodeType === 'button') {
      const current = String(node.props?.href || '');
      const next = typeof window !== 'undefined' ? window.prompt('Set link URL', current || '#') : current;
      if (next == null) return;
      await onUpdateNode({
        nodeId: node.id,
        payload: {
          props: {
            ...(node.props || {}),
            href: String(next || ''),
          },
        },
      });
      return;
    }
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs'
    )
      return;
    const next =
      typeof window !== 'undefined' ? window.prompt('Set link URL', 'https://') : null;
    if (next == null || String(next).trim() === '') return;
    await persistRichHtmlFromCommand('createLink', String(next).trim());
  };

  const quickSetAlign = async (side) => {
    const next = side === 'center' || side === 'right' || side === 'left' ? side : 'left';
    await commitStylePatch({
      typography: { textAlign: next },
    });
  };

  const readToolbarFontSizePx = () => {
    const root = activeTextEditRootRef.current || syncActiveTextEditRoot();
    if (root && typeof window !== 'undefined') {
      return readFontSizePxFromRoot(root, 16);
    }
    const raw = String(deviceStyle?.typography?.fontSize || '').trim();
    const fromStyle = parseTypographyFontSizePx(raw, 0);
    if (fromStyle > 0) return fromStyle;
    if (node.nodeType === 'heading') {
      const typo = semanticHeadingTypography(headingTag);
      const semantic = parseTypographyFontSizePx(typo?.fontSize, 0);
      if (semantic > 0) return semantic;
    }
    const leaf =
      nodeElementRef.current?.querySelector?.('.bld-demo-text, .bld-demo-heading') || nodeElementRef.current;
    if (leaf && typeof window !== 'undefined') {
      return readFontSizePxFromRoot(leaf, 16);
    }
    return 16;
  };

  const persistInlineRichHtml = async (afterHtml) => {
    if (node.nodeType === 'rich_text') {
      const content = sanitizeRichHtml(afterHtml, {
        neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
      });
      if (!isRichTextEditing || !onUpdateNode) return;
      const prev = String(node.props?.content || '');
      if (prev === content) return;
      await onUpdateNode({
        nodeId: node.id,
        payload: {
          props: {
            ...(node.props || {}),
            content,
          },
        },
      });
      return;
    }
    const text = sanitizeInlineLeafHtml(afterHtml, { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist });
    if (isInlineEditing) {
      setInlineDraftText(text);
      return;
    }
    if (!onUpdateNode) return;
    const prev = inlineEditDraftFromProps(node.props);
    if (prev === text) return;
    await onUpdateNode({
      nodeId: node.id,
      payload: {
        props: {
          ...(node.props || {}),
          ...propsPatchForTextContent(node.props || {}, text),
        },
      },
    });
  };

  const persistFontSizeHtmlFromRoot = async (root, result) => {
    if (!root || !result) return;
    const { before, after } = result;
    const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
    const unchanged =
      node.nodeType === 'rich_text'
        ? sanitizeRichHtml(before, sanitizeOpts) === sanitizeRichHtml(after, sanitizeOpts)
        : sanitizeInlineLeafHtml(before, sanitizeOpts) === sanitizeInlineLeafHtml(after, sanitizeOpts);
    if (unchanged) return;
    if (node.nodeType === 'tabs' || node.nodeType === 'tab_hero' || node.nodeType === 'stats_counter') {
      await persistCompoundFieldFromRoot(root, after);
      return;
    }
    await persistInlineRichHtml(after);
  };

  const lockTextEditRootForFormatting = (root) => {
    if (!root?.setAttribute) return;
    root.setAttribute(BLD_FORMATTING_LOCK_ATTR, '1');
    window.setTimeout(() => {
      root.removeAttribute?.(BLD_FORMATTING_LOCK_ATTR);
    }, 400);
  };

  const applyFontSizeToActiveRoot = async (nextPx, options = {}) => {
    const root =
      activeTextEditRootRef.current || getTextCommandRoot();
    if (!root) return false;
    preserveTextEditSelectionForToolbar(root);
    const isFeatureTabField = Boolean(root.closest?.('[data-bld-feature-tab-field]') ?? root.hasAttribute?.('data-bld-feature-tab-field'));
    const hasHighlight = selectionNonCollapsedInRoot(root);
    const selectAllIfCollapsed =
      options.selectAllIfCollapsed ?? !hasHighlight;
    const useWholeBlock =
      isFeatureTabField ||
      node.nodeType === 'tabs' ||
      node.nodeType === 'tab_hero' ||
      node.nodeType === 'stats_counter' ||
      isInlineEditing ||
      node.nodeType === 'rich_text';
    const result = applyFontSizePxInRoot(root, nextPx, {
      selectAllIfCollapsed: isFeatureTabField || isInlineEditing ? true : selectAllIfCollapsed,
      wholeBlock: useWholeBlock,
    });
    if (!result) return false;
    lockTextEditRootForFormatting(root);
    await persistFontSizeHtmlFromRoot(root, result);
    if (isInlineEditing && supportsInlineTextEdit) {
      setInlineDraftText(
        node.nodeType === 'rich_text'
          ? result.after
          : sanitizeInlineLeafHtml(result.after, {
              neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist,
            })
      );
    }
    activeTextEditRootRef.current = root;
    setToolbarFontSizeLive(readFontSizePxFromRoot(root, nextPx));
    preserveTextEditSelectionForToolbar(root);
    if (typeof root.focus === 'function') root.focus();
    setTextEditToolbarOpen(true);
    return true;
  };

  const quickSetFontSizePx = async (px) => {
    if (sectionEditLocked) return;
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs' &&
      node.nodeType !== 'tab_hero'
    )
      return;
    const nextPx = clampFontSizePx(px, readToolbarFontSizePx());
    const applied = await applyFontSizeToActiveRoot(nextPx, { selectAllIfCollapsed: true });
    if (!applied) {
      await commitStylePatch({
        typography: { fontSize: `${nextPx}px` },
      });
    }
  };

  const quickAdjustFontSize = async (delta) => {
    if (sectionEditLocked) return;
    if (
      node.nodeType !== 'heading' &&
      node.nodeType !== 'text' &&
      node.nodeType !== 'paragraph' &&
      node.nodeType !== 'rich_text' &&
      node.nodeType !== 'tabs' &&
      node.nodeType !== 'tab_hero'
    )
      return;
    const step = Number(delta) || 0;
    if (!step) return;

    const root =
      activeTextEditRootRef.current || getTextCommandRoot();

    if (root) {
      const currentPx = readFontSizePxFromRoot(root, readToolbarFontSizePx());
      const nextPx = clampFontSizePx(currentPx + step, currentPx);
      await applyFontSizeToActiveRoot(nextPx);
      return;
    }

    const currentPx = readToolbarFontSizePx();
    const nextPx = clampFontSizePx(currentPx + step, currentPx);
    await commitStylePatch({
      typography: { fontSize: `${nextPx}px` },
    });
  };

  const toolbarFontSizePx = toolbarFontSizeLive ?? readToolbarFontSizePx();

  const quickToggleTextWrap = async () => {
    if (node.nodeType !== 'heading' && node.nodeType !== 'text' && node.nodeType !== 'paragraph') return;
    const defaultWs = node.nodeType === 'text' ? 'pre-wrap' : 'normal';
    const cur = String(deviceStyle?.typography?.whiteSpace || '').trim() || defaultWs;
    const next = cur === 'nowrap' ? defaultWs : 'nowrap';
    await commitStylePatch({ typography: { whiteSpace: next } });
  };

  const textWrapIsNowrap = (() => {
    if (node.nodeType !== 'heading' && node.nodeType !== 'text' && node.nodeType !== 'paragraph') return false;
    const defaultWs = node.nodeType === 'text' ? 'pre-wrap' : 'normal';
    const cur = String(deviceStyle?.typography?.whiteSpace || '').trim() || defaultWs;
    return cur === 'nowrap';
  })();

  const isCanvasTextLeaf =
    node.nodeType === 'heading' ||
    node.nodeType === 'text' ||
    node.nodeType === 'paragraph' ||
    node.nodeType === 'rich_text' ||
    ((node.nodeType === 'tabs' || node.nodeType === 'tab_hero') && isFeatureTabFieldEditing);

  const inlineRichToolbarControls = supportsFloatingTextToolbar ? (
    <div className="bld-wp-toolbar bld-wp-toolbar--floating" role="toolbar" aria-label="Text formatting">
      {node.nodeType === 'heading' ? (
        <>
          <div className="bld-wp-toolbar__group bld-wp-toolbar__group--compact">
            <label className="bld-sr-only" htmlFor={wpToolbarHeadingId}>
              Heading level
            </label>
            <select
              id={wpToolbarHeadingId}
              className="bld-wp-toolbar__select bld-wp-toolbar__select--level"
              value={headingTag}
              onChange={(e) => quickSetHeadingTag(e.target.value)}
              title="Heading level (H1–H6)"
              aria-label="Heading level"
            >
              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <span className="bld-wp-toolbar__sep" aria-hidden />
        </>
      ) : null}
      {isCanvasTextLeaf ? (
        <>
          <FontSizeStepper
            className="bld-font-size-stepper--compact"
            value={toolbarFontSizePx}
            onBeforeDelta={() => {
              const root = activeTextEditRootRef.current || syncActiveTextEditRoot();
              preserveTextEditSelectionForToolbar(root);
            }}
            onDelta={(delta) => void quickAdjustFontSize(delta)}
            onSetPx={(px) => void quickSetFontSizePx(px)}
          />
          <span className="bld-wp-toolbar__sep" aria-hidden />
        </>
      ) : null}
      <button
        type="button"
        className={`bld-wp-toolbar__icon-btn ${String(deviceStyle?.typography?.fontWeight || '400') === '700' ? 'is-pressed' : ''}`}
        title="Bold"
        aria-pressed={String(deviceStyle?.typography?.fontWeight || '400') === '700'}
        onMouseDown={(event) => {
          if (isCanvasTextLeaf) {
            event.preventDefault();
          }
        }}
        onClick={quickToggleBold}
      >
        <WpIconBold />
      </button>
      {isCanvasTextLeaf ? (
        <>
          <button
            type="button"
            className="bld-wp-toolbar__icon-btn bld-wp-toolbar__icon-btn--text"
            title="Italic"
            onMouseDown={(event) => event.preventDefault()}
            onClick={quickRichFormat('italic')}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="bld-wp-toolbar__icon-btn bld-wp-toolbar__icon-btn--text"
            title="Underline"
            onMouseDown={(event) => event.preventDefault()}
            onClick={quickRichFormat('underline')}
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className="bld-wp-toolbar__icon-btn bld-wp-toolbar__icon-btn--text"
            title="Strikethrough"
            onMouseDown={(event) => event.preventDefault()}
            onClick={quickRichFormat('strikeThrough')}
          >
            <s>S</s>
          </button>
        </>
      ) : null}
      <button
        type="button"
        className="bld-wp-toolbar__icon-btn"
        title="Insert / edit link"
        onMouseDown={(event) => {
          if (isCanvasTextLeaf) {
            event.preventDefault();
          }
        }}
        onClick={quickSetLink}
      >
        <WpIconLink />
      </button>
      <button
        type="button"
        className="bld-wp-toolbar__icon-btn bld-wp-toolbar__icon-btn--text"
        title="Clear formatting"
        onMouseDown={(event) => {
          if (isCanvasTextLeaf) {
            event.preventDefault();
          }
        }}
        onClick={() => void quickClearFormatting()}
      >
        ✕
      </button>
      <span className="bld-wp-toolbar__sep" aria-hidden />
      <div className="bld-text-align-group bld-text-align-group--wp-toolbar" role="group" aria-label="Alignment">
        {[
          { side: 'left', Icon: WpIconAlignLeft, label: 'Align left' },
          { side: 'center', Icon: WpIconAlignCenter, label: 'Align center' },
          { side: 'right', Icon: WpIconAlignRight, label: 'Align right' },
        ].map(({ side, Icon, label }) => {
          const active = String(deviceStyle?.typography?.textAlign || 'left') === side;
          return (
            <button
              key={side}
              type="button"
              className={`bld-text-align-group__btn ${active ? 'is-active' : ''}`}
              title={label}
              aria-pressed={active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => quickSetAlign(side)}
            >
              <Icon />
            </button>
          );
        })}
      </div>
      {node.nodeType === 'heading' || node.nodeType === 'text' || node.nodeType === 'paragraph' ? (
        <>
          <span className="bld-wp-toolbar__sep" aria-hidden />
          <button
            type="button"
            className={`bld-wp-toolbar__icon-btn bld-wp-toolbar__nowrap-btn ${textWrapIsNowrap ? 'is-pressed' : ''}`}
            title={textWrapIsNowrap ? 'Allow text wrap' : 'Single line (no wrap)'}
            aria-pressed={textWrapIsNowrap}
            aria-label={textWrapIsNowrap ? 'Allow text wrap' : 'Single line (no wrap)'}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void quickToggleTextWrap()}
          >
            1L
          </button>
        </>
      ) : null}
    </div>
  ) : null;

  const cycleImageFit = async () => {
    if (node.nodeType !== 'image') return;
    const order = ['cover', 'contain', 'fill'];
    const current = String(node.props?.imageFit || 'cover');
    const next = order[(order.indexOf(current) + 1 + order.length) % order.length] || 'cover';
    await updateImageProps({ imageFit: next });
  };

  const quickAlignImageBlock = async (axis, slot) => {
    if (node.nodeType !== 'image' || sectionEditLocked || !onUpdateNode) return;
    const parentFlex = getImageParentFlexDirection(tree, node.id, device, siteTheme);
    const built = buildImageAlignStylePatch(
      axis,
      slot,
      deviceStyle,
      nodeElementRef.current,
      parentFlex,
      node.props || {}
    );
    if (!built) return;

    const keepPosition = String(deviceStyle?.layout?.position || '').trim();
    const stylePatch = {
      layout: {
        ...(built.layout || {}),
        ...(keepPosition ? { position: keepPosition } : {}),
      },
      spacing: built.spacing,
      ...(built.size ? { size: built.size } : {}),
    };

    let nextStyleJson = node.style_json;
    for (const d of ['desktop', 'tablet', 'mobile']) {
      const next = applyDeviceStylePatch(
        nextStyleJson,
        d,
        withFlexWidthOverride(node.nodeType, stylePatch),
        node.nodeType,
        siteTheme
      );
      nextStyleJson = next.style_json;
    }

    await onUpdateNode({
      nodeId: node.id,
      payload: {
        style_json: nextStyleJson,
        props: {
          ...(node.props || {}),
          ...built.propsPatch,
        },
      },
    });
  };

  const quickImageFullWidth = async () => {
    if (node.nodeType !== 'image') return;
    // Apply across all devices so it stays consistent on Desktop/Tablet/Mobile.
    await updateImageProps({
      imageHeightPx: 0,
      imageFit: String(node.props?.imageFit || 'contain') || 'contain',
      imageBlockAlign: '',
      imageAlignHorizontal: '',
      imageAlignVertical: '',
    });
    await commitStylePatchAllDevices({
      layout: {
        alignSelf: 'stretch',
        maxWidth: '100%',
      },
      size: {
        width: '100%',
        height: 'auto',
      },
    });
  };

  const rowEmptyDrop = (
    <DropZone
      id={`inside-${node.id}`}
      label={`Drop inside ${node.nodeType}`}
      validationParentType={node.nodeType}
      draggingNodeType={draggingNodeType}
      showLabel={Boolean(draggingNodeType)}
      className="bld-row-placeholder__drop"
    />
  );

  const stopDragBubble = (event) => {
    event.stopPropagation();
  };

  const rowEmptyAddOnly = (
    <div className="bld-row-placeholder__actions" onClick={stopDragBubble}>
      <button
        type="button"
        className="bld-row-placeholder__btn bld-row-placeholder__btn--primary"
        title="Add element"
        aria-label="Add element"
        onClick={openAddForRow}
        disabled={isCreatingNode || isLinkedGlobal}
      >
        {isLinkedGlobal ? 'Linked section' : '+ Add Element'}
      </button>
      <button
        type="button"
        className="bld-row-placeholder__pick-hint"
        onClick={openAddForRow}
        disabled={isCreatingNode || isLinkedGlobal}
      >
        {isLinkedGlobal ? 'Edit Global or Detach to modify content' : 'Try: Heading • Image • Button'}
      </button>
    </div>
  );

  const inlineDirectionControls = null;
  const quickAddControls = null;
  const miniNodeToolbar = null;

  const isLayoutContainer = node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack';
  const parseGapPx = (gapValue) => {
    if (typeof gapValue === 'number' && Number.isFinite(gapValue)) return gapValue;
    const raw = String(gapValue ?? '').trim();
    const n = Number.parseFloat(raw.replace('px', ''));
    return Number.isFinite(n) ? n : 0;
  };
  const parsePaddingPx = (paddingValue) => {
    const raw = String(paddingValue ?? '').trim();
    if (!raw) return 0;
    const parts = raw.split(/\s+/);
    const first = parts[0] || '0';
    const n = Number.parseFloat(String(first).replace('px', ''));
    return Number.isFinite(n) ? n : 0;
  };
  const statsCounterChild =
    isStatsSectionRow(node) && Array.isArray(tree) ? findStatsCounterNode(tree, node.id) : null;
  const statsContentStackChild =
    isStatsSectionRow(node) && Array.isArray(tree) ? findStatsContentStack(tree, node.id) : null;

  const applyQuickFlexPatch = async (patch) => {
    const layoutPart = patch.layout
      ? {
          display: 'flex',
          flexWrap: 'nowrap',
          ...(patch.layout || {}),
        }
      : null;
    const spacingPart = patch.spacing && Object.keys(patch.spacing).length ? patch.spacing : null;

    if (spacingPart) {
      await commitStylePatch({ spacing: spacingPart });
    }

    if (!layoutPart) return;

    if (statsCounterChild && onUpdateNode) {
      const flexDir = String(layoutPart.flexDirection || '').trim();
      const targetsContentStack =
        statsContentStackChild &&
        (flexDir === 'column' || flexDir === 'column-reverse');
      if (targetsContentStack) {
        const payload = buildStatsContentStackLayoutUpdate(
          statsContentStackChild,
          device,
          layoutPart,
          siteTheme
        );
        await onUpdateNode({ nodeId: statsContentStackChild.id, payload });
        return;
      }
      const payload = buildStatsCounterLayoutUpdate(statsCounterChild, device, layoutPart, siteTheme);
      await onUpdateNode({ nodeId: statsCounterChild.id, payload });
      return;
    }

    await commitStylePatch({ layout: layoutPart });
  };
  const quickSetDirection = async (direction) => {
    await applyQuickFlexPatch({
      layout: {
        flexDirection: direction,
        justifyContent: deviceStyle?.layout?.justifyContent || 'flex-start',
        alignItems: deviceStyle?.layout?.alignItems || 'stretch',
      },
    });
  };
  const quickCenter = async () => {
    await applyQuickFlexPatch({
      layout: { justifyContent: 'center', alignItems: 'center' },
    });
  };
  const quickSpaceBetween = async () => {
    await applyQuickFlexPatch({
      layout: { justifyContent: 'space-between', alignItems: 'center' },
    });
  };
  const quickGapDelta = async (delta) => {
    const currentGap = parseGapPx(deviceStyle?.layout?.gap);
    const nextGap = Math.max(0, Math.round(currentGap + delta));
    await applyQuickFlexPatch({
      layout: { gap: nextGap },
    });
  };
  const quickSetJustify = async (justify) => {
    await applyQuickFlexPatch({
      layout: {
        justifyContent: justify,
        alignItems: deviceStyle?.layout?.alignItems || 'center',
      },
    });
  };
  const quickPaddingDelta = async (delta) => {
    const currentPad = parsePaddingPx(deviceStyle?.spacing?.padding);
    const nextPad = Math.max(0, Math.round(currentPad + delta));
    await applyQuickFlexPatch({
      spacing: { padding: `${nextPad}px` },
    });
  };

  const quickToggleFlexWrap = async () => {
    const cur = String(deviceStyle?.layout?.flexWrap || 'nowrap').trim() || 'nowrap';
    const next = cur === 'nowrap' ? 'wrap' : 'nowrap';
    await applyQuickFlexPatch({
      layout: {
        flexDirection: deviceStyle?.layout?.flexDirection || 'row',
        flexWrap: next,
        justifyContent: deviceStyle?.layout?.justifyContent || 'flex-start',
        alignItems: deviceStyle?.layout?.alignItems || 'stretch',
      },
    });
  };

  const flexWrapIsNowrap = String(deviceStyle?.layout?.flexWrap || 'nowrap').trim() !== 'wrap';

  /** Main axis from merged style (row = horizontal children, column = vertical). */
  const flexDirForFlip = String(deviceStyle?.layout?.flexDirection || 'row').trim();
  const isColumnMainAxis = flexDirForFlip === 'column' || flexDirForFlip === 'column-reverse';
  const isRowMainAxis = !isColumnMainAxis;

  /** Swap horizontal order: two-column rows use sibling reorder (no row-reverse → avoids clip / “lost” media). */
  const quickFlipHorizontal = async () => {
    if (!isRowMainAxis) return;
    const kids = Array.isArray(node.children) ? node.children : [];
    const swapTwoColumns =
      typeof onReorderNode === 'function' &&
      node.nodeType === 'row' &&
      kids.length === 2 &&
      kids[0]?.nodeType === 'column' &&
      kids[1]?.nodeType === 'column';
    if (swapTwoColumns) {
      await onReorderNode({
        nodeId: kids[1].id,
        newParentId: node.id,
        newIndex: 0,
      });
      return;
    }
    const nextDir = flexDirForFlip === 'row-reverse' ? 'row' : 'row-reverse';
    await applyQuickFlexPatch({
      layout: {
        flexDirection: nextDir,
        justifyContent: deviceStyle?.layout?.justifyContent || 'flex-start',
        alignItems: deviceStyle?.layout?.alignItems || 'stretch',
      },
    });
  };

  /** Inner stack under a row/column (e.g. stats heading + counter) for vertical reorder from section chrome. */
  const resolveVerticalFlipTarget = () => {
    if (isStatsSectionRow(node) && Array.isArray(tree)) {
      const statsStack = findStatsContentStack(tree, node.id);
      if (statsStack && (statsStack.children?.length || 0) >= 2) return statsStack;
    }
    if (isColumnMainAxis) return node;
    const kids = Array.isArray(node.children) ? node.children : [];
    if (node.nodeType === 'row' && kids.length === 1 && kids[0]?.nodeType === 'column') {
      const colKids = kids[0].children || [];
      const stack = colKids.find((c) => c.nodeType === 'stack' && (c.children?.length || 0) >= 2);
      if (stack) return stack;
    }
    if (node.nodeType === 'column') {
      const stack = kids.find((c) => c.nodeType === 'stack' && (c.children?.length || 0) >= 2);
      if (stack) return stack;
    }
    if (node.nodeType === 'stack' && (kids.length || 0) >= 2) return node;
    return null;
  };

  const verticalFlipTarget = resolveVerticalFlipTarget();

  const ensureVerticalStackColumn = async (stackNode) => {
    if (!stackNode?.id || !onUpdateNode) return;
    const columnPayload = ensureStatsContentStackColumnPayload(stackNode, device, siteTheme);
    if (columnPayload) {
      await onUpdateNode({ nodeId: stackNode.id, payload: columnPayload });
      return;
    }
    const stackDir = String(
      getDeviceStyle(stackNode.style_json, device)?.layout?.flexDirection || 'column'
    ).trim();
    if (stackDir === 'row' || stackDir === 'row-reverse') {
      const payload = buildStatsContentStackLayoutUpdate(
        stackNode,
        device,
        {
          flexDirection: 'column',
          alignItems: getDeviceStyle(stackNode.style_json, device)?.layout?.alignItems || 'stretch',
        },
        siteTheme
      );
      await onUpdateNode({ nodeId: stackNode.id, payload });
    }
  };

  /** Swap vertical order: exactly two children → reorder (safe); else column ↔ column-reverse. */
  const quickFlipVertical = async () => {
    const targetNode = verticalFlipTarget;
    if (!targetNode) return;
    if (targetNode.nodeType === 'stack') {
      await ensureVerticalStackColumn(targetNode);
    }
    const kids = Array.isArray(targetNode.children) ? targetNode.children : [];
    const swapTwoChildren = typeof onReorderNode === 'function' && kids.length === 2;
    if (swapTwoChildren) {
      await onReorderNode({
        nodeId: kids[1].id,
        newParentId: targetNode.id,
        newIndex: 0,
      });
      return;
    }
    if (targetNode.id !== node.id) return;
    const targetDir = String(
      targetNode.id === node.id
        ? flexDirForFlip
        : getDeviceStyle(targetNode.style_json, device)?.layout?.flexDirection || 'column'
    ).trim();
    const nextDir = targetDir === 'column-reverse' ? 'column' : 'column-reverse';
    if (targetNode.id === node.id) {
      await applyQuickFlexPatch({
        layout: {
          flexDirection: nextDir,
          justifyContent: deviceStyle?.layout?.justifyContent || 'flex-start',
          alignItems: deviceStyle?.layout?.alignItems || 'stretch',
        },
      });
      return;
    }
    if (onUpdateNode) {
      const payload = buildStatsContentStackLayoutUpdate(
        targetNode,
        device,
        {
          flexDirection: nextDir,
          justifyContent:
            getDeviceStyle(targetNode.style_json, device)?.layout?.justifyContent || 'flex-start',
          alignItems:
            getDeviceStyle(targetNode.style_json, device)?.layout?.alignItems || 'stretch',
        },
        siteTheme
      );
      await onUpdateNode({ nodeId: targetNode.id, payload });
    }
  };

  const quickLayoutControls =
    isLayoutContainer && isSelected && !sectionEditLocked ? (
      <div
        className="bld-quick-layout-controls"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickSetDirection('row')} disabled={isSavingNode}>
          Row
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickSetDirection('column')} disabled={isSavingNode}>
          Column
        </button>
        {isRowMainAxis ? (
          <button
            type="button"
            className="bld-quick-layout-controls__btn"
            onClick={() => void quickFlipHorizontal()}
            disabled={isSavingNode}
            title="Left ↔ Right (and Right ↔ Left): swaps the two columns in a section when possible; otherwise toggles row / row-reverse."
          >
            L↔R
          </button>
        ) : null}
        {verticalFlipTarget ? (
          <button
            type="button"
            className="bld-quick-layout-controls__btn"
            onClick={() => void quickFlipVertical()}
            disabled={isSavingNode}
            title="Top ↔ Bottom (and Bottom ↔ Top): swaps two stacked children when possible; otherwise toggles column / column-reverse."
          >
            T↔B
          </button>
        ) : null}
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickSetJustify('flex-start')} disabled={isSavingNode}>
          Left
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickSetJustify('center')} disabled={isSavingNode}>
          Align
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickSetJustify('flex-end')} disabled={isSavingNode}>
          Right
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={quickCenter} disabled={isSavingNode}>
          Center
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={quickSpaceBetween} disabled={isSavingNode}>
          Space Between
        </button>
        <button
          type="button"
          className={`bld-quick-layout-controls__btn ${flexWrapIsNowrap ? 'is-active' : ''}`}
          onClick={() => void quickToggleFlexWrap()}
          disabled={isSavingNode}
          title="Keep children on one row (flex-wrap: nowrap). Off = allow wrapping to next line."
          aria-pressed={flexWrapIsNowrap}
        >
          No wrap
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickGapDelta(4)} disabled={isSavingNode}>
          Gap +
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickGapDelta(-4)} disabled={isSavingNode}>
          Gap −
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickPaddingDelta(4)} disabled={isSavingNode}>
          Pad +
        </button>
        <button type="button" className="bld-quick-layout-controls__btn" onClick={() => quickPaddingDelta(-4)} disabled={isSavingNode}>
          Pad −
        </button>
      </div>
    ) : null;

  const siblingReorderCtx = getSiblingContext(tree, node.id);
  const siblingReorderParent =
    siblingReorderCtx?.parentId != null ? findNodeInTree(tree, siblingReorderCtx.parentId) : null;
  const siblingReorderCount = siblingReorderCtx?.siblingIds?.length || 0;
  const canSiblingReorder =
    !isLayoutContainer &&
    isSelected &&
    !sectionEditLocked &&
    typeof onReorderNode === 'function' &&
    siblingReorderCount > 1 &&
    siblingReorderParent &&
    ['row', 'column', 'stack'].includes(siblingReorderParent.nodeType);
  const moveUpAmongSiblings = canSiblingReorder ? computeMoveUp(tree, node.id) : null;
  const moveDownAmongSiblings = canSiblingReorder ? computeMoveDown(tree, node.id) : null;
  const runSiblingReorder = async (patch) => {
    if (!patch || !onReorderNode) return;
    if (siblingReorderParent?.nodeType === 'stack') {
      await ensureVerticalStackColumn(siblingReorderParent);
    }
    await onReorderNode(patch);
  };

  const quickSiblingReorderControls = canSiblingReorder ? (
    <div
      className="bld-quick-layout-controls bld-quick-layout-controls--sibling"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="bld-quick-layout-controls__btn"
        onClick={() => moveUpAmongSiblings && void runSiblingReorder(moveUpAmongSiblings)}
        disabled={isSavingNode || isReorderingNode || !moveUpAmongSiblings}
        title="Move one step up among siblings"
      >
        ↑ Top
      </button>
      <button
        type="button"
        className="bld-quick-layout-controls__btn"
        onClick={() => moveDownAmongSiblings && void runSiblingReorder(moveDownAmongSiblings)}
        disabled={isSavingNode || isReorderingNode || !moveDownAmongSiblings}
        title="Move one step down among siblings"
      >
        ↓ Bottom
      </button>
    </div>
  ) : null;

  const quickChromeLayoutControls = quickLayoutControls || quickSiblingReorderControls;

  const renderFeatureTabPanel = featureTabsElementsMode
    ? (tabsNode, activeTabId) => (
        <FeatureTabPanelChildren
          panelStack={findFeatureTabPanelStack(tabsNode, activeTabId)}
          nodeRendererProps={{
            tree,
            selectedNodeId,
            onSelectNode,
            draggingNodeType,
            device,
            previewCssByNodeId,
            previewIxByNodeId,
            onSetPreviewCssForNode,
            formPreviewByNodeId,
            activeSpacingEdit,
            onReportOverflow,
            onDeleteNode,
            onRequestNavigator,
            onInsertStarterTemplate,
            onInsertHeaderTemplate,
            onSetContainerDirection,
            onUpdateNode,
            onCreateNode,
            onQuickAddNode,
            onDuplicateNode,
            onReorderNode,
            isReorderingNode,
            isCreatingNode,
            isSavingNode,
            isDeletingNode,
            deletingNodeId,
            onOpenWidgetPicker,
            onOpenSectionInsert,
            hoveredNodeId,
            onHoverNode,
            onSaveGlobalSection,
            onConvertToGlobalComponent,
            onDetachFromGlobalComponent,
            onEditGlobalComponent,
            onAlignMenuRightInRow,
            onUploadLogoInRow,
            onStretchSectionFullWidth,
            onStretchSectionFromSelection,
            onAlignMenuRightFromSelection,
            isFreeMode,
            onCopyNodeId,
            flashPasteNodeId,
            flashReorderNodeId,
            onAddSectionPreviewEnter,
            onAddSectionPreviewLeave,
            onFreeMoveBrush,
            freeMoveBrushActive,
            cmsPreviewByCollection,
            insideSiteHeaderRow: childInsideSiteHeaderRow,
            builderPageId,
            builderProjectId,
          }}
        />
      )
    : undefined;

  const isRowContainer = node.nodeType === 'row';
  const canShowGapHandles =
    isLayoutContainer && isSelected && !isFreeMode && !sectionEditLocked && (node.children?.length || 0) > 1;
  const canShowColumnResize =
    isRowContainer && isSelected && !isFreeMode && !sectionEditLocked && (node.children?.filter((c) => c.nodeType === 'column')?.length || 0) > 1;

  const spacingEditForThisNode = activeSpacingEdit && activeSpacingEdit.nodeId === node.id ? activeSpacingEdit : null;

  const isHoveredHere = hoveredNodeId === node.id;

  // Local overflow measurement (selected/hovered only, debounced).
  useEffect(() => {
    const el = nodeElementRef.current;
    if (!el) return undefined;
    if (!isNodeActive && !isHoveredHere) return undefined;

    let raf = 0;
    let t = 0;
    let ro = null;

    const measure = () => {
      const cs = window.getComputedStyle(el);
      const isFlex = String(cs.display || '').includes('flex');
      const flexWrap = String(cs.flexWrap || 'nowrap');
      const horizontal = el.scrollWidth > el.clientWidth + 1;
      const vertical = el.scrollHeight > el.clientHeight + 1;

      let flexWrapUnexpected = false;
      if (isFlex && flexWrap === 'nowrap') {
        const kidsWrap = el.querySelector(':scope > .bld-node-children');
        const kids = kidsWrap ? Array.from(kidsWrap.children || []) : [];
        if (kids.length >= 2) {
          const tops = kids.map((k) => k.getBoundingClientRect().top);
          const minTop = Math.min(...tops);
          const maxTop = Math.max(...tops);
          flexWrapUnexpected = maxTop - minTop > 3;
        }
      }

      onReportOverflow?.(node.id, { horizontal, vertical, flexWrapUnexpected, ts: Date.now() });
      setOverflowLocal({ horizontal, vertical, flexWrapUnexpected });
    };

    const schedule = () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(measure);
      }, 120);
    };

    schedule();
    ro = new ResizeObserver(() => schedule());
    ro.observe(el);
    window.addEventListener('scroll', schedule, true);

    return () => {
      if (t) window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('scroll', schedule, true);
    };
  }, [isNodeActive, isHoveredHere, node.id, onReportOverflow]);

  const supportsInlineContentPanel = false;
  const inlineContentPanel =
    isSelected && supportsInlineContentPanel ? (
      <form className="bld-inline-content-panel" onSubmit={handleInlinePanelSave} onClick={(e) => e.stopPropagation()}>
        {node.nodeType === 'heading' ||
        node.nodeType === 'text' ||
        node.nodeType === 'paragraph' ||
        node.nodeType === 'button' ? (
          <textarea
            className="bld-inline-content-panel__textarea"
            rows={2}
            value={inlinePanelText}
            onChange={(event) => setInlinePanelText(event.target.value)}
            placeholder="Edit text here"
          />
        ) : null}
        {node.nodeType === 'image' ? (
          <>
            <input
              className="bld-inline-content-panel__input"
              value={inlinePanelImageSrc}
              onChange={(event) => setInlinePanelImageSrc(event.target.value)}
              placeholder="Image URL / Data URL"
            />
            <input
              className="bld-inline-content-panel__input"
              value={inlinePanelImageAlt}
              onChange={(event) => setInlinePanelImageAlt(event.target.value)}
              placeholder="Image alt text"
            />
            <input type="file" className="bld-inline-content-panel__input" accept="image/*" onChange={handleInlineImagePick} />
          </>
        ) : null}
        {node.nodeType === 'menu' ? (
          <textarea
            className="bld-inline-content-panel__textarea"
            rows={4}
            value={inlinePanelMenuItems}
            onChange={(event) => setInlinePanelMenuItems(event.target.value)}
            placeholder='[{"label":"Home","to":"/"}]'
          />
        ) : null}
        {inlinePanelError ? <p className="bld-inline-content-panel__error">{inlinePanelError}</p> : null}
        <button type="submit" className="bld-inline-content-panel__save" disabled={isSavingNode || isReadingImage || sectionEditLocked}>
          {isSavingNode ? 'Saving...' : isReadingImage ? 'Reading image...' : 'Apply'}
        </button>
      </form>
    ) : null;

  const showRowChrome = isNodeActive || isHoveredHere;
  const showFloatingToolbar =
    supportsDirectManipulation && !dragLocked && (isNodeActive || isHoveredHere);
  const needsShellChromeOverlay =
    (showFloatingToolbar || quickChromeLayoutControls != null) && !showImageMediaToolbar;
  const layerBadgeSuppressed =
    (isRow && showRowChrome) ||
    ((node.nodeType === 'column' || node.nodeType === 'stack') && needsShellChromeOverlay);

  const RowSurfaceTag =
    isRow && rowSemanticTag && ['main', 'header', 'footer', 'section'].includes(rowSemanticTag)
      ? rowSemanticTag
      : 'div';

  const rowMoreMenuItems = [];
  if (!sectionEditLocked) {
    if (!isRowEmpty) {
      rowMoreMenuItems.push({
        key: 'pick',
        label: 'Add element…',
        onSelect: openAddForRow,
        useMouseDown: false,
        disabled: isCreatingNode || isLinkedGlobal,
      });
    }
    rowMoreMenuItems.push({
      key: 'section',
      label: 'Add section after',
      onSelect: openAddSectionAfterRow,
      useMouseDown: false,
      disabled: !Number.isInteger(rowIndex) || isCreatingNode,
    });
    if (onReorderNode && parentNodeType === null && Number.isInteger(rowIndex)) {
      rowMoreMenuItems.push({
        key: 'move-up',
        label: 'Move section up',
        onSelect: () => onReorderNode({ nodeId: node.id, newParentId: null, newIndex: Math.max(0, rowIndex - 1) }),
        useMouseDown: false,
        disabled: isReorderingNode || rowIndex === 0,
      });
      rowMoreMenuItems.push({
        key: 'move-down',
        label: 'Move section down',
        onSelect: () => onReorderNode({ nodeId: node.id, newParentId: null, newIndex: rowIndex + 1 }),
        useMouseDown: false,
        disabled:
          isReorderingNode ||
          (Number.isFinite(Number(rowSiblingsCount)) ? rowIndex >= Number(rowSiblingsCount) - 1 : false),
      });
    }
    if (onSaveGlobalSection && parentNodeType === null) {
      rowMoreMenuItems.push({
        key: 'global-header',
        label: 'Save as global header',
        onSelect: () => onSaveGlobalSection({ rowId: node.id, role: 'header' }),
        useMouseDown: false,
        disabled: isSavingNode || isCreatingNode,
      });
      rowMoreMenuItems.push({
        key: 'global-footer',
        label: 'Save as global footer',
        onSelect: () => onSaveGlobalSection({ rowId: node.id, role: 'footer' }),
        useMouseDown: false,
        disabled: isSavingNode || isCreatingNode,
      });
    }
    if (isRow && parentNodeType === null && !isLinkedGlobal && onConvertToGlobalComponent) {
      rowMoreMenuItems.push({
        key: 'convert-global',
        label: 'Convert to Global Component',
        onSelect: () => onConvertToGlobalComponent?.(node.id),
        useMouseDown: false,
        disabled: isSavingNode || isCreatingNode,
      });
    }
    if (isLinkedGlobal && onEditGlobalComponent) {
      rowMoreMenuItems.push({
        key: 'edit-global',
        label: 'Edit Global Component',
        onSelect: () => onEditGlobalComponent?.(linkedMeta.globalComponentId),
        useMouseDown: false,
        disabled: isSavingNode || isCreatingNode,
      });
    }
    if (isLinkedGlobal && onDetachFromGlobalComponent) {
      rowMoreMenuItems.push({
        key: 'detach-global',
        label: 'Detach from Global',
        onSelect: () => onDetachFromGlobalComponent?.(node.id),
        useMouseDown: false,
        disabled: isSavingNode || isCreatingNode,
      });
    }
    if (isFreeMode) {
      rowMoreMenuItems.push({
        key: 'free',
        label: 'Free move',
        onSelect: startMoveWithMouse,
        useMouseDown: true,
        disabled: isSavingNode || isDragging || Boolean(draggingNodeType),
      });
    }
  }
  if (onCopyNodeId) {
    rowMoreMenuItems.push({
      key: 'copy',
      label: 'Copy',
      onSelect: () => onCopyNodeId(node.id),
      useMouseDown: false,
    });
  }

  const shellMoreMenuItems = [];
  if (!sectionEditLocked) {
    if (isContainer) {
      shellMoreMenuItems.push({
        key: 'pick',
        label: 'Add element…',
        onSelect: openAddForNode,
        useMouseDown: false,
        disabled: isCreatingNode,
      });
    }
    if (isFreeMode) {
      shellMoreMenuItems.push({
        key: 'free',
        label: 'Free move',
        onSelect: startMoveWithMouse,
        useMouseDown: true,
        disabled: isSavingNode || isDragging || Boolean(draggingNodeType),
      });
    }
  }
  if (onCopyNodeId) {
    shellMoreMenuItems.push({
      key: 'copy',
      label: 'Copy',
      onSelect: () => onCopyNodeId(node.id),
      useMouseDown: false,
    });
  }

  return (
    <>
      <DropZone
        id={`before-${node.id}`}
        label="Drop here (reorder)"
        validationParentType={parentNodeType ?? null}
        draggingNodeType={draggingNodeType}
        showLabel={Boolean(draggingNodeType)}
      />
      {node.nodeType === 'row' && showSectionAddButtonBefore ? (
        <div className="bld-add-section-inline">
          <button
            type="button"
            className="bld-add-section-inline__btn"
            onMouseEnter={(event) => {
              if (!Number.isInteger(rowIndex)) return;
              onAddSectionPreviewEnter?.(event.currentTarget, rowIndex);
            }}
            onMouseLeave={() => onAddSectionPreviewLeave?.()}
            onClick={(event) => {
              event.stopPropagation();
              if (!Number.isInteger(rowIndex)) return;
              onOpenSectionInsert?.(rowIndex);
            }}
            disabled={isCreatingNode}
          >
            + Add Section
          </button>
        </div>
      ) : null}
      {isRow ? (
        <RowSurfaceTag
          ref={(element) => {
            nodeElementRef.current = element;
            setDraggableRef(element);
          }}
          {...attributes}
          data-bld-node={node.id}
          {...liveRootGapAfterAttrs}
          {...liveRootGapBeforeAttrs}
          {...stripAttrs}
          {...landmarkContentAttrs}
          {...sectionContentAttrs}
          {...rowPaddingDefinedAttrs}
          {...sectionToneAttrs}
          {...sectionTemplateDataAttrsForRow(node)}
          {...sectionColumnAttrs}
          {...(node.props?.meta?.isHeader ||
          node.props?.meta?.role === 'header' ||
          isSiteHeaderRowForCompact(node)
            ? {
                'data-site-header': 'true',
                ...(node.props?.meta?.headerAlign
                  ? { 'data-header-align': String(node.props.meta.headerAlign) }
                  : {}),
                'data-header-layout': String(
                  node.props?.meta?.headerLayout || resolveHeaderLayoutMode(node.props?.meta || {})
                ),
                ...(rowHeaderBehavior ? headerBehaviorDataAttrs(rowHeaderBehavior) : {}),
                ...rowHeaderRevealExtras.attrs,
              }
            : {})}
          {...(rowSemanticTag === 'footer' || node.props?.meta?.isFooter || node.props?.meta?.role === 'footer'
            ? { 'data-site-footer': 'true' }
            : {})}
          className={`${classNames} ${interactionPresentationClass(deviceStyleForIx, animationPresets)} bld-node ${isSelected ? 'bld-selected' : ''}`.trim()}
          style={rowInlineStyle}
          onClick={handleSelect}
          onClickCapture={handleSelectCapture}
          onPointerDownCapture={
            supportsFloatingTextToolbar
              ? handleTextEditPointerDownCapture
              : supportsStatsInlineEdit
                ? handleStatsFieldPointerDownCapture
                : isTabHeroSectionRow
                  ? handleNestedCompoundFieldPointerDownCapture
                  : undefined
          }
          onMouseDown={maybeStartDirectMove}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => onHoverNode?.(node.id)}
          onMouseLeave={() => {
            if (hoveredNodeId === node.id) onHoverNode?.(null);
          }}
          onContextMenu={handleContextMenu}
          role="group"
          tabIndex={0}
          aria-label={`${node.displayName || 'Section'}, ${rowRole || 'row'}`}
        >
          <span
            className={`bld-layer-type-badge bld-layer-type-badge--section${layerBadgeSuppressed ? ' bld-layer-type-badge--hidden' : ''}`.trim()}
            aria-hidden
          >
            Section
          </span>
          {showRowChrome ? (
            <div className="bld-node__chrome bld-node__chrome--row bld-node__chrome--overlay">
              <div className="bld-node__chrome-top">
                <div className="bld-node__label is-layout-label">
                  Section{' '}
                  <span className="bld-node__type">{node.displayName || node.nodeType}</span>
                  {rowRole ? <span className="bld-node__section-tag">{rowRole}</span> : null}
                  {isLinkedGlobal ? (
                    <span
                      className="bld-node__section-tag"
                      title={
                        linkedMeta?.globalComponentName
                          ? `Linked: ${linkedMeta.globalComponentName}`
                          : 'Linked global component'
                      }
                    >
                      Linked{linkedMeta?.globalComponentName ? `: ${linkedMeta.globalComponentName}` : ''}
                    </span>
                  ) : null}
                  {overflowLocal?.horizontal || overflowLocal?.vertical || overflowLocal?.flexWrapUnexpected ? (
                    <span className="bld-node__overflow" title="Layout overflow detected" aria-label="Overflow">
                      Overflow
                    </span>
                  ) : null}
                </div>
                <CanvasFloatingToolbar
                  dragListeners={listeners}
                  dragDisabled={sectionEditLocked}
                  onDuplicate={duplicateThisNode}
                  onDelete={deleteThisNode}
                  duplicateDisabled={isSavingNode || sectionEditLocked}
                  deleteDisabled={isDeletingNode || sectionEditLocked}
                  menuItems={rowMoreMenuItems}
                />
              </div>
              {quickChromeLayoutControls ? (
                <div className="bld-node__chrome-layout">{quickChromeLayoutControls}</div>
              ) : null}
            </div>
          ) : null}
          {inlineDirectionControls}
          {quickAddControls}
          {inlineContentPanel}
          {isRowEmpty ? (
            <div
              className={`bld-row-placeholder ${isSelected || isHoveredHere ? 'bld-row-placeholder--selected' : ''}`.trim()}
            >
              {rowEmptyDrop}
              {showRowChrome ? rowEmptyAddOnly : null}
              {!draggingNodeType && !isDragging && !freeMoveBrushActive ? (
                <div className="bld-row-smart-suggestions" onPointerDown={(e) => e.stopPropagation()}>
                  <span className="bld-row-smart-suggestions__label">Start here</span>
                  <button
                    type="button"
                    className="bld-row-smart-suggestions__btn"
                    disabled={isCreatingNode || isSavingNode || sectionEditLocked}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isCreatingNode || isSavingNode || sectionEditLocked) return;
                      onSelectNode(node.id);
                      await onInsertStarterTemplate?.({ targetRowId: node.id });
                    }}
                  >
                    Hero section
                  </button>
                  <button
                    type="button"
                    className="bld-row-smart-suggestions__btn"
                    disabled={isCreatingNode || isSavingNode || sectionEditLocked}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isCreatingNode || isSavingNode || sectionEditLocked) return;
                      onSelectNode(node.id);
                      if (onQuickAddNode) {
                        await onQuickAddNode({ targetNodeId: node.id, nodeType: 'column' });
                        await onQuickAddNode({ targetNodeId: node.id, nodeType: 'column' });
                      } else {
                        await onCreateNode?.({ nodeType: 'column', parentNodeId: node.id });
                        await onCreateNode?.({ nodeType: 'column', parentNodeId: node.id });
                      }
                    }}
                  >
                    Two columns
                  </button>
                </div>
              ) : null}
              <p className="bld-row-placeholder__hint">
                Drag blocks from the library, or open the row menu to add a section or move freely.
              </p>
            </div>
          ) : (
            <>
              <DropZone
                id={`inside-${node.id}`}
                label={`Drop inside ${node.nodeType}`}
                validationParentType={node.nodeType}
                draggingNodeType={draggingNodeType}
                showLabel={Boolean(draggingNodeType)}
              />
              <div className="bld-node-children">
                {node.children.map((childNode) => (
                  <NodeRenderer
                    key={childNode.id}
                    node={childNode}
                    cmsContext={
                      childCmsContext?.item
                        ? childCmsContext
                        : repeatEnabled && repeatCollectionSlug && cmsPreviewByCollection?.[repeatCollectionSlug]?.item
                          ? {
                              item: cmsPreviewByCollection[repeatCollectionSlug].item,
                              sys: { slug: cmsPreviewByCollection[repeatCollectionSlug].item?.slug || '', collection: repeatCollectionSlug },
                            }
                          : childCmsContext
                    }
                    rowIndex={null}
                    rowSemanticTag={null}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    parentNodeType={node.nodeType}
                    draggingNodeType={draggingNodeType}
                    device={device}
                    tree={tree}
                    onDeleteNode={onDeleteNode}
                    onRequestNavigator={onRequestNavigator}
                    onInsertStarterTemplate={onInsertStarterTemplate}
                    onInsertHeaderTemplate={onInsertHeaderTemplate}
                    onSetContainerDirection={onSetContainerDirection}
                    onUpdateNode={onUpdateNode}
                    onCreateNode={onCreateNode}
                    onQuickAddNode={onQuickAddNode}
                    onDuplicateNode={onDuplicateNode}
                      onReorderNode={onReorderNode}
                      isReorderingNode={isReorderingNode}
                    isCreatingNode={isCreatingNode}
                    isSavingNode={isSavingNode}
                    isDeletingNode={isDeletingNode}
                    deletingNodeId={deletingNodeId}
                    onOpenWidgetPicker={onOpenWidgetPicker}
                    onOpenSectionInsert={onOpenSectionInsert}
                    hoveredNodeId={hoveredNodeId}
                    onHoverNode={onHoverNode}
                    onSaveGlobalSection={onSaveGlobalSection}
                    onConvertToGlobalComponent={onConvertToGlobalComponent}
                    onDetachFromGlobalComponent={onDetachFromGlobalComponent}
                    onEditGlobalComponent={onEditGlobalComponent}
                    onAlignMenuRightInRow={onAlignMenuRightInRow}
                    onUploadLogoInRow={onUploadLogoInRow}
                    onStretchSectionFullWidth={onStretchSectionFullWidth}
                    onStretchSectionFromSelection={onStretchSectionFromSelection}
                    onAlignMenuRightFromSelection={onAlignMenuRightFromSelection}
                    isFreeMode={isFreeMode}
                    onCopyNodeId={onCopyNodeId}
                    flashPasteNodeId={flashPasteNodeId}
                    flashReorderNodeId={flashReorderNodeId}
                    onAddSectionPreviewEnter={onAddSectionPreviewEnter}
                    onAddSectionPreviewLeave={onAddSectionPreviewLeave}
                    onFreeMoveBrush={onFreeMoveBrush}
                    freeMoveBrushActive={freeMoveBrushActive}
                    cmsPreviewByCollection={cmsPreviewByCollection}
                    insideSiteHeaderRow={childInsideSiteHeaderRow}
                    builderPageId={builderPageId}
                    builderProjectId={builderProjectId}
                    formPreviewByNodeId={formPreviewByNodeId}
                    sectionLayout={childSectionLayout}
                    sectionTemplateId={childSectionTemplateId}
                    insideSectionItemsHost={childInsideSectionItemsHost}
                    parentSectionLayout={childParentSectionLayout}
                  />
                ))}
              </div>
            </>
          )}
        </RowSurfaceTag>
      ) : (
        <div
          ref={(element) => {
            nodeElementRef.current = element;
            setDraggableRef(element);
          }}
          {...attributes}
          data-bld-node={node.id}
          {...sectionToneAttrs}
          {...builderSectionTemplateAttrs}
          {...sectionLayoutAttr}
          {...sectionColumnAttrs}
          {...tplRoleAttrs}
          {...(isImageLeaf && (imageAlignAxes.horizontal || imageAlignAxes.vertical)
            ? {
                ...(imageAlignAxes.horizontal
                  ? { 'data-image-align-h': imageAlignAxes.horizontal }
                  : {}),
                ...(imageAlignAxes.vertical
                  ? { 'data-image-align-v': imageAlignAxes.vertical }
                  : {}),
              }
            : {})}
          className={`${classNames} ${shellCarriesLeafLayout ? interactionPresentationClass(deviceStyleForIx, animationPresets) : leafInteractionShell.ixClass} bld-node bld-node__shell ${isSelected ? 'bld-selected' : ''}`.trim()}
          style={
            isImageLeaf
              ? sanitizeInlineMarginCss({
                  ...(imageShellStyle || {}),
                  ...(leafInteractionShell.ixStyle || {}),
                })
              : leafWidgetShellStyle
          }
          onClick={handleSelect}
          onClickCapture={handleSelectCapture}
          onPointerDownCapture={
            supportsTabHeroCompoundEdit
              ? handleTabHeroFieldPointerDownCapture
              : supportsFloatingTextToolbar
                ? handleTextEditPointerDownCapture
                : supportsStatsInlineEdit
                  ? handleStatsFieldPointerDownCapture
                  : undefined
          }
          onMouseDown={maybeStartDirectMove}
          onKeyDown={handleKeyDown}
          role={
            isDividerLeaf
              ? 'separator'
              : node.nodeType === 'tabs' ||
                  node.nodeType === 'accordion' ||
                  node.nodeType === 'stats_counter' ||
                  node.nodeType === 'tab_hero' ||
                  node.nodeType === 'carousel'
                ? 'group'
                : 'button'
          }
          aria-orientation={
            isDividerLeaf
              ? node.props?.orientation === 'vertical'
                ? 'vertical'
                : 'horizontal'
              : undefined
          }
          tabIndex={0}
          onMouseEnter={() => onHoverNode?.(node.id)}
          onMouseLeave={() => {
            if (hoveredNodeId === node.id) onHoverNode?.(null);
          }}
          onContextMenu={handleContextMenu}
        >
            {isContainer ? (
              <span
                className={`bld-layer-type-badge${node.nodeType === 'column' ? ' bld-layer-type-badge--column' : ''}${node.nodeType === 'stack' ? ' bld-layer-type-badge--stack' : ''}${layerBadgeSuppressed ? ' bld-layer-type-badge--hidden' : ''}`.trim()}
                aria-hidden
              >
                {node.nodeType === 'column' ? 'Column' : node.nodeType === 'stack' ? 'Stack' : 'Section'}
              </span>
            ) : null}
            {needsShellChromeOverlay ? (
              <div
                className={`bld-node__chrome bld-node__chrome--overlay${isContainer ? ' bld-node__chrome--nest' : ''}`.trim()}
              >
                <div className="bld-node__chrome-top">
                  {isContainer ? (
                    <div className={`bld-node__label ${isContainer ? 'is-layout-label' : ''}`}>
                      {node.nodeType === 'column'
                        ? 'Column'
                        : node.nodeType === 'stack'
                          ? 'Stack'
                          : node.nodeType === 'menu'
                            ? 'Menu'
                            : node.nodeType === 'row'
                              ? 'Section'
                              : 'Widget'}{' '}
                      <span className="bld-node__type">{node.displayName || node.nodeType}</span>
                      {overflowLocal?.horizontal || overflowLocal?.vertical || overflowLocal?.flexWrapUnexpected ? (
                        <span className="bld-node__overflow" title="Layout overflow detected" aria-label="Overflow">
                          Overflow
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="bld-node__chrome-spacer" aria-hidden />
                  )}
                  {showFloatingToolbar ? (
                    <CanvasFloatingToolbar
                      dragListeners={listeners}
                      dragDisabled={sectionEditLocked}
                      onDuplicate={duplicateThisNode}
                      onDelete={deleteThisNode}
                      duplicateDisabled={isSavingNode || sectionEditLocked}
                      deleteDisabled={isDeletingNode || sectionEditLocked}
                      menuItems={shellMoreMenuItems}
                    />
                  ) : null}
                </div>
                {quickChromeLayoutControls ? (
                  <div className="bld-node__chrome-layout">{quickChromeLayoutControls}</div>
                ) : null}
              </div>
            ) : null}
            {miniNodeToolbar}
            {inlineDirectionControls}
            {quickAddControls}
            {inlineContentPanel}
            {spacingEditForThisNode ? (
              <SpacingGuidesOverlay
                targetElement={nodeElementRef.current}
                edit={spacingEditForThisNode}
              />
            ) : null}
            {canShowGapHandles ? (
              <GapHandlesOverlay
                containerNode={node}
                containerElement={nodeElementRef.current}
                deviceStyle={deviceStyle}
                disabled={isSavingNode || isDragging || Boolean(draggingNodeType) || sectionEditLocked}
                onPreviewCss={setInteractionPreviewStyle}
                onCommitPatch={commitStylePatch}
                snapGapToScale={snapGapToScale}
                applyDeviceStylePatch={applyDeviceStylePatch}
                withFlexWidthOverride={withFlexWidthOverride}
                device={device}
                siteTheme={siteTheme}
              />
            ) : null}
            {canShowColumnResize ? (
              <ColumnResizeOverlay
                rowNode={node}
                rowElement={nodeElementRef.current}
                deviceStyle={deviceStyle}
                disabled={isSavingNode || isDragging || Boolean(draggingNodeType) || sectionEditLocked}
                onPreviewColumnCss={(colId, css) => onSetPreviewCssForNode?.(colId, css)}
                onCommitColumnStyleJson={async (colId, styleJson) => {
                  await onUpdateNode?.({ nodeId: colId, payload: { style_json: styleJson } });
                }}
                onClearPreview={() => onSetPreviewCssForNode?.(null, null, { clearAll: true })}
                applyDeviceStylePatch={applyDeviceStylePatch}
                withFlexWidthOverride={withFlexWidthOverride}
                device={device}
                siteTheme={siteTheme}
              />
            ) : null}
            {dragAssist ? (
              <div className="bld-drag-assist">
                <span className="bld-drag-assist__mode">
                  {dragAssist.mode === 'snap' ? 'Snap mode' : 'Free move'}
                </span>
                <span className="bld-drag-assist__chip">
                  {dragAssist.mode === 'snap' ? dragAssist.snapSummary : dragAssist.spacingLine || '—'}
                </span>
              </div>
            ) : null}
            {supportsInlineTextEdit && isInlineEditing ? (
              <div
                ref={inlineEditWrapRef}
                className="bld-inline-edit-anchor"
                style={
                  deviceStyle?.typography?.color ||
                  deviceStyle?.colors?.textColor ||
                  deviceStyle?.colors?.text
                    ? {
                        '--node-text': String(
                          deviceStyle.typography?.color ||
                            deviceStyle.colors?.textColor ||
                            deviceStyle.colors?.text
                        ),
                      }
                    : undefined
                }
              >
                {renderNodeContent(node, {
                  isInlineEditing,
                  inlineDraftText,
                  onInlineDraftChange: setInlineDraftText,
                  onInlineEditStart: handleInlineEditStart,
                  onInlineEditCommit: handleInlineEditCommit,
                  onInlineEditCancel: handleInlineEditCancel,
                  inlineEditBlurCommitGuard,
                  textEditToolbarOpen,
                  textEditBlurCommitGuard,
                  featureTabValueSyncGuard,
                  isSavingNode,
                  sectionEditLocked,
                  isRichTextEditing,
                  onRichTextEditStart: handleRichTextEditStart,
                  onRichTextCommit: handleRichTextCommit,
                  onRichTextCancel: handleRichTextCancel,
                  richBlockStyle: inlineStyle,
                  menuStyle: deviceStyle,
                  widgetCss: isImageLeaf ? imageFigureStyle : inlineStyle,
                  device,
                  cmsBindingContext: childCmsContext?.item ? { item: childCmsContext.item, sys: childCmsContext.sys || {} } : null,
                  neutralizeBodyColorsPreview,
                  neutralizeBodyColorsPersist,
                  onTabsActiveChange: tabsActiveChangeHandler,
                  onFeatureTabsPatch: featureTabsPatchHandler,
                  onFeatureTabsImageFile: featureTabsImageHandler,
                  onStatsCounterPatch: statsCounterPatchHandler,
                  onTabHeroPatch: tabHeroPatchHandler,
                  onTabHeroImageFile: tabHeroImageHandler,
                  onTabHeroActiveChange: tabHeroActiveChangeHandler,
                  onFaqOpenChange: faqOpenChangeHandler,
                  onFaqAccordionPatch: faqAccordionPatchHandler,
                  onFaqAccordionAddItem: faqAccordionAddItemHandler,
                  onSplitHeroSlidePatch: splitHeroSlidePatchHandler,
                  onSplitHeroSlideImageFile: splitHeroSlideImageHandler,
                  siteTheme,
                  themeTokens: alignedContentTokens,
                  stylePresets,
                  animationPresets,
                  insideSiteHeaderRow,
                  builderPageId,
                  builderProjectId,
                  formPreviewMode: formPreviewByNodeId?.[node.id] ?? null,
                  sectionTone: ancestorSectionTone,
                  builderTree: tree,
                  renderFeatureTabPanel,
                })}
              </div>
            ) : (
              renderNodeContent(node, {
                isInlineEditing,
                inlineDraftText,
                onInlineDraftChange: setInlineDraftText,
                onInlineEditStart: handleInlineEditStart,
                onInlineEditCommit: handleInlineEditCommit,
                onInlineEditCancel: handleInlineEditCancel,
                inlineEditBlurCommitGuard,
                textEditToolbarOpen,
                textEditBlurCommitGuard,
                featureTabValueSyncGuard,
                isSavingNode,
                sectionEditLocked,
                isRichTextEditing,
                onRichTextEditStart: handleRichTextEditStart,
                onRichTextCommit: handleRichTextCommit,
                onRichTextCancel: handleRichTextCancel,
                richBlockStyle: inlineStyle,
                menuStyle: deviceStyle,
                widgetCss: isImageLeaf ? imageFigureStyle : inlineStyle,
                device,
                cmsBindingContext: childCmsContext?.item ? { item: childCmsContext.item, sys: childCmsContext.sys || {} } : null,
                neutralizeBodyColorsPreview,
                neutralizeBodyColorsPersist,
                onTabsActiveChange: tabsActiveChangeHandler,
                onFeatureTabsPatch: featureTabsPatchHandler,
                onFeatureTabsImageFile: featureTabsImageHandler,
                onStatsCounterPatch: statsCounterPatchHandler,
                onTabHeroPatch: tabHeroPatchHandler,
                onTabHeroImageFile: tabHeroImageHandler,
                onTabHeroActiveChange: tabHeroActiveChangeHandler,
                onFaqOpenChange: faqOpenChangeHandler,
                onFaqAccordionPatch: faqAccordionPatchHandler,
                onFaqAccordionAddItem: faqAccordionAddItemHandler,
                onSplitHeroSlidePatch: splitHeroSlidePatchHandler,
                onSplitHeroSlideImageFile: splitHeroSlideImageHandler,
                siteTheme,
                themeTokens: alignedContentTokens,
                stylePresets,
                animationPresets,
                insideSiteHeaderRow,
                builderPageId,
                builderProjectId,
                formPreviewMode: formPreviewByNodeId?.[node.id] ?? null,
                sectionTone: ancestorSectionTone,
                builderTree: tree,
                renderFeatureTabPanel,
              })
            )}
            {null}
            {showImageMediaToolbar &&
            supportsDirectManipulation &&
            canResizeNode &&
            node.nodeType === 'image' ? (
              <ResizeHandle
                className="bld-transform-handle--inline-resize"
                onMouseDown={startResizeWithMouse}
                disabled={isSavingNode || isDragging || Boolean(draggingNodeType) || sectionEditLocked}
              />
            ) : null}
            {showImageMediaToolbar &&
            imageToolbarFixedPos &&
            typeof document !== 'undefined'
              ? createPortal(
                  <div
                    ref={imageToolbarRef}
                    className="bld-floating-image-toolbar"
                    data-placement={imageToolbarFixedPos.placement || undefined}
                    style={{
                      position: 'fixed',
                      top: imageToolbarFixedPos.top,
                      left: imageToolbarFixedPos.left,
                      transform: imageToolbarFixedPos.transform || 'none',
                      zIndex: 13000,
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {node.nodeType === 'image' ? (
                      <div
                        className={`bld-image-toolbar bld-image-toolbar--compact bld-image-toolbar--floating${
                          nodeLooksLikeBrandLogo(node) ? ' bld-image-toolbar--brand-logo' : ''
                        }`.trim()}
                      >
                        <div className="bld-image-toolbar__line bld-image-toolbar__line--actions">
                          <button
                            type="button"
                            className="bld-image-toolbar__action-btn"
                            title="Duplicate"
                            aria-label="Duplicate"
                            onClick={(event) => {
                              event.stopPropagation();
                              duplicateThisNode(event);
                            }}
                            disabled={isSavingNode || sectionEditLocked}
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            className="bld-image-toolbar__action-btn bld-image-toolbar__action-btn--danger"
                            title="Delete"
                            aria-label="Delete"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteThisNode(event);
                            }}
                            disabled={isDeletingNode || sectionEditLocked}
                          >
                            ✕
                          </button>
                          {nodeLooksLikeBrandLogo(node) ? (
                            <span className="bld-image-toolbar__width-readout" aria-live="polite">
                              {parseBrandLogoWidthPx(
                                normalizeBrandLogoProps(node.props || {}).width,
                                160
                              )}
                              px
                            </span>
                          ) : null}
                        </div>
                        <div className="bld-image-toolbar__line">
                      <span className="bld-image-toolbar__tag">Align</span>
                      <div className="bld-image-toolbar__segmented" role="group" aria-label="Image alignment">
                        {[
                          { axis: 'horizontal', slot: 'left', Icon: WpIconAlignLeft, label: 'Left' },
                          { axis: 'horizontal', slot: 'center', Icon: WpIconAlignCenter, label: 'Center' },
                          { axis: 'horizontal', slot: 'right', Icon: WpIconAlignRight, label: 'Right' },
                          { axis: 'vertical', slot: 'top', Icon: WpIconAlignTop, label: 'Top' },
                          { axis: 'vertical', slot: 'bottom', Icon: WpIconAlignBottom, label: 'Bottom' },
                        ].map(({ axis, slot, Icon, label }, index, arr) => {
                          const active =
                            axis === 'horizontal'
                              ? imageAlignAxes.horizontal === slot
                              : imageAlignAxes.vertical === slot;
                          return (
                            <button
                              key={`${axis}-${slot}`}
                              type="button"
                              className={`bld-image-toolbar__seg ${active ? 'is-active' : ''} ${
                                index === 0 ? 'is-first' : ''
                              } ${index === arr.length - 1 ? 'is-last' : ''}`.trim()}
                              title={`Align ${label.toLowerCase()}`}
                              aria-label={`Align ${label.toLowerCase()}`}
                              aria-pressed={active}
                              onClick={() => quickAlignImageBlock(axis, slot)}
                              disabled={isSavingNode || sectionEditLocked}
                            >
                              <Icon />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="bld-image-toolbar__line bld-image-toolbar__line--size">
                      <span className="bld-image-toolbar__tag">Size</span>
                      <div className="bld-image-toolbar__size" role="group" aria-label="Image size and crop">
                        <button
                          type="button"
                          className="bld-image-toolbar__btn"
                          title={
                            nodeLooksLikeBrandLogo(node)
                              ? 'Fill header logo area'
                              : 'Full width (all devices)'
                          }
                          aria-label={
                            nodeLooksLikeBrandLogo(node) ? 'Fill logo container' : 'Full width'
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            void (nodeLooksLikeBrandLogo(node)
                              ? quickBrandLogoFullWidth()
                              : quickImageFullWidth());
                          }}
                          disabled={isSavingNode || sectionEditLocked}
                        >
                          Full
                        </button>
                        <button
                          type="button"
                          className="bld-image-toolbar__btn"
                          title="Decrease width"
                          aria-label="Decrease width"
                          onClick={(event) => {
                            event.stopPropagation();
                            void (nodeLooksLikeBrandLogo(node)
                              ? adjustBrandLogoWidth(-30)
                              : adjustImageBlockWidth(-30));
                          }}
                          disabled={isSavingNode || sectionEditLocked}
                        >
                          W−
                        </button>
                        <button
                          type="button"
                          className="bld-image-toolbar__btn"
                          title="Increase width"
                          aria-label="Increase width"
                          onClick={(event) => {
                            event.stopPropagation();
                            void (nodeLooksLikeBrandLogo(node)
                              ? adjustBrandLogoWidth(30)
                              : adjustImageBlockWidth(30));
                          }}
                          disabled={isSavingNode || sectionEditLocked}
                        >
                          W+
                        </button>
                        {!nodeLooksLikeBrandLogo(node) ? (
                          <>
                            <span className="bld-image-toolbar__sep-v" aria-hidden />
                            <button
                              type="button"
                              className="bld-image-toolbar__btn bld-image-toolbar__btn--icon"
                              title="Decrease crop height"
                              aria-label="Decrease crop height"
                              onClick={() => adjustImageCropHeight(-20)}
                              disabled={isSavingNode || sectionEditLocked}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="bld-image-toolbar__btn bld-image-toolbar__btn--fit"
                              title="Change image fit (cover / contain / fill)"
                              aria-label="Change image fit"
                              onClick={cycleImageFit}
                              disabled={isSavingNode || sectionEditLocked}
                            >
                              {String(node.props?.imageFit || 'cover') === 'contain'
                                ? 'Contain'
                                : String(node.props?.imageFit || 'cover') === 'fill'
                                  ? 'Fill'
                                  : 'Cover'}
                            </button>
                            <button
                              type="button"
                              className="bld-image-toolbar__btn bld-image-toolbar__btn--icon"
                              title="Increase crop height"
                              aria-label="Increase crop height"
                              onClick={() => adjustImageCropHeight(20)}
                              disabled={isSavingNode || sectionEditLocked}
                            >
                              +
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                      </div>
                    ) : (
                      <div className="bld-image-quick-tools">
                        <button
                          type="button"
                          className="bld-image-quick-tools__btn"
                          title="Decrease width"
                          aria-label="Decrease width"
                          onClick={() => adjustNodeWidth(-30)}
                          disabled={isSavingNode || sectionEditLocked}
                        >
                          W−
                        </button>
                        <button
                          type="button"
                          className="bld-image-quick-tools__btn"
                          title="Increase width"
                          aria-label="Increase width"
                          onClick={() => adjustNodeWidth(30)}
                          disabled={isSavingNode || sectionEditLocked}
                        >
                          W+
                        </button>
                      </div>
                    )}
                  </div>,
                  getBuilderPortalRoot() || document.body
                )
              : null}
            {isContainer ? (
              <DropZone
                id={`inside-${node.id}`}
                label={`Drop inside ${node.nodeType}`}
                validationParentType={node.nodeType}
                draggingNodeType={draggingNodeType}
                showLabel={Boolean(draggingNodeType)}
              />
            ) : null}
            {isContainer && !node.children?.length ? (
              <div className="bld-node-empty" onPointerDown={stopDragBubble}>
                <p className="bld-node-empty__text">
                  {node.nodeType === 'row'
                    ? 'This section is empty. Start by adding columns, then place elements inside.'
                    : node.nodeType === 'column'
                      ? 'This column is empty. Add a stack or drop elements here.'
                      : node.nodeType === 'stack'
                        ? 'This stack is empty. Drop in a heading, text, image, or button to get started.'
                        : `Empty ${node.nodeType}. Add content to start building.`}
                </p>
                <div className="bld-node-empty__actions">
                  <button
                    type="button"
                    className="bld-node-empty__btn bld-node-empty__btn--primary"
                    onPointerDown={stopDragBubble}
                    onClick={openAddForNode}
                    disabled={isCreatingNode || sectionEditLocked}
                  >
                    + Add element
                  </button>
                  <button
                    type="button"
                    className="bld-node-empty__pick-hint"
                    onPointerDown={stopDragBubble}
                    onClick={openAddForNode}
                    disabled={isCreatingNode || sectionEditLocked}
                  >
                    Try: Section → Column → Stack → Elements
                  </button>
                </div>
                <p className="bld-node-empty__hint">Move, duplicate, and delete live in the toolbar; use ⋯ for more.</p>
              </div>
            ) : null}
            {node.children?.length ? (
              <div className="bld-node-children">
                {node.children.map((childNode) => (
                  <NodeRenderer
                    key={childNode.id}
                    node={childNode}
                    cmsContext={
                      childCmsContext?.item
                        ? childCmsContext
                        : repeatEnabled && repeatCollectionSlug && cmsPreviewByCollection?.[repeatCollectionSlug]?.item
                          ? {
                              item: cmsPreviewByCollection[repeatCollectionSlug].item,
                              sys: {
                                slug: cmsPreviewByCollection[repeatCollectionSlug].item?.slug || '',
                                collection: repeatCollectionSlug,
                              },
                            }
                          : childCmsContext
                    }
                    cmsPreviewByCollection={cmsPreviewByCollection}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    parentNodeType={node.nodeType}
                    draggingNodeType={draggingNodeType}
                    device={device}
                    tree={tree}
                    previewCssByNodeId={previewCssByNodeId}
                    previewIxByNodeId={previewIxByNodeId}
                    onSetPreviewCssForNode={onSetPreviewCssForNode}
                    formPreviewByNodeId={formPreviewByNodeId}
                    onReportOverflow={onReportOverflow}
                    onDeleteNode={onDeleteNode}
                    onRequestNavigator={onRequestNavigator}
                    onInsertStarterTemplate={onInsertStarterTemplate}
                    onInsertHeaderTemplate={onInsertHeaderTemplate}
                    onSetContainerDirection={onSetContainerDirection}
                    onUpdateNode={onUpdateNode}
                    onCreateNode={onCreateNode}
                    onQuickAddNode={onQuickAddNode}
                    onDuplicateNode={onDuplicateNode}
                    onReorderNode={onReorderNode}
                    isReorderingNode={isReorderingNode}
                    isCreatingNode={isCreatingNode}
                    isSavingNode={isSavingNode}
                    isDeletingNode={isDeletingNode}
                    deletingNodeId={deletingNodeId}
                    onOpenWidgetPicker={onOpenWidgetPicker}
                    onOpenSectionInsert={onOpenSectionInsert}
                    hoveredNodeId={hoveredNodeId}
                    onHoverNode={onHoverNode}
                    onSaveGlobalSection={onSaveGlobalSection}
                    onConvertToGlobalComponent={onConvertToGlobalComponent}
                    onDetachFromGlobalComponent={onDetachFromGlobalComponent}
                    onEditGlobalComponent={onEditGlobalComponent}
                    onAlignMenuRightInRow={onAlignMenuRightInRow}
                    onUploadLogoInRow={onUploadLogoInRow}
                    onStretchSectionFullWidth={onStretchSectionFullWidth}
                    onStretchSectionFromSelection={onStretchSectionFromSelection}
                    onAlignMenuRightFromSelection={onAlignMenuRightFromSelection}
                    isFreeMode={isFreeMode}
                    rowSemanticTag={null}
                    onCopyNodeId={onCopyNodeId}
                    flashPasteNodeId={flashPasteNodeId}
                    flashReorderNodeId={flashReorderNodeId}
                    onAddSectionPreviewEnter={onAddSectionPreviewEnter}
                    onAddSectionPreviewLeave={onAddSectionPreviewLeave}
                    onFreeMoveBrush={onFreeMoveBrush}
                    freeMoveBrushActive={freeMoveBrushActive}
                    insideSiteHeaderRow={childInsideSiteHeaderRow}
                    builderPageId={builderPageId}
                    builderProjectId={builderProjectId}
                    sectionLayout={childSectionLayout}
                    sectionTemplateId={childSectionTemplateId}
                    insideSectionItemsHost={childInsideSectionItemsHost}
                    parentSectionLayout={childParentSectionLayout}
                  />
                ))}
              </div>
            ) : null}
            {supportsDirectManipulation &&
            isNodeActive &&
            canResizeNode &&
            !(node.nodeType === 'image' || node.nodeType === 'menu') ? (
              <ResizeHandle
                onMouseDown={startResizeWithMouse}
                disabled={isSavingNode || isDragging || Boolean(draggingNodeType) || sectionEditLocked}
              />
            ) : null}
          </div>
      )}
      {showFloatingTextToolbar &&
      isSelected &&
      (floatingToolbarPos || fallbackToolbarPos) &&
      typeof document !== 'undefined'
        ? createPortal(
            <div
              className="bld-floating-inline-toolbar"
              data-placement={(floatingToolbarPos || fallbackToolbarPos)?.placement || undefined}
              ref={floatingToolbarRef}
              style={{
                position: 'fixed',
                top: (floatingToolbarPos || fallbackToolbarPos)?.top,
                left: (floatingToolbarPos || fallbackToolbarPos)?.left,
                transform:
                  (floatingToolbarPos || fallbackToolbarPos)?.transform || 'translate(-50%, -100%)',
                zIndex: 13000,
              }}
              role="toolbar"
              aria-label="Text formatting"
              onPointerDown={(event) => {
                const t = event.target;
                if (t?.closest?.('input[type="color"], select, label.bld-wp-toolbar__swatch')) {
                  freezeFloatingToolbar(2000);
                }
                handleFloatingToolbarPointerDown(event);
              }}
              onFocusCapture={() => freezeFloatingToolbar(2000)}
            >
              <div className="bld-floating-inline-toolbar__inner bld-floating-inline-toolbar__inner--wp">
                {inlineRichToolbarControls}
              </div>
            </div>,
            getBuilderPortalRoot() || document.body
          )
        : null}
      {dragAssist?.mode === 'snap' &&
      (dragAssist.vline != null || dragAssist.hline != null) &&
      typeof document !== 'undefined'
        ? createPortal(
            <div className="bld-snap-guides" aria-hidden>
              {dragAssist.vline != null ? (
                <div className="bld-snap-guides__line bld-snap-guides__line--v" style={{ left: dragAssist.vline }} />
              ) : null}
              {dragAssist.hline != null ? (
                <div className="bld-snap-guides__line bld-snap-guides__line--h" style={{ top: dragAssist.hline }} />
              ) : null}
            </div>,
            getBuilderPortalRoot() || document.body
          )
        : null}
    </>
  );
}

function validateResolvedDrop(tree, draggedNodeId, payload) {
  if (!payload) return false;
  const dragged = findNodeInTree(tree, draggedNodeId);
  if (!dragged) return false;
  let parentType = null;
  if (payload.newParentId) {
    const parent = findNodeInTree(tree, payload.newParentId);
    if (!parent) return false;
    parentType = parent.nodeType;
  }
  return isValidNodeHierarchy(dragged.nodeType, parentType);
}

function breadcrumbDisplayLabel(n) {
  if (!n) return 'Node';
  if (n.nodeType === 'row') return n.displayName || 'Section';
  if (n.nodeType === 'column') return n.displayName || 'Column';
  if (n.nodeType === 'stack') return n.displayName || 'Stack';
  if (n.nodeType === 'tabs') return 'Feature tabs';
  if (n.nodeType === 'accordion') return 'FAQ accordion';
  if (n.nodeType === 'stats_counter') return 'Stats Counter';
  if (n.nodeType === 'tab_hero') return 'Tab Hero';
  if (n.nodeType === 'icon') return 'Icon';
  if (n.nodeType === 'icon_box') return 'Icon box';
  if (n.nodeType === 'content_card') return 'Card';
  if (n.nodeType === 'spacer') return 'Spacer';
  if (n.nodeType === 'modal') return 'Modal';
  if (n.nodeType === 'video_embed') return 'Video embed';
  if (n.nodeType === 'map_embed') return 'Map embed';
  if (n.nodeType === 'social_icons') return 'Social icons';
  if (n.nodeType === 'container_box') return 'Container';
  if (n.nodeType === 'grid_block') return 'Grid';
  if (n.nodeType === 'alert_notice') return 'Alert';
  if (n.nodeType === 'badge_label') return 'Badge';
  if (n.nodeType === 'counter_block') return 'Counter';
  if (n.nodeType === 'progress_bar') return 'Progress bar';
  if (n.nodeType === 'rating_stars') return 'Rating';
  if (n.nodeType === 'testimonial_card') return 'Testimonial';
  if (n.nodeType === 'pricing_card') return 'Pricing card';
  if (n.nodeType === 'newsletter_form') return 'Newsletter';
  if (n.nodeType === 'whatsapp_button') return 'WhatsApp';
  if (n.nodeType === 'countdown_timer') return 'Countdown';
  if (n.nodeType === 'html_block') return 'HTML block';
  if (n.nodeType === 'code_block') return 'Code block';
  if (n.nodeType === 'lottie_animation') return 'Lottie';
  if (n.nodeType === 'logo_block') return 'Logo';
  if (n.nodeType === 'feature_list') return 'Feature list';
  if (n.nodeType === 'table_pro') return 'Table Pro';
  return n.displayName || n.nodeType || 'Block';
}

function findBreadcrumbTrail(nodes, targetId, path = []) {
  for (const n of nodes || []) {
    const crumb = { id: n.id, label: breadcrumbDisplayLabel(n) };
    const next = [...path, crumb];
    if (n.id === targetId) return next;
    const found = findBreadcrumbTrail(n.children || [], targetId, next);
    if (found) return found;
  }
  return null;
}

export default function BuilderCanvas({
  device,
  onDeviceChange,
  tree,
  selectedNodeId,
  onSelectNode,
  isLoading,
  onCreateNode,
  onQuickAddNode,
  isCreatingNode = false,
  onReorderNode,
  isReorderingNode,
  onDeleteNode,
  onRequestNavigator,
  onInsertStarterTemplate,
  onInsertHeaderTemplate,
  onInsertSectionTemplate,
  onCreateHeroSection,
  projectTemplates = [],
  onImportPageTemplate,
  onSetContainerDirection,
  onUpdateNode,
  onDuplicateNode,
  isSavingNode,
  isDeletingNode,
  deletingNodeId = null,
  onCreateSection,
  projectType = 'website',
  onSaveGlobalSection,
  onConvertToGlobalComponent,
  onDetachFromGlobalComponent,
  onEditGlobalComponent,
  onAlignMenuRightInRow,
  onUploadLogoInRow,
  onStretchSectionFullWidth,
  onStretchSectionFromSelection,
  onAlignMenuRightFromSelection,
  isFreeMode = false,
  isLayoutDebug = false,
  minimalPageChrome = true,
  onCopyNodeId,
  flashPasteNodeId = null,
  previewCssByNodeId: externalPreviewCssByNodeId,
  previewIxByNodeId: externalPreviewIxByNodeId,
  onSetPreviewCssForNode: externalOnSetPreviewCssForNode,
  formPreviewByNodeId: externalFormPreviewByNodeId,
  activeSpacingEdit,
  onOverflowDiagnosticsChange,
  showGrid = false,
  projectId,
  pageId: builderPageIdProp = null,
}) {
  const builderPageId = Number(builderPageIdProp) > 0 ? Number(builderPageIdProp) : null;
  const builderProjectId = Number(projectId) > 0 ? Number(projectId) : null;
  const { siteTheme, themeTokens, currentPageSlug } = useBuilderTheme();
  const alignedThemeTokens = useMemo(
    () => alignThemeTokensWithSiteTheme(normalizeSiteTheme(siteTheme), themeTokens),
    [siteTheme, themeTokens]
  );
  const pageVars = currentPageSlug ? siteTheme?.pageVars?.[currentPageSlug] : null;
  const stickyHeader = Boolean(pageVars?.stickyHeader);
  const bodyLayout = resolveBodyLayout(siteTheme, currentPageSlug);
  /** Same tokens + body font as `app/[projectSlug]/[pageSlug]/page.jsx` so canvas matches published/live preview. */
  const liveMirrorRootStyle = useMemo(() => {
    const normalized = normalizeSiteTheme(siteTheme);
    return {
      ...siteThemeToCssVariableStyle(normalized),
      ...themeTokensToCssVariableStyle(alignedThemeTokens),
      ...livePageCssVarOverridesForPage(normalized, currentPageSlug),
      fontFamily: normalized.typography.fontFamily,
    };
  }, [siteTheme, alignedThemeTokens, currentPageSlug]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [draggingNodeType, setDraggingNodeType] = useState(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [sectionInsertIndex, setSectionInsertIndex] = useState(null);
  const [sectionModalTab, setSectionModalTab] = useState('presets');
  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);
  const [widgetPickerTargetId, setWidgetPickerTargetId] = useState(null);
  const [hasAutoOpenedTemplatePicker, setHasAutoOpenedTemplatePicker] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [addSectionPreview, setAddSectionPreview] = useState(null);
  const [canvasFreeMoveActive, setCanvasFreeMoveActive] = useState(false);
  const [reorderFlashNodeId, setReorderFlashNodeId] = useState(null);
  const [previewCssByNodeId, setPreviewCssByNodeId] = useState({});
  const [cmsPreviewByCollection, setCmsPreviewByCollection] = useState({});
  const reorderFlashTimerRef = useRef(null);
  const hoverEnterTimerRef = useRef(null);
  const addSectionPreviewTimerRef = useRef(null);
  const dragAltDuplicateRef = useRef(false);
  const hoverLeaveTimerRef = useRef(null);
  const liveDocRef = useRef(null);
  const [liveDocEl, setLiveDocEl] = useState(null);
  const attachLiveDocRef = useCallback((el) => {
    liveDocRef.current = el;
    setLiveDocEl(el);
  }, []);
  const HOVER_ENTER_MS = 100;
  const HOVER_LEAVE_MS = 150;

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

  const effectivePreviewCssByNodeId = externalPreviewCssByNodeId || previewCssByNodeId;
  const effectivePreviewIxByNodeId = externalPreviewIxByNodeId || {};
  const effectiveFormPreviewByNodeId = externalFormPreviewByNodeId || {};
  const effectiveSetPreviewCssForNode = externalOnSetPreviewCssForNode || setPreviewCssForNode;

  useEffect(() => {
    if (!liveDocEl) return undefined;
    const unbindIx = bindInteractionObservers(liveDocEl);
    const unbindHeader = bindHeaderBehaviorScroll(liveDocEl);
    return () => {
      unbindIx?.();
      unbindHeader?.();
    };
  }, [liveDocEl, tree, device, effectivePreviewCssByNodeId, effectivePreviewIxByNodeId]);

  // CMS preview: fetch a single sample item per repeater collection (cached; not per render).
  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;
    const slugs = new Set();
    const walk = (nodes) => {
      for (const n of nodes || []) {
        const rep = n?.props?.meta?.cms?.repeat;
        const slug = typeof rep?.collectionSlug === 'string' ? rep.collectionSlug.trim() : '';
        if (slug) slugs.add(slug);
        if (Array.isArray(n?.children) && n.children.length) walk(n.children);
      }
    };
    walk(tree);
    const wanted = Array.from(slugs);
    if (!wanted.length) return;
    let cancelled = false;
    (async () => {
      const updates = {};
      for (const slug of wanted) {
        if (cmsPreviewByCollection?.[slug]?.item) continue;
        try {
          const res = await fetch(`/api/projects/${pid}/cms/collections/${slug}/items?status=published&limit=1`);
          const json = await res.json().catch(() => ({}));
          const item = Array.isArray(json?.items) && json.items[0] ? json.items[0] : null;
          if (item) updates[slug] = { item };
        } catch {
          // ignore
        }
      }
      if (cancelled) return;
      if (Object.keys(updates).length) {
        setCmsPreviewByCollection((prev) => ({ ...(prev || {}), ...(updates || {}) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, tree, cmsPreviewByCollection]);

  const overflowByNodeIdRef = useRef({});
  const overflowFlushTimerRef = useRef(null);
  const reportOverflow = useCallback((nodeId, diag) => {
    if (!nodeId) return;
    overflowByNodeIdRef.current = {
      ...(overflowByNodeIdRef.current || {}),
      [nodeId]: diag,
    };
    if (overflowFlushTimerRef.current) window.clearTimeout(overflowFlushTimerRef.current);
    overflowFlushTimerRef.current = window.setTimeout(() => {
      overflowFlushTimerRef.current = null;
      onOverflowDiagnosticsChange?.(overflowByNodeIdRef.current);
    }, 140);
  }, [onOverflowDiagnosticsChange]);

  const onHoverNodeIntent = useCallback((nodeId) => {
    if (draggingNodeType) return;
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    if (nodeId == null) {
      if (hoverEnterTimerRef.current) {
        clearTimeout(hoverEnterTimerRef.current);
        hoverEnterTimerRef.current = null;
      }
      hoverLeaveTimerRef.current = setTimeout(() => {
        hoverLeaveTimerRef.current = null;
        setHoveredNodeId(null);
      }, HOVER_LEAVE_MS);
      return;
    }
    if (hoverEnterTimerRef.current) {
      clearTimeout(hoverEnterTimerRef.current);
    }
    hoverEnterTimerRef.current = setTimeout(() => {
      hoverEnterTimerRef.current = null;
      setHoveredNodeId(nodeId);
    }, HOVER_ENTER_MS);
  }, [draggingNodeType]);

  useEffect(() => {
    return () => {
      if (hoverEnterTimerRef.current) clearTimeout(hoverEnterTimerRef.current);
      if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLoading || !tree?.length) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        if (window.localStorage.getItem('bld-onboarding-v1')) return;
      } catch {
        return;
      }
      setShowOnboarding(true);
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLoading, tree?.length]);

  const dismissOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem('bld-onboarding-v1', '1');
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
  }, []);

  const showAddSectionPreviewAnchor = useCallback((el, insertIndex) => {
    if (addSectionPreviewTimerRef.current) {
      window.clearTimeout(addSectionPreviewTimerRef.current);
      addSectionPreviewTimerRef.current = null;
    }
    const r = el.getBoundingClientRect?.();
    if (!r) return;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const TOOLTIP_W = 220;
    const TOOLTIP_H = 112;
    const PAD = 10;
    const GAP = 10;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const maxLeft = Math.max(PAD, vw - (TOOLTIP_W + PAD));
    const maxTop = Math.max(PAD, vh - (TOOLTIP_H + PAD));

    // Prefer below the anchor (clean + predictable).
    let top = r.bottom + 8;
    let left = clamp(r.left, PAD, maxLeft);

    // When the anchor is near the bottom, switch to a side placement so the hint never covers the button.
    if (top > maxTop) {
      top = clamp(r.top + (r.height - TOOLTIP_H) / 2, PAD, maxTop);
      left = r.right + GAP;
      if (left > maxLeft) left = r.left - TOOLTIP_W - GAP;
      left = clamp(left, PAD, maxLeft);
    }

    setAddSectionPreview({
      insertIndex,
      top: clamp(top, PAD, maxTop),
      left: clamp(left, PAD, maxLeft),
    });
  }, []);

  const hideAddSectionPreviewAnchorDebounced = useCallback(() => {
    if (addSectionPreviewTimerRef.current) {
      window.clearTimeout(addSectionPreviewTimerRef.current);
    }
    addSectionPreviewTimerRef.current = window.setTimeout(() => {
      addSectionPreviewTimerRef.current = null;
      setAddSectionPreview(null);
    }, 160);
  }, []);

  const keepAddSectionPreviewAnchor = useCallback(() => {
    if (addSectionPreviewTimerRef.current) {
      window.clearTimeout(addSectionPreviewTimerRef.current);
      addSectionPreviewTimerRef.current = null;
    }
  }, []);

  const onFreeMoveBrush = useCallback((active) => {
    setCanvasFreeMoveActive(Boolean(active));
  }, []);

  const triggerReorderFlash = useCallback((nodeId) => {
    const id = Number(nodeId);
    if (!Number.isFinite(id) || id <= 0) return;
    if (reorderFlashTimerRef.current) window.clearTimeout(reorderFlashTimerRef.current);
    setReorderFlashNodeId(id);
    reorderFlashTimerRef.current = window.setTimeout(() => {
      reorderFlashTimerRef.current = null;
      setReorderFlashNodeId(null);
    }, 520);
  }, []);

  useEffect(
    () => () => {
      if (addSectionPreviewTimerRef.current) window.clearTimeout(addSectionPreviewTimerRef.current);
      if (reorderFlashTimerRef.current) window.clearTimeout(reorderFlashTimerRef.current);
    },
    []
  );

  const widgetPickerEntries = useMemo(
    () => getWidgetPickerEntries(projectType || 'website'),
    [projectType]
  );

  useEffect(() => {
    const handleKeyDelete = (event) => {
      if (!selectedNodeId || !onDeleteNode) return;
      if (!tree?.length) return;
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase?.() || '';
      const isEditableTarget =
        target?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      if (isEditableTarget) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      event.preventDefault();
      onDeleteNode(Number(selectedNodeId));
    };

    window.addEventListener('keydown', handleKeyDelete);
    return () => window.removeEventListener('keydown', handleKeyDelete);
  }, [selectedNodeId, onDeleteNode, tree]);

  const flushHoverIntentTimers = () => {
    if (hoverEnterTimerRef.current) {
      clearTimeout(hoverEnterTimerRef.current);
      hoverEnterTimerRef.current = null;
    }
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setHoveredNodeId(null);
  };

  const handleDragStart = (event) => {
    if (!tree?.length) return;
    flushHoverIntentTimers();
    const ae = event.activatorEvent;
    dragAltDuplicateRef.current = Boolean(
      ae && typeof ae === 'object' && 'altKey' in ae && ae.altKey
    );
    const t = event.active?.data?.current?.nodeType;
    setDraggingNodeType(typeof t === 'string' ? t : null);
  };

  const handleDragCancel = () => {
    dragAltDuplicateRef.current = false;
    setDraggingNodeType(null);
    flushHoverIntentTimers();
  };

  useEffect(() => {
    if (!draggingNodeType) return undefined;
    const edge = 72;
    const speed = 16;
    const onPointerMove = (event) => {
      const y = Number(event.clientY || 0);
      const vh = window.innerHeight || 0;
      if (y < edge) {
        window.scrollBy({ top: -speed, behavior: 'auto' });
      } else if (y > vh - edge) {
        window.scrollBy({ top: speed, behavior: 'auto' });
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [draggingNodeType]);

  const handleDragEnd = async (event) => {
    if (!tree?.length) return;
    const wantAltDuplicate = dragAltDuplicateRef.current;
    dragAltDuplicateRef.current = false;
    setDraggingNodeType(null);
    flushHoverIntentTimers();

    const activeNodeId = event.active?.data?.current?.nodeId;
    const overId = event.over?.id;
    if (activeNodeId == null || overId == null) return;

    const payload = computeReorderFromDrop(tree, activeNodeId, overId);
    if (!payload) return;
    if (!validateResolvedDrop(tree, activeNodeId, payload)) return;

    if (wantAltDuplicate && onDuplicateNode) {
      void (async () => {
        const dup = await onDuplicateNode(Number(activeNodeId));
        const newId = dup?.duplicatedNodeId;
        if (!newId) return;
        const baseTree = dup.tree || tree;
        const payloadDup = computeReorderFromDrop(baseTree, newId, overId);
        if (!payloadDup || !validateResolvedDrop(baseTree, newId, payloadDup)) return;
        await onReorderNode({
          nodeId: newId,
          newParentId: payloadDup.newParentId,
          newIndex: payloadDup.newIndex,
          baseTree,
        });
        triggerReorderFlash(newId);
      })();
      return;
    }

    await onReorderNode({
      nodeId: activeNodeId,
      newParentId: payload.newParentId,
      newIndex: payload.newIndex,
    });
    triggerReorderFlash(activeNodeId);
  };

  const openAddSectionAt = (insertIndex) => {
    setSectionInsertIndex(Number.isFinite(insertIndex) ? insertIndex : null);
    setSectionModalTab('layouts');
    setIsAddSectionOpen(true);
  };

  const openSectionPresets = (insertIndex = null) => {
    setSectionInsertIndex(Number.isFinite(insertIndex) ? insertIndex : null);
    setSectionModalTab('presets');
    setIsAddSectionOpen(true);
  };

  const openWidgetPickerFor = (targetNodeId) => {
    if (!targetNodeId) return;
    setWidgetPickerTargetId(Number(targetNodeId));
    setIsWidgetPickerOpen(true);
  };

  const handleSelectSectionStructure = async (layoutId) => {
    if (!onCreateSection) return;
    const key = String(layoutId || '').trim();
    if (!key) return;
    const asNum = Number(key);
    if (/^col-\d+$/.test(key) || (Number.isInteger(asNum) && asNum >= 1)) {
      await onCreateSection({
        layoutId: /^col-\d+$/.test(key) ? key : `col-${asNum}`,
        insertIndex: sectionInsertIndex,
      });
    } else {
      await onCreateSection({ layoutId: key, insertIndex: sectionInsertIndex });
    }
    setIsAddSectionOpen(false);
    setSectionInsertIndex(null);
  };

  const handleSelectSectionPreset = async (presetId) => {
    if (SECTION_TEMPLATE_IDS.has(presetId) && onInsertSectionTemplate) {
      await onInsertSectionTemplate(presetId, { insertIndex: sectionInsertIndex });
      setIsAddSectionOpen(false);
      setSectionInsertIndex(null);
      return;
    }
    if (presetId === 'starter') {
      await onInsertStarterTemplate?.({});
    } else {
      return;
    }
    setIsAddSectionOpen(false);
    setSectionInsertIndex(null);
  };

  // Optional: auto-open template picker on first visit to an empty page (skipped when minimal chrome).
  useEffect(() => {
    if (minimalPageChrome) return;
    if (isLoading) return;
    if (tree?.length) return;
    if (hasAutoOpenedTemplatePicker) return;
    // Don't fight the user if modal already open.
    if (isAddSectionOpen) return;
    setHasAutoOpenedTemplatePicker(true);
    openSectionPresets(0);
  }, [hasAutoOpenedTemplatePicker, isAddSectionOpen, isLoading, minimalPageChrome, tree?.length]);

  const templateCards = useMemo(() => {
    const safeTemplates = Array.isArray(projectTemplates) ? projectTemplates : [];
    const findByKeyword = (keyword) =>
      safeTemplates.find((tpl) => String(tpl?.name || '').toLowerCase().includes(keyword));
    return [
      { id: 'header', title: 'Header', subtitle: 'Logo + Menu', keyword: 'header', fallback: 'header' },
      { id: 'hero', title: 'Hero', subtitle: 'Headline + CTA', keyword: 'hero', fallback: 'starter' },
      { id: 'landing', title: 'Landing', subtitle: 'Full page layout', keyword: 'landing', fallback: 'starter' },
      { id: 'contact', title: 'Contact', subtitle: 'Form section', keyword: 'contact', fallback: 'starter' },
      { id: 'footer', title: 'Footer', subtitle: 'Links + copyright', keyword: 'footer', fallback: null },
    ].map((card) => ({
      ...card,
      template: findByKeyword(card.keyword) || null,
    }));
  }, [projectTemplates]);

  const handleStartTemplate = async (card) => {
    if (!card) return;
    if (card.template?.id && onImportPageTemplate) {
      await onImportPageTemplate(card.template.id);
      return;
    }
    if (card.id === 'hero' && onInsertSectionTemplate) {
      await onInsertSectionTemplate('hero');
      return;
    }
    if (card.id === 'features' && onInsertSectionTemplate) {
      await onInsertSectionTemplate('features');
      return;
    }
    if (card.fallback === 'header' && onInsertSectionTemplate) {
      await onInsertSectionTemplate('header');
      return;
    }
    if (card.fallback === 'starter') {
      await onInsertStarterTemplate?.({});
      return;
    }
    if (card.id === 'footer' && onInsertSectionTemplate) {
      await onInsertSectionTemplate('footer');
    }
  };

  /** Matches `lib/rootSemanticTag.js` (single root row can be Header/Footer/Main from meta). */
  const rowRoleForIndex = (index, total) => {
    if (total <= 0) return null;
    if (total === 1) {
      const row = tree?.[0];
      const meta = row?.props?.meta || {};
      if (meta.isHeader || meta.role === 'header') return 'Header';
      if (meta.isFooter || meta.role === 'footer') return 'Footer';
      return 'Main';
    }
    const row = tree?.[index];
    const meta = row?.props?.meta || {};
    if (meta.isHeader || meta.role === 'header') return 'Header';
    if (meta.isFooter || meta.role === 'footer') return 'Footer';
    return 'Section';
  };

  const rootSegments = useMemo(() => segmentRootNodes(tree || []), [tree]);

  const selectedBreadcrumbTrail = useMemo(
    () => (selectedNodeId && tree?.length ? findBreadcrumbTrail(tree, selectedNodeId) : null),
    [tree, selectedNodeId]
  );

  useEffect(() => {
    if (!selectedNodeId || isLoading) return undefined;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-bld-node="${selectedNodeId}"]`);
      if (!el) return;
      const scroller = el.closest('.bld-canvas-wrap') || el.closest('main');
      if (scroller) {
        const er = el.getBoundingClientRect();
        const sr = scroller.getBoundingClientRect();
        const margin = 12;
        const overlaps =
          er.bottom >= sr.top + margin &&
          er.top <= sr.bottom - margin &&
          er.right >= sr.left + margin &&
          er.left <= sr.right - margin;
        if (overlaps) return;
      }
      el.scrollIntoView?.({ block: 'nearest', behavior: 'auto', inline: 'nearest' });
    }, 48);
    return () => window.clearTimeout(timer);
  }, [selectedNodeId, isLoading]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={dropCollisionDetection}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <main
        className={`bld-canvas-wrap ${isLayoutDebug ? 'is-layout-debug' : ''} ${draggingNodeType ? 'bld-canvas-wrap--dnd-active' : ''}`.trim()}
      >
        {showOnboarding ? <BuilderOnboardingOverlay onDismiss={dismissOnboarding} /> : null}
        {addSectionPreview && typeof document !== 'undefined'
          ? createPortal(
              <div
                className="bld-add-section-hover-preview"
                role="tooltip"
                style={{ top: addSectionPreview.top, left: addSectionPreview.left }}
                onMouseEnter={keepAddSectionPreviewAnchor}
                onMouseLeave={hideAddSectionPreviewAnchorDebounced}
              >
                <div className="bld-add-section-hover-preview__title">New section</div>
                <div className="bld-add-section-hover-preview__sub">
                  Inserts at slot {addSectionPreview.insertIndex + 1}. Click for templates or blank columns.
                </div>
                <div className="bld-add-section-hover-preview__wires" aria-hidden>
                  <span className="bld-add-section-hover-preview__wire bld-add-section-hover-preview__wire--1" />
                  <span className="bld-add-section-hover-preview__wire bld-add-section-hover-preview__wire--2" />
                  <span className="bld-add-section-hover-preview__wire bld-add-section-hover-preview__wire--3" />
                </div>
              </div>,
              document.body
            )
          : null}
        <div className={`bld-canvas bld-canvas--${device}`}>
          {typeof onDeviceChange === 'function' ? (
            <div className="bld-canvas__device" role="tablist" aria-label="Canvas preview device">
              {['desktop', 'tablet', 'mobile'].map((d) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={device === d}
                  className={`bld-canvas__device-btn ${device === d ? 'is-active' : ''}`}
                  onClick={() => onDeviceChange(d)}
                >
                  {d === 'desktop' ? 'Desktop' : d === 'tablet' ? 'Tablet' : 'Mobile'}
                </button>
              ))}
            </div>
          ) : null}
          <div className={`bld-canvas__page${draggingNodeType ? ' bld-canvas__page--dnd-active' : ''}`.trim()}>
            <DropZone
              id="root-drop-append"
              label="Drop row at end of page"
              validationParentType={null}
              draggingNodeType={draggingNodeType}
              showLabel={Boolean(draggingNodeType)}
            />
            {isLoading ? (
              <div className="bld-canvas__empty-shell">
                <div className="bld-canvas__empty">Loading builder...</div>
              </div>
            ) : null}
            {!isLoading && !tree?.length ? (
              minimalPageChrome ? (
                <div className="bld-canvas__empty-shell bld-canvas__empty-shell--blank">
                  <div className="bld-canvas__blank" role="status" aria-live="polite">
                    <span className="bld-canvas__blank-title">Blank page</span>
                    <span className="bld-canvas__blank-sub">
                      Drag from the left (Templates / Elements), or add a section below. Styles open in the right panel
                      after you pick a layer.
                    </span>
                    <div className="bld-canvas__blank-actions">
                      <button
                        type="button"
                        className="bld-canvas__blank-cta"
                        onMouseEnter={(event) => showAddSectionPreviewAnchor(event.currentTarget, 0)}
                        onMouseLeave={hideAddSectionPreviewAnchorDebounced}
                        onClick={() => openAddSectionAt(0)}
                        disabled={isCreatingNode}
                      >
                        + Add section
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bld-canvas__empty-shell">
                  <div className="bld-start" role="dialog" aria-label="Start building">
                    <div className="bld-start__card">
                      <div className="bld-start__title">Start building</div>
                      <div className="bld-start__subtitle">
                        Choose a template to begin fast, or add a blank section and build from scratch.
                      </div>

                      <div className="bld-start__actions">
                        <button
                          type="button"
                          className="bld-start__primary"
                          onClick={() => openSectionPresets(0)}
                          disabled={isCreatingNode}
                        >
                          Start from Template
                        </button>
                        <button
                          type="button"
                          className="bld-start__secondary"
                          onClick={() => openAddSectionAt(0)}
                          disabled={isCreatingNode}
                        >
                          Start Blank
                        </button>
                        <button
                          type="button"
                          className="bld-start__secondary"
                          onClick={() => onCreateHeroSection?.()}
                          disabled={isCreatingNode}
                        >
                          + Create Hero Section
                        </button>
                        <button
                          type="button"
                          className="bld-start__secondary"
                          onClick={() => openSectionPresets(0)}
                          disabled={isCreatingNode}
                        >
                          Insert Header/Footer
                        </button>
                      </div>

                      <div className="bld-start__templates">
                        <div className="bld-start__templates-title">Templates</div>
                        <div className="bld-start__grid">
                          {templateCards.map((card) => {
                            const hasSaved = Boolean(card.template?.id);
                            const hint = hasSaved ? `Saved: ${card.template?.name || card.title}` : 'Uses built-in starter (or save a template)';
                            const disabled = isCreatingNode;
                            return (
                              <button
                                key={card.id}
                                type="button"
                                className="bld-start__tpl"
                                onClick={() => handleStartTemplate(card)}
                                disabled={disabled}
                                title={hint}
                              >
                                <div className="bld-start__tpl-title">
                                  {card.title}
                                  {hasSaved ? (
                                    <span className="bld-start__badge">Saved</span>
                                  ) : (
                                    <span className="bld-start__badge bld-start__badge--soft">Starter</span>
                                  )}
                                </div>
                                <div className="bld-start__tpl-subtitle">{card.subtitle}</div>
                                <div className="bld-start__tpl-meta">{hasSaved ? card.template?.name || '' : 'No saved template found'}</div>
                              </button>
                            );
                          })}
                        </div>
                        {!Array.isArray(projectTemplates) || projectTemplates.length === 0 ? (
                          <div className="bld-start__note">
                            No saved templates yet. Use the Templates tab → “Save Page Template”, then these cards will import the snapshot.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : null}
            {!minimalPageChrome && !isLoading && selectedBreadcrumbTrail?.length ? (
              <nav className="bld-canvas__breadcrumb" aria-label="Selection path">
                {selectedBreadcrumbTrail.map((crumb, idx) => {
                  const isLast = idx === selectedBreadcrumbTrail.length - 1;
                  return (
                    <Fragment key={crumb.id}>
                      {idx > 0 ? (
                        <span className="bld-canvas__breadcrumb__sep" aria-hidden="true">
                          →
                        </span>
                      ) : null}
                      {isLast ? (
                        <span className="bld-canvas__breadcrumb__seg bld-canvas__breadcrumb__seg--current" aria-current="page">
                          {crumb.label}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="bld-canvas__breadcrumb__seg"
                          title={`Select ${crumb.label}`}
                          onClick={() => onSelectNode(crumb.id)}
                        >
                          {crumb.label}
                        </button>
                      )}
                    </Fragment>
                  );
                })}
              </nav>
            ) : null}
            {!isLoading && tree?.length ? (
              <RuntimeProvider>
              <div
                className="live-site bld-canvas__live-mirror"
                data-site-preset={normalizeSiteTheme(siteTheme).presetId}
                data-token-mode={alignedThemeTokens.mode}
                data-sticky-header={stickyHeader ? 'true' : 'false'}
                data-live-body-layout={bodyLayout}
                style={{
                  ...liveMirrorRootStyle,
                  ...livePageCssVarOverridesForPage(siteTheme, currentPageSlug),
                }}
              >
                {showGrid ? <GridOverlay containerSelector=".bld-canvas__live-mirror .live-doc" /> : null}
                <div ref={attachLiveDocRef} className="live-doc" data-bld-device={device}>
                  {rootSegments.map((segment) => {
                    const renderRootNode = (node, index) => (
                      <NodeRenderer
                        key={node.id}
                        node={node}
                        cmsContext={
                          node?.props?.meta?.cms?.repeat?.collectionSlug &&
                          cmsPreviewByCollection?.[node.props.meta.cms.repeat.collectionSlug]?.item
                            ? {
                                item: cmsPreviewByCollection[node.props.meta.cms.repeat.collectionSlug].item,
                                sys: {
                                  slug:
                                    cmsPreviewByCollection[node.props.meta.cms.repeat.collectionSlug].item?.slug ||
                                    '',
                                },
                              }
                            : null
                        }
                        rowIndex={index}
                        selectedNodeId={selectedNodeId}
                        onSelectNode={onSelectNode}
                        parentNodeType={null}
                        draggingNodeType={draggingNodeType}
                        device={device}
                        tree={tree}
                        previewCssByNodeId={effectivePreviewCssByNodeId}
                        previewIxByNodeId={effectivePreviewIxByNodeId}
                        onSetPreviewCssForNode={effectiveSetPreviewCssForNode}
                        formPreviewByNodeId={effectiveFormPreviewByNodeId}
                        activeSpacingEdit={activeSpacingEdit}
                        onReportOverflow={reportOverflow}
                        rowRole={node.nodeType === 'row' ? rowRoleForIndex(index, tree.length) : null}
                        rowSemanticTag={node.nodeType === 'row' ? rootSemanticTag(tree, index) : null}
                        onDeleteNode={onDeleteNode}
                        onRequestNavigator={onRequestNavigator}
                        onInsertStarterTemplate={onInsertStarterTemplate}
                        onInsertHeaderTemplate={onInsertHeaderTemplate}
                        onSetContainerDirection={onSetContainerDirection}
                        onUpdateNode={onUpdateNode}
                        onCreateNode={onCreateNode}
                        onQuickAddNode={onQuickAddNode}
                        onDuplicateNode={onDuplicateNode}
                        onReorderNode={onReorderNode}
                        isReorderingNode={isReorderingNode}
                        rowSiblingsCount={tree.length}
                        isCreatingNode={isCreatingNode}
                        isSavingNode={isSavingNode}
                        isDeletingNode={isDeletingNode}
                        deletingNodeId={deletingNodeId}
                        onOpenWidgetPicker={openWidgetPickerFor}
                        showSectionAddButtonBefore={index > 0}
                        onOpenSectionInsert={openAddSectionAt}
                        hoveredNodeId={hoveredNodeId}
                        onHoverNode={onHoverNodeIntent}
                        onSaveGlobalSection={onSaveGlobalSection}
                        onConvertToGlobalComponent={onConvertToGlobalComponent}
                        onDetachFromGlobalComponent={onDetachFromGlobalComponent}
                        onEditGlobalComponent={onEditGlobalComponent}
                        onAlignMenuRightInRow={onAlignMenuRightInRow}
                        onUploadLogoInRow={onUploadLogoInRow}
                        onStretchSectionFullWidth={onStretchSectionFullWidth}
                        onStretchSectionFromSelection={onStretchSectionFromSelection}
                        onAlignMenuRightFromSelection={onAlignMenuRightFromSelection}
                        isFreeMode={isFreeMode}
                        onCopyNodeId={onCopyNodeId}
                        flashPasteNodeId={flashPasteNodeId}
                        flashReorderNodeId={reorderFlashNodeId}
                        onAddSectionPreviewEnter={showAddSectionPreviewAnchor}
                        onAddSectionPreviewLeave={hideAddSectionPreviewAnchorDebounced}
                        onFreeMoveBrush={onFreeMoveBrush}
                        freeMoveBrushActive={canvasFreeMoveActive}
                        cmsPreviewByCollection={cmsPreviewByCollection}
                        builderPageId={builderPageId}
                        builderProjectId={builderProjectId}
                      />
                    );
                    if (segment.type === 'header-stack') {
                      const stackKey = segment.items[0]?.node?.id ?? segment.items[0]?.index ?? 0;
                      return (
                        <div
                          key={`live-header-stack-${stackKey}`}
                          className="live-header-stack"
                          data-live-header-stack="true"
                        >
                          {segment.items.map(({ node, index }) => renderRootNode(node, index))}
                        </div>
                      );
                    }
                    const { node, index } = segment.items[0];
                    return renderRootNode(node, index);
                  })}
                </div>
              </div>
              </RuntimeProvider>
            ) : null}
            {!isLoading && tree?.length ? (
              <div className="bld-add-section-inline bld-add-section-inline--tail">
                <button
                  type="button"
                  className="bld-add-section-inline__btn"
                  onMouseEnter={(event) => showAddSectionPreviewAnchor(event.currentTarget, tree.length)}
                  onMouseLeave={hideAddSectionPreviewAnchorDebounced}
                  onClick={() => openAddSectionAt(tree.length)}
                  disabled={isCreatingNode}
                >
                  + Add Section
                </button>
              </div>
            ) : null}
            {isReorderingNode ? <div className="bld-canvas__hint">Saving reorder...</div> : null}
          </div>
        </div>
      </main>
      <AddSectionModal
        open={isAddSectionOpen}
        onClose={() => {
          if (isCreatingNode) return;
          setIsAddSectionOpen(false);
          setSectionInsertIndex(null);
        }}
        onSelect={handleSelectSectionStructure}
        onSelectPreset={handleSelectSectionPreset}
        initialTab={sectionModalTab}
        isBusy={isCreatingNode}
      />
      <WidgetPicker
        open={isWidgetPickerOpen}
        onClose={() => {
          if (isCreatingNode) return;
          setIsWidgetPickerOpen(false);
          setWidgetPickerTargetId(null);
        }}
        widgetEntries={widgetPickerEntries}
        isBusy={isCreatingNode}
        onSelect={async (widgetNodeType) => {
          if (!widgetPickerTargetId) return;
          if (onQuickAddNode) {
            await onQuickAddNode({ targetNodeId: widgetPickerTargetId, nodeType: widgetNodeType });
          } else {
            await onCreateNode?.({ nodeType: widgetNodeType, parentNodeId: widgetPickerTargetId });
          }
          setIsWidgetPickerOpen(false);
          setWidgetPickerTargetId(null);
        }}
      />
    </DndContext>
  );
}
