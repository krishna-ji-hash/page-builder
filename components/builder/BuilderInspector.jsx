'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { dataSourceRegistry } from '@/lib/runtime/dataSourceRegistry';
import { normalizeResponsiveStyle, stripDeviceLayoutKeysInStyleJson } from '@/lib/styleNormalizer';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import {
  buildInlineTextPropsPatch,
  inlineTextFormFromProps,
  isInlineTextInspectorKey,
  propsPatchForTextContent,
} from '@/lib/richTextNodeProps';
import { sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import { normalizeMenuAlign, normalizeMenuVariant } from '@/lib/menuNav';
import {
  normalizeMenuDrawerActionsLayout,
  normalizeMenuDrawerDensity,
  normalizeMenuHamburgerAlign,
  resolveMenuMobileBreakpointPx,
} from '@/lib/menuMobile';
import { normalizeMenuItems } from '@/lib/menuItems';
import { mergeDeviceStyleWithTypeDefaults, mergeMenuDeviceStyle } from '@/lib/nodeLayoutDefaults';
import {
  addBulletToActiveTab,
  newFeatureTabFromList,
  normalizeFeatureTabs,
  patchFeatureTabs,
} from '@/lib/featureTabsDefaults';
import {
  featureTabsChromeInspectorFields,
  featureTabsInspectorFormFromProps,
  isFeatureTabsChromeKey,
  patchFeatureTabsChromeFromKey,
} from '@/lib/featureTabsChrome';
import {
  advancedElementFormFromProps,
  advancedElementPatchFromFormKey,
  tryParseAdvancedElementJson,
} from '@/lib/advancedElementInspector';
import { appendFaqItem, normalizeFaqItems, patchFaqItems, removeFaqItemAt } from '@/lib/faqAccordionDefaults';
import { finalizeLeafDeviceStyle } from '@/lib/leafStylePipeline';
import { mergeNodeStyleWithSiteTheme, themeSpacingPx } from '@/lib/siteDesignTheme';
import { GAP_SCALE_IDS, inferGapScaleFromPx, withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { buildFlexLayoutPresets } from '@/lib/flexLayoutPresets';
import {
  applyHeaderAlignToRowStyleJson,
  headerLayoutMetaPatch,
  resolveHeaderLayoutMode,
} from '@/lib/headerLayoutMode';
import {
  applyBrandLogoSlotPatch,
  brandLogoFormFields,
  brandLogoPropsPatchFromFormKey,
  isBrandLogoInspectorNode,
} from '@/lib/headerLogo';
import {
  applyHeaderBehaviorToRowTree,
  headerBehaviorMetaPatch,
  normalizeHeaderBehavior,
} from '@/lib/headerBehavior';
import {
  headerRevealBarInspectorFormFields,
  isHeaderRevealBarStyleKey,
  patchHeaderRevealBarFromFormKey,
} from '@/lib/headerRevealBarStyle';
import { isFooterRowNode, isHeaderRowNode, isLayoutLockedRow } from '@/lib/rowLayoutMeta';
import { stripNaNFromStyleJson } from '@/lib/inspectorNumeric';
import {
  INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS,
  recordPendingInspectorForm,
  splitHeroFormFieldsFromProps,
} from '@/lib/splitHeroInspectorForm';
import {
  isSplitHeroCarouselNode,
  isSplitHeroCopyStyleKey,
  patchSplitHeroCopyTypoFromStyleKey,
  normalizeSplitHeroCopyTypo,
  splitHeroCopyTypoFromProps,
  splitHeroCtaOutlinePreset,
  splitHeroTypoInspectorFormFields,
} from '@/lib/splitHeroCopyTypography';
import { getDeviceStyle, styleToCss } from '@/lib/styleToCss';
import InspectorTabs from './inspector/InspectorTabs';
import LineToolsPanel from './inspector/LineToolsPanel';
import InspectorResponsiveBar from './inspector/InspectorResponsiveBar';
import ContentPanel from './inspector/ContentPanel';
import LayoutPanel from './inspector/LayoutPanel';
import StylePanel from './inspector/StylePanel';
import InteractionsPanel from './inspector/InteractionsPanel';
import FormBuilderPanel from './inspector/FormBuilderPanel';
import SeoCmsPanel from './inspector/SeoCmsPanel';
import AdvancedPanel from './inspector/AdvancedPanel';
import ThemePanel from './inspector/ThemePanel';
import OverflowSuggestions from './inspector/OverflowSuggestions';
import { getGlobalLinkMeta, isLinkedGlobalPlaceholder } from '@/lib/globalComponentLinkMeta';
import { isRootPageRow } from '@/lib/liveDocSectionSpacing';
import { resolveSectionWidthMode, SECTION_WIDTH_MODES } from '@/lib/liveContentContainer';
import {
  findAncestorRowNode,
  findDescendantNodeByType,
  findNodeInTree,
  mergeNodePropsJsonPatch,
} from '@/lib/builderTree';
import {
  applySectionLayoutToStyleJson,
  findSectionItemsHostNode,
  normalizeSectionLayout,
} from '@/lib/sectionLayout';
import {
  dividerOrientationFromProps,
  dividerSizePatchForOrientation,
  dividerSizePatchForThickness,
} from '@/lib/dividerDefaults';
import { boxSideDisplayValue, parseBoxShorthand } from '@/lib/parseBoxShorthand';
import { buildInspectorStylePatch, parsePxValue as parsePxFromPatch } from '@/lib/inspectorStylePatch';
import { getNodeCapabilities, inspectorTabsForNode } from '@/lib/nodeCapabilities';
import { getInspectorExtensions } from '@/lib/pluginInspectorRegistry';
import {
  clearInteractionGroup,
  interactionsForForm,
  patchInteractionGroup,
  pruneInteractions,
} from '@/lib/interactionInspectorUtils';

const IX_PREVIEW_MS = 48;
const IX_SAVE_MS = 420;
const IX_SAVE_IMMEDIATE_KEYS = new Set([
  'preset',
  'trigger',
  'loop',
  'background',
  'textColor',
  'borderColor',
  'ringColor',
]);
const IX_PREVIEW_IMMEDIATE_KEYS = new Set(['background', 'textColor', 'borderColor', 'ringColor', 'scale', 'translateY', 'opacity']);

function inspectorRoleLabel(node) {
  if (!node?.nodeType) return '';
  if (node.nodeType === 'row') return 'Section';
  if (node.nodeType === 'column') return 'Column';
  if (node.nodeType === 'stack') return 'Stack';
  if (node.nodeType === 'tabs') return 'Feature tabs';
  if (node.nodeType === 'accordion') return 'FAQ accordion';
  if (node.nodeType === 'icon') return 'Icon';
  if (node.nodeType === 'icon_box') return 'Icon box';
  if (node.nodeType === 'content_card') return 'Card';
  if (node.nodeType === 'spacer') return 'Spacer';
  if (node.nodeType === 'modal') return 'Modal';
  if (node.nodeType === 'video_embed') return 'Video embed';
  if (node.nodeType === 'map_embed') return 'Map embed';
  if (node.nodeType === 'social_icons') return 'Social icons';
  if (node.nodeType === 'container_box') return 'Container';
  if (node.nodeType === 'grid_block') return 'Grid';
  if (node.nodeType === 'alert_notice') return 'Alert';
  if (node.nodeType === 'badge_label') return 'Badge';
  if (node.nodeType === 'counter_block') return 'Counter';
  if (node.nodeType === 'progress_bar') return 'Progress bar';
  if (node.nodeType === 'rating_stars') return 'Rating';
  if (node.nodeType === 'testimonial_card') return 'Testimonial';
  if (node.nodeType === 'pricing_card') return 'Pricing card';
  if (node.nodeType === 'newsletter_form') return 'Newsletter';
  if (node.nodeType === 'whatsapp_button') return 'WhatsApp';
  if (node.nodeType === 'countdown_timer') return 'Countdown';
  if (node.nodeType === 'html_block') return 'HTML block';
  if (node.nodeType === 'code_block') return 'Code block';
  if (node.nodeType === 'lottie_animation') return 'Lottie';
  if (node.nodeType === 'logo_block') return 'Logo';
  if (node.nodeType === 'feature_list') return 'Feature list';
  if (node.nodeType === 'table_pro') return 'Table Pro';
  return 'Widget';
}

function getSelectedDeviceStyle(selectedNode, device) {
  return getDeviceStyle(selectedNode?.style_json || {}, device);
}

/** Resolved style for the active breakpoint: theme merge + type/menu defaults (matches canvas / liveRenderer). */
function getInspectorResolvedStyle(selectedNode, device, siteTheme) {
  const raw = getSelectedDeviceStyle(selectedNode, device);
  const nt = selectedNode?.nodeType;
  if (!nt) return mergeNodeStyleWithSiteTheme(raw, siteTheme, null, { treeNode: selectedNode });
  const themed = withResolvedLayoutGap(
    mergeNodeStyleWithSiteTheme(raw, siteTheme, nt, { treeNode: selectedNode }),
    siteTheme
  );
  if (nt === 'menu') {
    const orientation = selectedNode.props?.orientation === 'column' ? 'column' : 'row';
    return finalizeLeafDeviceStyle(
      selectedNode,
      device,
      mergeDeviceStyleWithTypeDefaults(
        nt,
        mergeMenuDeviceStyle(orientation, themed, { align: selectedNode.props?.align }, siteTheme),
        { treeNode: selectedNode }
      )
    );
  }
  return finalizeLeafDeviceStyle(
    selectedNode,
    device,
    mergeDeviceStyleWithTypeDefaults(nt, themed, { treeNode: selectedNode })
  );
}

function mergeStyleForDevice(selectedNode, device, patch, siteTheme, styleJsonOverride) {
  const nt = selectedNode?.nodeType ?? null;
  const sourceJson = styleJsonOverride !== undefined ? styleJsonOverride : selectedNode?.style_json;
  const normalized = normalizeResponsiveStyle(sourceJson || {}, { nodeType: nt, siteTheme });
  const desktopBase = normalized.desktop || {};
  const currentDevice = getDeviceStyle(normalized, device) || {};

  const merged = {
    ...currentDevice,
    layout: { ...(currentDevice.layout || {}), ...(patch.layout || {}) },
    spacing: mergeSpacingPatch(currentDevice.spacing || {}, patch.spacing || {}),
    size: { ...(currentDevice.size || {}), ...(patch.size || {}) },
    typography: { ...(currentDevice.typography || {}), ...(patch.typography || {}) },
    colors: { ...(currentDevice.colors || {}), ...(patch.colors || {}) },
    background: { ...(currentDevice.background || {}), ...(patch.background || {}) },
    effects: { ...(currentDevice.effects || {}), ...(patch.effects || {}) },
    border: { ...(currentDevice.border || {}), ...(patch.border || {}) },
    menu: {
      ...(currentDevice.menu || {}),
      ...(patch.menu || {}),
      dropdown: { ...(currentDevice.menu?.dropdown || {}), ...(patch.menu?.dropdown || {}) },
    },
    transform: { ...(currentDevice.transform || {}), ...(patch.transform || {}) },
  };
  if (patch.typography && patch.typography.fontFamily === null) {
    delete merged.typography.fontFamily;
    if (Object.keys(merged.typography).length === 0) delete merged.typography;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'interactions')) {
    const ix = patch.interactions;
    if (ix && typeof ix === 'object' && Object.keys(ix).length > 0) {
      merged.interactions = { ...ix };
    } else {
      delete merged.interactions;
    }
  } else if (currentDevice.interactions) {
    merged.interactions = { ...(currentDevice.interactions || {}) };
  }
  if (merged.spacing && typeof merged.spacing === 'object' && Object.keys(merged.spacing).length === 0) {
    delete merged.spacing;
  }

  const buildOverride = (baseGroup = {}, mergedGroup = {}) => {
    const out = {};
    Object.keys(mergedGroup || {}).forEach((key) => {
      if (mergedGroup[key] !== baseGroup?.[key]) out[key] = mergedGroup[key];
    });
    return Object.keys(out).length ? out : undefined;
  };

  const next = {
    ...normalized,
    desktop: desktopBase,
  };

  if (device === 'desktop') {
    next.desktop = merged;
    return stripNaNFromStyleJson(next);
  }

  next[device] = {
    layout: buildOverride(desktopBase.layout, merged.layout),
    spacing: buildOverride(desktopBase.spacing, merged.spacing),
    size: buildOverride(desktopBase.size, merged.size),
    typography: buildOverride(desktopBase.typography, merged.typography),
    colors: buildOverride(desktopBase.colors, merged.colors),
    background: buildOverride(desktopBase.background, merged.background),
    effects: buildOverride(desktopBase.effects, merged.effects),
    border: buildOverride(desktopBase.border, merged.border),
    menu: buildOverride(desktopBase.menu, merged.menu),
    interactions: buildOverride(desktopBase.interactions, merged.interactions),
    transform: buildOverride(desktopBase.transform, merged.transform),
  };

  Object.keys(next[device]).forEach((group) => {
    if (!next[device][group]) delete next[device][group];
  });

  return stripNaNFromStyleJson(next);
}

function hasRawDeviceOverrides(styleJson, deviceKey) {
  const layer = styleJson?.[deviceKey];
  return layer != null && typeof layer === 'object' && Object.keys(layer).length > 0;
}

function resetDeviceLayerStyleJson(selectedNode, deviceKey, siteTheme) {
  if (deviceKey !== 'tablet' && deviceKey !== 'mobile') return selectedNode?.style_json || {};
  const nt = selectedNode?.nodeType ?? null;
  const raw = { ...(selectedNode?.style_json || {}) };
  delete raw[deviceKey];
  return normalizeResponsiveStyle(raw, { nodeType: nt, siteTheme });
}

function effectiveHiddenForDevice(normalized, deviceKey) {
  const s = getDeviceStyle(normalized, deviceKey);
  const lo = s.layout || {};
  return (
    lo.visible === false ||
    lo.visible === 'hidden' ||
    lo.hidden === true ||
    lo.display === 'none'
  );
}

const LOCKED_LAYOUT_FORM_KEYS = new Set([
  'layoutDirection',
  'layoutFlexWrap',
  'layoutGapPx',
  'layoutGapScale',
  'layoutAlign',
  'layoutJustify',
  'containerWidthMode',
  'containerWidthPx',
  'rowWidthPercent',
  'widthMode',
  'widthPx',
  'heightPx',
]);

function parsePxValue(value, fallback = 0) {
  const num = parseFloat(String(value ?? '').replace('px', '').trim());
  return Number.isFinite(num) ? num : fallback;
}

/** Raw stored spacing for this breakpoint (no theme / type defaults). */
function getStoredSpacingShorthands(styleJson, device) {
  const s = styleJson && typeof styleJson === 'object' ? styleJson : {};
  let layerSpacing;
  if (device === 'desktop') {
    const hasDesktop = s.desktop != null && typeof s.desktop === 'object';
    const layer = hasDesktop ? s.desktop : s;
    layerSpacing = layer?.spacing;
  } else {
    layerSpacing = s[device]?.spacing;
  }
  if (!layerSpacing || typeof layerSpacing !== 'object') {
    return { margin: null, padding: null };
  }
  const m = layerSpacing.margin;
  const p = layerSpacing.padding;
  const margin =
    m !== undefined && m !== null && String(m).trim() !== '' ? String(m).trim() : null;
  const padding =
    p !== undefined && p !== null && String(p).trim() !== '' ? String(p).trim() : null;
  return { margin, padding };
}

function boxSidesFromShorthandOrUnset(shorthand) {
  if (shorthand == null || String(shorthand).trim() === '') {
    return { top: '', right: '', bottom: '', left: '' };
  }
  const parsed = parseBoxShorthand(shorthand);
  return {
    top: boxSideDisplayValue(parsed, 'top'),
    right: boxSideDisplayValue(parsed, 'right'),
    bottom: boxSideDisplayValue(parsed, 'bottom'),
    left: boxSideDisplayValue(parsed, 'left'),
  };
}

/** Inspector fields: prefer saved shorthand; if unset, show effective spacing (theme / type defaults) so values match canvas. */
function boxSidesFromStoredOrResolved(storedShorthand, resolvedShorthand) {
  const stored = storedShorthand != null ? String(storedShorthand).trim() : '';
  if (stored) return boxSidesFromShorthandOrUnset(stored);
  const resolved = resolvedShorthand != null ? String(resolvedShorthand).trim() : '';
  if (resolved) return boxSidesFromShorthandOrUnset(resolved);
  return { top: '', right: '', bottom: '', left: '' };
}

function mergeSpacingPatch(baseSpacing = {}, patchSpacing = {}) {
  const out = { ...(baseSpacing || {}) };
  for (const [k, v] of Object.entries(patchSpacing || {})) {
    if (v === null) delete out[k];
    else if (v !== undefined) out[k] = v;
  }
  return out;
}

export default function BuilderInspector({
  device = 'desktop',
  onDeviceChange,
  selectedNode,
  onUpdateNode,
  projectPages = [],
  projectId,
  pageId,
  activeTab: activeTabProp,
  onActiveTabChange,
  /** `rail` = embedded under library; `panel` / `default` = dedicated right column. */
  variant = 'default',
  onSetPreviewCssForNode,
  onSetFormPreviewModeForNode,
  formPreviewMode = null,
  onSetActiveSpacingEdit,
  overflowDiagnostics,
  onEditGlobalComponent,
  onDetachFromGlobalComponent,
  /** When true, selection is inside a section with `props.meta.sectionLocked`. */
  editingDisabledBySectionLock = false,
  /** Top-level page rows (same array the canvas passes as `tree`). Used for per-section page spacing overrides. */
  pageTree = [],
  onInsertDivider,
  canInsertDivider = true,
  isCreatingNode = false,
  onSelectNode,
  onApplyResponsiveToPage,
  isApplyingResponsive = false,
  hideBrandThemeSections = false,
}) {
  const [internalTab, setInternalTab] = useState('content');
  const activeTab = activeTabProp || internalTab;
  const setActiveTab = onActiveTabChange || setInternalTab;

  const availableTabs = useMemo(() => {
    const nt = selectedNode?.nodeType || 'widget';
    return inspectorTabsForNode(nt, { isTheme: activeTab === 'theme' });
  }, [selectedNode?.nodeType, activeTab]);

  const nodeCaps = useMemo(() => {
    const nt = selectedNode?.nodeType || 'widget';
    return getNodeCapabilities(nt, { selectedNode });
  }, [selectedNode]);

  const pluginPanelsForTab = useMemo(() => {
    const exts = getInspectorExtensions();
    const list = Array.isArray(exts?.inspectorPanels) ? exts.inspectorPanels : [];
    return list.filter((p) => p && typeof p === 'object' && String(p.tabId || '') === String(activeTab || ''));
  }, [activeTab]);

  // Keep activeTab valid as selection changes (prevents rendering empty panels).
  useEffect(() => {
    const ids = new Set((availableTabs || []).map((t) => t.id));
    if (!ids.has(activeTab)) {
      setActiveTab(ids.has('content') ? 'content' : (availableTabs?.[0]?.id || 'content'));
    }
  }, [activeTab, availableTabs, setActiveTab]);
  const { siteTheme, animationPresets } = useBuilderTheme();
  const ixPreviewTimerRef = useRef(null);
  const ixSaveTimerRef = useRef(null);
  const ixPendingIxRef = useRef(null);
  const selectedNodeRef = useRef(selectedNode);
  const deviceRef = useRef(device);
  const siteThemeRef = useRef(siteTheme);
  const onUpdateNodeRef = useRef(onUpdateNode);
  selectedNodeRef.current = selectedNode;
  deviceRef.current = device;
  siteThemeRef.current = siteTheme;
  onUpdateNodeRef.current = onUpdateNode;

  const nestedFeatureTabsNode = useMemo(() => {
    if (!selectedNode || selectedNode.nodeType === 'tabs') return null;
    return findDescendantNodeByType(selectedNode, 'tabs');
  }, [selectedNode]);

  useEffect(() => {
    if (
      selectedNode?.nodeType === 'tabs' ||
      selectedNode?.nodeType === 'accordion' ||
      nestedFeatureTabsNode
    ) {
      setActiveTab('content');
    }
  }, [selectedNode?.id, selectedNode?.nodeType, nestedFeatureTabsNode?.id, setActiveTab]);

  const nestedFaqAccordionNode = useMemo(() => {
    if (!selectedNode || selectedNode.nodeType === 'accordion') return null;
    return findDescendantNodeByType(selectedNode, 'accordion');
  }, [selectedNode]);

  /** Row that owns strip width for the current selection (selected row, or nearest ancestor row). */
  const sectionStripLayoutRow = useMemo(() => {
    if (!selectedNode || !Array.isArray(pageTree) || pageTree.length === 0) return null;
    if (selectedNode.nodeType === 'row') return selectedNode;
    if (selectedNode.id == null) return null;
    return findAncestorRowNode(pageTree, selectedNode.id);
  }, [selectedNode, pageTree]);

  const patchStripRowHeightPx = useCallback(
    async (raw) => {
      if (!sectionStripLayoutRow?.id || sectionStripLayoutRow.nodeType !== 'row') return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const n = raw === '' || raw == null ? 0 : Math.max(0, Math.min(9999, Number(raw) || 0));
      const patch = { size: { height: n > 0 ? `${n}px` : 'auto' } };
      const style_json = mergeStyleForDevice(sectionStripLayoutRow, device, patch, siteTheme);
      await onUpdateNode({ nodeId: sectionStripLayoutRow.id, payload: { style_json } });
    },
    [sectionStripLayoutRow, onUpdateNode, device, siteTheme, editingDisabledBySectionLock]
  );

  const patchStripRowPaddingY = useCallback(
    async (raw) => {
      if (!sectionStripLayoutRow?.id || sectionStripLayoutRow.nodeType !== 'row') return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const py = Math.max(0, Math.min(200, Math.round(Number(raw) || 0)));
      const patch = { spacing: { padding: `${py}px 24px` } };
      const style_json = mergeStyleForDevice(sectionStripLayoutRow, device, patch, siteTheme);
      await onUpdateNode({ nodeId: sectionStripLayoutRow.id, payload: { style_json } });
    },
    [sectionStripLayoutRow, onUpdateNode, device, siteTheme, editingDisabledBySectionLock]
  );

  const patchRootStripLayout = useCallback(
    async (strip) => {
      if (!sectionStripLayoutRow || sectionStripLayoutRow.nodeType !== 'row') return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const prevMeta =
        sectionStripLayoutRow.props?.meta &&
        typeof sectionStripLayoutRow.props.meta === 'object' &&
        !Array.isArray(sectionStripLayoutRow.props.meta)
          ? sectionStripLayoutRow.props.meta
          : {};
      const nextMeta = { ...prevMeta };
      const isRootHeaderFooter =
        Array.isArray(pageTree) &&
        pageTree.length > 0 &&
        isRootPageRow(pageTree, sectionStripLayoutRow) &&
        (isHeaderRowNode(sectionStripLayoutRow) || isFooterRowNode(sectionStripLayoutRow));
      const isRootContentStrip =
        Array.isArray(pageTree) &&
        pageTree.length > 0 &&
        isRootPageRow(pageTree, sectionStripLayoutRow) &&
        !isHeaderRowNode(sectionStripLayoutRow) &&
        !isFooterRowNode(sectionStripLayoutRow);
      if (isRootHeaderFooter || strip === 'fullBleed') {
        nextMeta.rootStripLayout = 'full';
        nextMeta.sectionWidthMode = 'fullWidth';
      } else if (strip === 'full' && isRootContentStrip) {
        nextMeta.rootStripLayout = 'full';
        nextMeta.sectionWidthMode = 'fullWidthContentBoxed';
      } else if (strip === 'full') {
        nextMeta.rootStripLayout = 'full';
        nextMeta.sectionWidthMode = 'fullWidth';
      } else {
        nextMeta.rootStripLayout = 'boxed';
        nextMeta.sectionWidthMode = 'boxed';
      }
      await onUpdateNode({
        nodeId: sectionStripLayoutRow.id,
        payload: {
          props: {
            ...sectionStripLayoutRow.props,
            meta: nextMeta,
          },
        },
      });
    },
    [sectionStripLayoutRow, pageTree, editingDisabledBySectionLock, onUpdateNode],
  );

  const patchSectionLayout = useCallback(
    async (layout) => {
      if (!sectionStripLayoutRow || sectionStripLayoutRow.nodeType !== 'row') return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const templateId = sectionStripLayoutRow.props?.meta?.sectionTemplate;
      if (!templateId) return;
      const nextLayout = normalizeSectionLayout(layout, templateId);
      const prevMeta =
        sectionStripLayoutRow.props?.meta &&
        typeof sectionStripLayoutRow.props.meta === 'object' &&
        !Array.isArray(sectionStripLayoutRow.props.meta)
          ? sectionStripLayoutRow.props.meta
          : {};
      const host = findSectionItemsHostNode(pageTree, sectionStripLayoutRow.id);
      const rowPayload = {
        props: {
          ...sectionStripLayoutRow.props,
          meta: { ...prevMeta, sectionLayout: nextLayout },
        },
      };
      if (prevMeta.sectionColumnLayout) {
        rowPayload.style_json = applySectionLayoutToStyleJson(sectionStripLayoutRow.style_json, nextLayout);
      }
      await onUpdateNode({
        nodeId: sectionStripLayoutRow.id,
        payload: rowPayload,
      });
      if (host?.id != null) {
        await onUpdateNode({
          nodeId: host.id,
          payload: {
            style_json: applySectionLayoutToStyleJson(host.style_json, nextLayout),
          },
        });
      }
    },
    [sectionStripLayoutRow, pageTree, editingDisabledBySectionLock, onUpdateNode]
  );

  const patchHeaderBehavior = useCallback(
    async (patch) => {
      if (!sectionStripLayoutRow || sectionStripLayoutRow.nodeType !== 'row') return;
      if (!isHeaderRowNode(sectionStripLayoutRow)) return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const prevMeta =
        sectionStripLayoutRow.props?.meta &&
        typeof sectionStripLayoutRow.props.meta === 'object' &&
        !Array.isArray(sectionStripLayoutRow.props.meta)
          ? sectionStripLayoutRow.props.meta
          : {};
      const nextMeta = headerBehaviorMetaPatch(prevMeta, patch);
      const patched = applyHeaderBehaviorToRowTree(
        {
          displayName: sectionStripLayoutRow.displayName,
          props: { ...(sectionStripLayoutRow.props || {}), meta: nextMeta },
          style_json: sectionStripLayoutRow.style_json,
        },
        nextMeta.headerBehavior
      );
      await onUpdateNode({
        nodeId: sectionStripLayoutRow.id,
        payload: {
          props: patched.props,
          style_json: patched.style_json,
        },
      });
    },
    [sectionStripLayoutRow, editingDisabledBySectionLock, onUpdateNode]
  );

  const patchHeaderRevealBarField = useCallback(
    async (key, value) => {
      if (!sectionStripLayoutRow || sectionStripLayoutRow.nodeType !== 'row') return;
      if (!isHeaderRowNode(sectionStripLayoutRow)) return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const prevMeta =
        sectionStripLayoutRow.props?.meta &&
        typeof sectionStripLayoutRow.props.meta === 'object' &&
        !Array.isArray(sectionStripLayoutRow.props.meta)
          ? sectionStripLayoutRow.props.meta
          : {};
      const prevHb = normalizeHeaderBehavior(prevMeta.headerBehavior);
      const nextRevealBar = patchHeaderRevealBarFromFormKey(key, value, prevHb);
      if (!nextRevealBar) return;
      const nextHb = { ...prevHb, revealBar: nextRevealBar };
      const nextMeta = { ...prevMeta, headerBehavior: nextHb };
      pendingStyleFormRef.current = {
        ...pendingStyleFormRef.current,
        [key]: { value, ts: Date.now() },
      };
      setForm((prev) => ({
        ...prev,
        [key]: value,
        ...headerRevealBarInspectorFormFields(nextHb),
      }));
      await onUpdateNode({
        nodeId: sectionStripLayoutRow.id,
        payload: {
          props: {
            ...(sectionStripLayoutRow.props || {}),
            meta: nextMeta,
          },
        },
      });
    },
    [sectionStripLayoutRow, editingDisabledBySectionLock, onUpdateNode]
  );

  const patchHeaderLayoutMode = useCallback(
    async (mode) => {
      if (!sectionStripLayoutRow || sectionStripLayoutRow.nodeType !== 'row') return;
      if (!isHeaderRowNode(sectionStripLayoutRow)) return;
      if (isLinkedGlobalPlaceholder(sectionStripLayoutRow)) return;
      if (editingDisabledBySectionLock) return;
      if (!onUpdateNode) return;
      const prevMeta =
        sectionStripLayoutRow.props?.meta &&
        typeof sectionStripLayoutRow.props.meta === 'object' &&
        !Array.isArray(sectionStripLayoutRow.props.meta)
          ? sectionStripLayoutRow.props.meta
          : {};
      const nextMeta = headerLayoutMetaPatch(mode, prevMeta);
      const nextStyleJson = applyHeaderAlignToRowStyleJson(
        sectionStripLayoutRow.style_json,
        nextMeta.headerAlign
      );
      await onUpdateNode({
        nodeId: sectionStripLayoutRow.id,
        payload: {
          props: {
            ...sectionStripLayoutRow.props,
            meta: nextMeta,
          },
          style_json: nextStyleJson,
        },
      });
    },
    [sectionStripLayoutRow, editingDisabledBySectionLock, onUpdateNode],
  );

  // Prevent "snap back" in selects when parent re-renders selectedNode before async save completes.
  const pendingCarouselVariantRef = useRef(null);
  // Same issue for other carousel fields (number inputs + other selects/toggles).
  // Parent often provides a new `selectedNode` object before async save completes, so we keep a short-lived draft.
  const pendingCarouselFormRef = useRef({});
  /** Layout/size numeric fields — avoids useEffect form sync fighting InspectorNumInput (infinite setState loop). */
  const pendingStyleFormRef = useRef({});
  const styleChangeInFlightRef = useRef(0);
  /** Blocks useEffect form sync while async content saves are in flight (prevents update loops). */
  const contentChangeInFlightRef = useRef(0);
  const [jsonErrors, setJsonErrors] = useState({
    tableColumnsJson: '',
    formFieldsJson: '',
    actionJson: '',
    menuItemsJson: '',
    carouselSlidesJson: '',
    featureTabsJson: '',
    faqAccordionJson: '',
    socialIconsJson: '',
    gridItemsJson: '',
    featureListJson: '',
    tableProHeadersJson: '',
    tableProRowsJson: '',
  });
  const [form, setForm] = useState({
    text: '',
    href: '',
    openInNewTab: false,
    alignment: 'left',
    size: 'medium',
    src: '',
    alt: '',
    imageFit: 'cover',
    imageHeightPx: 0,
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: '400',
    lineHeight: '1.4',
    letterSpacingPx: 0,
    textTransform: 'none',
    textDecoration: 'none',
    whiteSpace: 'normal',
    textColor: '#0f172a',
    bgColor: '#ffffff',
    bgImageUrl: '',
    bgImageAlt: '',
    bgImageTitle: '',
    bgSize: 'cover',
    bgPosition: 'center center',
    bgRepeat: 'no-repeat',
    boxShadow: 'none',
    opacity: '1',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    borderRadiusPx: 0,
    borderWidthPx: 0,
    borderColor: '#dddddd',
    padding: '0px',
    margin: '0px 0px 0px 0px',
    paddingAdvanced: '0px 0px 0px 0px',
    position: 'static',
    left: '',
    top: '',
    right: '',
    bottom: '',
    zIndex: '',
    dataSourceResource: 'users',
    tableColumnsJson: '[]',
    formFieldsJson: '[]',
    submitLabel: 'Submit',
    buttonType: 'default',
    buttonIcon: '',
    buttonIconPosition: 'after',
    buttonIconSpacing: 10,
    buttonId: '',
    layoutDirection: 'row',
    layoutFlexWrap: 'nowrap',
    layoutGapScale: '',
    layoutGapPx: 0,
    layoutAlign: 'stretch',
    layoutJustify: 'flex-start',
    layoutAlignContent: 'stretch',
    widthMode: 'auto',
    widthPx: 320,
    heightPx: 0,
    containerWidthMode: 'full', // row only: full | boxed
    containerWidthPx: 1200, // row only (boxed max-width)
    rowWidthPercent: 100, // row + full: layout.maxWidth as % (100 = full strip)
    actionType: 'none',
    actionJson: '{}',
    menuDirection: 'row',
    menuAriaLabel: 'Main navigation',
    menuItemsJson: '[]',
    menuTextColor: '#0f172a',
    menuGapPx: 12,
    menuItemPadding: '6px 12px',
    menuBorderRadius: '20px',
    menuHoverColor: '#6366f1',
    menuHoverBg: '#f1f5ff',
    menuDdItemFontSizePx: 0,
    menuDdItemPadding: '',
    menuDdWidth: '',
    menuDdMinWidth: '',
    menuDdMaxWidth: '',
    menuDdOverflow: 'visible',
    menuDdChevronVariant: 'chevron',
    menuDdChevronSizePx: 0,
    menuDdChevronGapPx: 0,
    menuDdShadow: '',
    menuDdBorderRadiusPx: 0,
    menuDdItemGapPx: 0,
    menuDdOffsetXPx: 0,
    menuDdOffsetYPx: 0,
    menuDdNestedIndentPx: 0,
    menuDdNestedGapPx: 0,
    menuDdNestedMode: 'toggle',
    menuDdNestedDefaultOpen: false,
    menuUseProjectPages: false,
    menuVariant: 'pill',
    stylePresetId: '',
    styleVariant: '',
    menuAlign: 'center',
    menuMegaEnabled: false,
    menuMegaColumns: 2,
    menuMobileEnabled: true,
    menuMobileHamburgerAlign: 'right',
    menuMobileTitle: '',
    menuMobileHamburgerLabel: '',
    menuMobileShowDrawerActions: true,
    menuMobileDrawerActionsLayout: 'row',
    menuMobileDrawerDensity: 'compact',
    menuMobileBreakpointPx: 1024,
    richTextHtml: '',
    inlineTextMode: 'plain',
    marqueeEnabled: false,
    marqueeDirection: 'left',
    marqueeSpeed: 'normal',
    marqueeDuration: 18,
    marqueePauseOnHover: true,
    marqueeLoop: true,
    marqueeGapPx: 0,
    marqueeMobileEnabled: true,
    textBlockIconEnabled: false,
    textBlockIconName: '★',
    textBlockIconPosition: 'before',
    textBlockIconColor: '',
    textBlockIconSize: 16,
    textBlockIconSpacing: 8,
    animationPreset: 'none',
    animationDuration: 0.6,
    animationDelay: 0,
    carouselSlidesJson: '[]',
    featureTabsJson: '[]',
    featureTabsActiveId: '',
    featureTabsImageFit: 'cover',
    featureTabsImageHeightPx: '360',
    featureTabsTabAlign: 'center',
    featureTabsBarBg: '',
    featureTabsActiveTabColor: '',
    featureTabsActiveTabUnderline: '',
    featureTabsPanelBg: '',
    featureTabsPanelBorderColor: '',
    featureTabsPanelBorderWidthPx: 0,
    featureTabsPanelRadiusPx: 0,
    featureTabsBlockMaxWidthPct: 100,
    faqAccordionJson: '[]',
    headerBehaviorType: 'normal',
    headerBehaviorVariant: 'default',
    headerRevealAfter: 120,
    headerRevealBarMaxWidthPct: 100,
    headerRevealBarOffsetTopPx: 0,
    headerRevealBarBackgroundColor: '',
    headerRevealBarBorderColor: '',
    headerRevealBarBorderWidthPx: 0,
    headerRevealBarBorderRadiusPx: 0,
    headerRevealBarShadow: 'none',
    carouselVariant: 'image',
    carouselAutoplay: false,
    carouselLoop: true,
    carouselArrows: true,
    carouselDots: true,
    carouselSpeedMs: '500',
    carouselIntervalMs: '3000',
    carouselGapPx: '16',
    carouselPerView: '1',
    carouselPauseOnHover: true,
    carouselImageFit: 'cover',
    splitHeroVisualFrame: 'none',
    splitHeroVisualShadow: 'none',
    splitHeroVisualBorder: 'show',
    splitHeroVisualBgColor: '',
    splitHeroVisualBorderColor: '',
    splitHeroVisualWidthPct: '40',
    splitHeroVisualMinHeightPx: '0',
    splitHeroVisualOffsetXPx: '0',
    splitHeroVisualOffsetYPx: '0',
    splitHeroNavOffsetXPx: '0',
    splitHeroNavOffsetYPx: '0',
    splitHeroImageMaxHeightPx: '300',
    splitHeroImageScalePct: '100',
    splitHeroSectionMinHeightPx: '0',
    splitHeroSectionMaxHeightPx: '',
    sectionHeightPx: '560',
    carouselImageObjectPosition: 'center',
    carouselTickerDurationSec: '32',
    carouselScrollDirection: 'right',
    carouselTransitionEasing: 'ease',
    carouselTransitionEffect: 'slide',
    carouselShowOverlay: false,
  });

  const hasTabletOverrides = useMemo(
    () => hasRawDeviceOverrides(selectedNode?.style_json, 'tablet'),
    [selectedNode?.style_json]
  );
  const hasMobileOverrides = useMemo(
    () => hasRawDeviceOverrides(selectedNode?.style_json, 'mobile'),
    [selectedNode?.style_json]
  );

  const visibilityByDevice = useMemo(() => {
    if (!selectedNode) return { desktop: false, tablet: false, mobile: false };
    const nt = selectedNode.nodeType ?? null;
    const normalized = normalizeResponsiveStyle(selectedNode.style_json || {}, { nodeType: nt, siteTheme });
    return {
      desktop: effectiveHiddenForDevice(normalized, 'desktop'),
      tablet: effectiveHiddenForDevice(normalized, 'tablet'),
      mobile: effectiveHiddenForDevice(normalized, 'mobile'),
    };
  }, [selectedNode, selectedNode?.style_json, siteTheme]);

  useEffect(() => {
    if (!selectedNode) return;
    const style = getInspectorResolvedStyle(selectedNode, device, siteTheme);
    const storedSp = getStoredSpacingShorthands(selectedNode.style_json, device);
    const marginSides = boxSidesFromStoredOrResolved(storedSp.margin, style?.spacing?.margin);
    const paddingSides = boxSidesFromStoredOrResolved(storedSp.padding, style?.spacing?.padding);
    const maxWidthRaw = String(style?.layout?.maxWidth || '').trim();
    const hasAutoMargins = String(style?.spacing?.margin || '').includes('auto');
    let parsedMaxWidthPx = parsePxValue(maxWidthRaw, 1280);
    let inferredContainerWidthMode = 'full';
    let inferredSectionWidthMode = '';
    let rowWidthPercent = 100;
    if (selectedNode?.nodeType === 'row') {
      const rowMeta = selectedNode.props?.meta || {};
      const isRootLandmark =
        Array.isArray(pageTree) &&
        pageTree.length > 0 &&
        isRootPageRow(pageTree, selectedNode) &&
        (isHeaderRowNode(selectedNode) || isFooterRowNode(selectedNode));
      const isRootContent =
        Array.isArray(pageTree) &&
        pageTree.length > 0 &&
        isRootPageRow(pageTree, selectedNode) &&
        !isHeaderRowNode(selectedNode) &&
        !isFooterRowNode(selectedNode);
      if (isRootLandmark) {
        const contentKey = isHeaderRowNode(selectedNode) ? 'headerContentWidth' : 'footerContentWidth';
        const contentMode = String(rowMeta[contentKey] || '').toLowerCase().trim();
        inferredContainerWidthMode =
          contentMode === 'full' || resolveHeaderLayoutMode(rowMeta) === 'spread' ? 'full' : 'boxed';
        const metaMax = Number(
          rowMeta.headerContentMaxWidthPx ?? rowMeta.footerContentMaxWidthPx ?? parsedMaxWidthPx
        );
        if (Number.isFinite(metaMax) && metaMax >= 320) {
          parsedMaxWidthPx = Math.min(2400, Math.floor(metaMax));
        }
      } else if (isRootContent) {
        inferredSectionWidthMode = resolveSectionWidthMode(rowMeta, {
          isLiveDocRootRow: true,
          isRootContentRow: true,
        });
        const sectionMax = Number(rowMeta.sectionContentMaxWidthPx);
        if (Number.isFinite(sectionMax) && sectionMax >= 320) {
          parsedMaxWidthPx = Math.min(2400, Math.floor(sectionMax));
        }
        inferredContainerWidthMode =
          inferredSectionWidthMode === SECTION_WIDTH_MODES.BOXED ? 'boxed' : 'full';
      } else if (maxWidthRaw.endsWith('px') && hasAutoMargins) {
        inferredContainerWidthMode = 'boxed';
      } else if (maxWidthRaw.endsWith('%')) {
        inferredContainerWidthMode = 'full';
        rowWidthPercent = Math.min(100, Math.max(10, parseFloat(maxWidthRaw) || 100));
      } else {
        inferredContainerWidthMode = 'full';
      }
    }
    const tabsEditNode =
      selectedNode.nodeType === 'tabs' ? selectedNode : findDescendantNodeByType(selectedNode, 'tabs');
    const tabsEditProps = tabsEditNode?.props;

    const nodeCarouselVariant = String(selectedNode.props?.variant || selectedNode.props?.settings?.variant || 'image');
    const pendingVariant = pendingCarouselVariantRef.current;
    const shouldUsePendingVariant =
      pendingVariant &&
      pendingVariant.value &&
      pendingVariant.value !== nodeCarouselVariant &&
      Date.now() - pendingVariant.ts < 1500;

    if (styleChangeInFlightRef.current > 0 || contentChangeInFlightRef.current > 0) return;

    const pickPendingFromRef = (ref, fieldKey, nodeValue, ttlMs = 1500) => {
      const p = ref?.[fieldKey];
      if (!p) return null;
      if (Date.now() - p.ts >= ttlMs) return null;
      return p.value !== nodeValue ? p.value : nodeValue;
    };
    const pickPending = (fieldKey, nodeValue) => {
      const styleDraft = pickPendingFromRef(pendingStyleFormRef.current, fieldKey, nodeValue, 2000);
      if (styleDraft != null) return styleDraft;
      const carouselDraft = pickPendingFromRef(pendingCarouselFormRef.current, fieldKey, nodeValue, 1500);
      if (carouselDraft != null) return carouselDraft;
      return nodeValue;
    };

    setForm({
      text: selectedNode.props?.text || '',
      href: selectedNode.props?.href || '',
      openInNewTab: Boolean(selectedNode.props?.openInNewTab),
      alignment: style?.typography?.textAlign || 'left',
      size: selectedNode.props?.size || 'medium',
      src: selectedNode.props?.src || '',
      alt: selectedNode.props?.alt || '',
      imageFit: selectedNode.props?.imageFit || 'cover',
      imageHeightPx: Number(selectedNode.props?.imageHeightPx || 0),
      fontFamily: style?.typography?.fontFamily || '',
      fontSizePx: parsePxValue(style?.typography?.fontSize, 16),
      fontWeight: style?.typography?.fontWeight || '400',
      lineHeight: style?.typography?.lineHeight || '1.4',
      letterSpacingPx: parsePxValue(style?.typography?.letterSpacing, 0),
      textTransform: style?.typography?.textTransform || 'none',
      textDecoration: style?.typography?.textDecoration || 'none',
      whiteSpace: (() => {
        const w = String(style?.typography?.whiteSpace || '').trim();
        if (w) return w;
        return selectedNode?.nodeType === 'text' ? 'pre-wrap' : 'normal';
      })(),
      textColor: style?.colors?.textColor || style?.typography?.color || '#0f172a',
      dividerOrientation: selectedNode.props?.orientation === 'vertical' ? 'vertical' : 'horizontal',
      dividerThicknessPx: Number(selectedNode.props?.thicknessPx) > 0 ? Number(selectedNode.props.thicknessPx) : 2,
    bgColor: style?.colors?.backgroundColor || style?.background?.backgroundColor || '#ffffff',
    bgImageUrl: style?.background?.backgroundImage || '',
    bgImageAlt: style?.background?.meta?.altText || '',
    bgImageTitle: style?.background?.meta?.title || '',
    bgSize: style?.background?.backgroundSize ? String(style.background.backgroundSize) : 'cover',
    bgPosition: style?.background?.backgroundPosition ? String(style.background.backgroundPosition) : 'center center',
    bgRepeat: style?.background?.backgroundRepeat ? String(style.background.backgroundRepeat) : 'no-repeat',
    boxShadow: (() => {
      const bs = style?.effects?.boxShadow;
      if (bs == null || String(bs).trim() === '') return 'none';
      return String(bs);
    })(),
    opacity: (() => {
      const o = style?.effects?.opacity;
      if (o == null || o === '') return '1';
      return String(o);
    })(),
      marginTop: marginSides.top,
      marginRight: marginSides.right,
      marginBottom: marginSides.bottom,
      marginLeft: marginSides.left,
      paddingTop: paddingSides.top,
      paddingRight: paddingSides.right,
      paddingBottom: paddingSides.bottom,
      paddingLeft: paddingSides.left,
      borderRadiusPx: parsePxValue(style?.border?.radius || style?.effects?.borderRadius, 0),
      borderWidthPx: parsePxValue(style?.border?.width, 0),
      borderColor: style?.border?.color || '#dddddd',
      padding: storedSp.padding ?? style?.spacing?.padding ?? '',
      margin: storedSp.margin ?? style?.spacing?.margin ?? '',
      paddingAdvanced: storedSp.padding ?? style?.spacing?.padding ?? '',
      position: style?.layout?.position || 'static',
      left: style?.layout?.left ?? '',
      top: style?.layout?.top ?? '',
      right: style?.layout?.right ?? '',
      bottom: style?.layout?.bottom ?? '',
      zIndex: style?.layout?.zIndex ?? '',
      layoutDisplay: style?.layout?.display || '',
      layoutOverflow: style?.layout?.overflow || '',
      layoutAlignSelf: style?.layout?.alignSelf || '',
      layoutOrder: style?.layout?.order ?? '',
      layoutFlexGrow: style?.layout?.flexGrow ?? '',
      layoutFlexShrink: style?.layout?.flexShrink ?? '',
      layoutFlexBasis: style?.layout?.flexBasis ?? '',
      sizeMinWidth: style?.size?.minWidth || style?.layout?.minWidth || '',
      sizeMaxWidth: style?.size?.maxWidth || style?.layout?.maxWidth || '',
      sizeMinHeight: style?.size?.minHeight || '',
      sizeMaxHeight: style?.size?.maxHeight || '',
      transformRotate: style?.transform?.rotate ?? '',
      transformScale: style?.transform?.scale ?? '',
      transformTranslateX: style?.transform?.translateX ?? '',
      transformTranslateY: style?.transform?.translateY ?? '',
      transformSkewX: style?.transform?.skewX ?? '',
      transformSkewY: style?.transform?.skewY ?? '',
      effectBlur: style?.effects?.blur ?? '',
      effectBackdropBlur: style?.effects?.backdropFilter?.replace(/^blur\(/i, '').replace(/\)$/, '') ?? '',
      effectBrightness: style?.effects?.brightness ?? '',
      effectContrast: style?.effects?.contrast ?? '',
      effectSaturation: style?.effects?.saturate ?? '',
      effectGrayscale: style?.effects?.grayscale ?? '',
      effectBlendMode: style?.effects?.blendMode || style?.background?.blendMode || '',
      textShadow: style?.typography?.textShadow || style?.effects?.textShadow || '',
      interactions: interactionsForForm(style?.interactions),
      dataSourceResource: selectedNode.dataJson?.source?.resource || 'users',
      tableColumnsJson: JSON.stringify(selectedNode.props?.columns || [], null, 2),
      formFieldsJson: JSON.stringify(selectedNode.props?.fields || [], null, 2),
      submitLabel: selectedNode.props?.submitLabel || 'Submit',
      buttonType: selectedNode.props?.type || 'default',
      buttonIcon: selectedNode.props?.icon || '',
      buttonIconPosition: selectedNode.props?.iconPosition || 'after',
      buttonIconSpacing: Number(selectedNode.props?.iconSpacing ?? 10),
      buttonId: selectedNode.props?.buttonId || '',
      layoutDirection:
        style?.layout?.flexDirection || (selectedNode?.nodeType === 'row' ? 'row' : 'column'),
      layoutFlexWrap: String(style?.layout?.flexWrap || 'nowrap'),
      layoutGapScale: pickPending(
        'layoutGapScale',
        (() => {
          const gs = style?.layout?.gapScale;
          if (typeof gs === 'string' && GAP_SCALE_IDS.includes(gs)) return gs;
          return inferGapScaleFromPx(style?.layout?.gap, siteTheme) || '';
        })()
      ),
      layoutGapPx: pickPending('layoutGapPx', parsePxValue(style?.layout?.gap, 0)),
      layoutAlign: style?.layout?.alignItems || 'stretch',
      layoutJustify: style?.layout?.justifyContent || 'flex-start',
      layoutAlignContent: style?.layout?.alignContent || 'stretch',
      widthMode:
        String(style?.size?.width || '') === '100%'
          ? 'full'
          : String(style?.size?.width || '').endsWith('px')
            ? 'px'
            : 'auto',
      widthPx: pickPending('widthPx', parsePxValue(style?.size?.width, 320)),
      heightPx: pickPending('heightPx', parsePxValue(style?.size?.height, 0)),
      containerWidthMode: inferredContainerWidthMode,
      containerWidthPx: pickPending('containerWidthPx', parsedMaxWidthPx || 1280),
      sectionWidthMode: inferredSectionWidthMode,
      rowWidthPercent: pickPending('rowWidthPercent', rowWidthPercent),
      actionType: selectedNode.actionsJson?.onClick?.type || 'none',
      actionJson: JSON.stringify(selectedNode.actionsJson || {}, null, 2),
      menuDirection: selectedNode.props?.orientation === 'column' ? 'column' : 'row',
      menuAriaLabel: selectedNode.props?.ariaLabel || 'Main navigation',
      menuItemsJson: JSON.stringify(Array.isArray(selectedNode.props?.items) ? selectedNode.props.items : [], null, 2),
      menuTextColor: style?.typography?.color || style?.colors?.textColor || '#0f172a',
      menuGapPx: parsePxValue(style?.menu?.gap, 12),
      menuItemPadding: style?.menu?.itemPadding || '6px 12px',
      menuBorderRadius: style?.menu?.borderRadius || '20px',
      menuHoverColor: style?.menu?.hoverColor || '#6366f1',
      menuHoverBg: style?.menu?.hoverBg || '#f1f5ff',
      menuDdItemFontSizePx: Number(style?.menu?.dropdown?.itemFontSizePx || 0),
      menuDdItemPadding: style?.menu?.dropdown?.itemPadding || '',
      menuDdWidth: style?.menu?.dropdown?.width || '',
      menuDdMinWidth: style?.menu?.dropdown?.minWidth || '',
      menuDdMaxWidth: style?.menu?.dropdown?.maxWidth || '',
      menuDdOverflow: style?.menu?.dropdown?.overflow || 'visible',
      menuDdChevronVariant: style?.menu?.dropdown?.chevronVariant || 'chevron',
      menuDdChevronSizePx: Number(style?.menu?.dropdown?.chevronSizePx || 0),
      menuDdChevronGapPx: Number(style?.menu?.dropdown?.chevronGapPx || 0),
      menuDdShadow: style?.menu?.dropdown?.shadow || '',
      menuDdBorderRadiusPx: Number(style?.menu?.dropdown?.borderRadiusPx || 0),
      menuDdItemGapPx: Number(style?.menu?.dropdown?.itemGapPx || 0),
      menuDdOffsetXPx: Number(style?.menu?.dropdown?.offsetXPx || 0),
      menuDdOffsetYPx: Number(style?.menu?.dropdown?.offsetYPx || 0),
      menuDdNestedIndentPx: Number(style?.menu?.dropdown?.nestedIndentPx || 0),
      menuDdNestedGapPx: Number(style?.menu?.dropdown?.nestedGapPx || 0),
      menuDdNestedMode: style?.menu?.dropdown?.nestedMode || 'toggle',
      menuDdNestedDefaultOpen: Boolean(style?.menu?.dropdown?.nestedDefaultOpen),
      menuUseProjectPages: Boolean(selectedNode.props?.useProjectPages),
      menuVariant: normalizeMenuVariant(selectedNode.props?.variant),
      stylePresetId: selectedNode.props?.presetId || '',
      styleVariant:
        selectedNode.nodeType !== 'menu' && selectedNode.nodeType !== 'carousel'
          ? String(selectedNode.props?.variant || '')
          : '',
      menuAlign: normalizeMenuAlign(selectedNode.props?.align),
      menuMegaEnabled: Boolean(selectedNode.props?.mega?.enabled),
      menuMegaColumns: Number(selectedNode.props?.mega?.columns ?? 2),
      menuMobileEnabled: selectedNode.props?.mobile?.enabled !== false,
      menuMobileHamburgerAlign: normalizeMenuHamburgerAlign(selectedNode.props?.mobile?.hamburgerAlign, 'right'),
      menuMobileTitle: typeof selectedNode.props?.mobile?.title === 'string' ? selectedNode.props.mobile.title : '',
      menuMobileHamburgerLabel:
        typeof selectedNode.props?.mobile?.hamburgerLabel === 'string' ? selectedNode.props.mobile.hamburgerLabel : '',
      menuMobileShowDrawerActions: selectedNode.props?.mobile?.showDrawerActions !== false,
      menuMobileDrawerActionsLayout: normalizeMenuDrawerActionsLayout(
        selectedNode.props?.mobile?.drawerActionsLayout,
        'row'
      ),
      menuMobileDrawerDensity: normalizeMenuDrawerDensity(selectedNode.props?.mobile?.drawerDensity, 'compact'),
      menuMobileBreakpointPx: resolveMenuMobileBreakpointPx(selectedNode.props?.mobile || {}),
      richTextHtml: selectedNode.props?.content || '',
      ...(selectedNode.nodeType === 'heading' || selectedNode.nodeType === 'text'
        ? inlineTextFormFromProps(selectedNode.props || {})
        : {}),
      animationPreset: selectedNode.props?.animation?.preset || 'none',
      animationDuration: Number(selectedNode.props?.animation?.duration ?? 0.6),
      animationDelay: Number(selectedNode.props?.animation?.delay ?? 0),
      carouselSlidesJson: JSON.stringify(Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [], null, 2),
      ...(tabsEditProps
        ? featureTabsInspectorFormFromProps(tabsEditProps, pickPending)
        : featureTabsInspectorFormFromProps({}, pickPending)),
      faqAccordionJson: JSON.stringify(
        Array.isArray(selectedNode.props?.items) ? selectedNode.props.items : [],
        null,
        2
      ),
      ...(isHeaderRowNode(selectedNode)
        ? (() => {
            const hb = normalizeHeaderBehavior(selectedNode.props?.meta?.headerBehavior);
            return {
              headerBehaviorType: hb.type,
              headerBehaviorVariant: hb.variant,
              headerRevealAfter: hb.revealAfter,
              ...headerRevealBarInspectorFormFields(hb, pickPending),
            };
          })()
        : {}),
      ...(isBrandLogoInspectorNode(selectedNode, pageTree)
        ? brandLogoFormFields(selectedNode.props || {})
        : {}),
      ...advancedElementFormFromProps(selectedNode.props || {}),
      carouselVariant: pickPending(
        'carouselVariant',
        shouldUsePendingVariant ? pendingVariant.value : nodeCarouselVariant
      ),
      carouselAutoplay: pickPending(
        'carouselAutoplay',
        Boolean(selectedNode.props?.autoplay ?? selectedNode.props?.settings?.autoplay ?? false)
      ),
      carouselLoop: pickPending(
        'carouselLoop',
        Boolean(selectedNode.props?.loop ?? (selectedNode.props?.settings?.loop !== false))
      ),
      carouselArrows: pickPending(
        'carouselArrows',
        Boolean(selectedNode.props?.showArrows ?? (selectedNode.props?.settings?.arrows !== false))
      ),
      carouselDots: pickPending(
        'carouselDots',
        Boolean(selectedNode.props?.showDots ?? (selectedNode.props?.settings?.dots !== false))
      ),
      carouselSpeedMs: pickPending(
        'carouselSpeedMs',
        String(Number(selectedNode.props?.speed ?? selectedNode.props?.settings?.speedMs ?? 500))
      ),
      carouselIntervalMs: pickPending(
        'carouselIntervalMs',
        String(Number(selectedNode.props?.interval ?? selectedNode.props?.settings?.autoplayMs ?? 3000))
      ),
      carouselGapPx: pickPending(
        'carouselGapPx',
        String(Number(selectedNode.props?.gap ?? selectedNode.props?.settings?.gapPx ?? 16))
      ),
      carouselPauseOnHover: pickPending(
        'carouselPauseOnHover',
        Boolean(selectedNode.props?.pauseOnHover ?? true)
      ),
      carouselImageFit: pickPending(
        'carouselImageFit',
        String(selectedNode.props?.imageFit || selectedNode.props?.settings?.imageFit || 'cover')
      ),
      splitHeroVisualFrame: pickPending(
        'splitHeroVisualFrame',
        String(selectedNode.props?.splitHeroVisualFrame || 'none').toLowerCase() === 'card' ? 'card' : 'none'
      ),
      splitHeroVisualShadow: pickPending('splitHeroVisualShadow', (() => {
        const s = String(selectedNode.props?.splitHeroVisualShadow || 'none').toLowerCase().trim();
        return s === 'light' || s === 'medium' ? s : 'none';
      })()),
      splitHeroVisualBorder: pickPending('splitHeroVisualBorder', (() => {
        const b = String(selectedNode.props?.splitHeroVisualBorder || 'show').toLowerCase().trim();
        return b === 'none' ? 'none' : 'show';
      })()),
      splitHeroVisualBgColor: pickPending(
        'splitHeroVisualBgColor',
        String(selectedNode.props?.splitHeroVisualBgColor || '')
      ),
      splitHeroVisualBorderColor: pickPending(
        'splitHeroVisualBorderColor',
        String(selectedNode.props?.splitHeroVisualBorderColor || '')
      ),
      ...splitHeroFormFieldsFromProps(selectedNode.props, pickPending),
      ...(isSplitHeroCarouselNode(selectedNode)
        ? splitHeroTypoInspectorFormFields(selectedNode.props, pickPending)
        : {}),
      carouselImageObjectPosition: pickPending(
        'carouselImageObjectPosition',
        String(
          selectedNode.props?.imageObjectPosition ||
            selectedNode.props?.settings?.imageObjectPosition ||
            'center'
        )
      ),
      carouselTickerDurationSec: pickPending(
        'carouselTickerDurationSec',
        String(
          Number(
            selectedNode.props?.tickerDurationSec ??
              selectedNode.props?.settings?.tickerDurationSec ??
              32
          )
        )
      ),
      carouselScrollDirection: pickPending(
        'carouselScrollDirection',
        (() => {
          const v0 = String(selectedNode.props?.variant || selectedNode.props?.settings?.variant || 'image');
          const def = v0 === 'ticker' ? 'opposite' : 'left';
          const s = String(selectedNode.props?.scrollDirection || selectedNode.props?.settings?.scrollDirection || def);
          if (s === 'right' || s === 'left' || s === 'opposite') return s;
          return def;
        })()
      ),
      carouselTransitionEasing: pickPending(
        'carouselTransitionEasing',
        String(selectedNode.props?.transitionEasing || selectedNode.props?.settings?.transitionEasing || 'ease')
      ),
      carouselTransitionEffect: pickPending(
        'carouselTransitionEffect',
        String(selectedNode.props?.transitionEffect || selectedNode.props?.settings?.transitionEffect || 'slide')
      ),
      carouselShowOverlay: pickPending(
        'carouselShowOverlay',
        (() => {
          const v = String(selectedNode.props?.variant || selectedNode.props?.settings?.variant || 'image');
          const overlayDefault =
            v === 'image' || v === 'logo' || v === 'ticker' || v === 'marquee' ? false : true;
          return Boolean(selectedNode.props?.showOverlay ?? selectedNode.props?.settings?.showOverlay ?? overlayDefault);
        })()
      ),
      carouselPerView: pickPending(
        'carouselPerView',
        String(
          Number(
            selectedNode.props?.slidesPerView?.[device] ??
              selectedNode.props?.slidesPerView?.desktop ??
              selectedNode.props?.settings?.perView?.[device] ??
              selectedNode.props?.settings?.perView?.desktop ??
              1
          )
        )
      ),
    });
    setJsonErrors({
      tableColumnsJson: '',
      formFieldsJson: '',
      actionJson: '',
      menuItemsJson: '',
      carouselSlidesJson: '',
    });
  }, [selectedNode, nestedFeatureTabsNode, device, siteTheme]);

  const featureTabsTarget =
    selectedNode?.nodeType === 'tabs' ? selectedNode : nestedFeatureTabsNode;

  const updateFeatureTabsProps = async (changes) => {
    if (!featureTabsTarget?.id || !onUpdateNode) return;
    if (isLinkedGlobalPlaceholder(featureTabsTarget)) return;
    if (editingDisabledBySectionLock) return;
    await onUpdateNode({
      nodeId: featureTabsTarget.id,
      payload: {
        props: mergeNodePropsJsonPatch(featureTabsTarget.props || {}, changes),
      },
    });
  };

  const updateNode = async (id, changes) => {
    if (!onUpdateNode) return;
    if (isLinkedGlobalPlaceholder(selectedNode)) return;
    if (editingDisabledBySectionLock) return;
    await onUpdateNode({ nodeId: id, payload: changes });
  };

  const updateProps = async (changes) => {
    if (!selectedNode) return;
    if (editingDisabledBySectionLock) return;
    await updateNode(selectedNode.id, {
      props: mergeNodePropsJsonPatch(selectedNode.props || {}, changes),
    });
  };

  const patchRootSectionPageSpacingById = useCallback(
    async (nodeId, patch) => {
      if (!onUpdateNode) return;
      if (editingDisabledBySectionLock) return;
      const node = findNodeInTree(pageTree, nodeId);
      if (!node || node.nodeType !== 'row' || !isRootPageRow(pageTree, node)) return;
      if (isLinkedGlobalPlaceholder(node)) return;
      const prevMeta =
        node.props?.meta && typeof node.props.meta === 'object' && !Array.isArray(node.props.meta)
          ? node.props.meta
          : {};
      const nextMeta = { ...prevMeta };
      if ('sectionGapBeforePx' in patch) {
        const v = patch.sectionGapBeforePx;
        if (v == null || v === '') delete nextMeta.sectionGapBeforePx;
        else nextMeta.sectionGapBeforePx = Math.max(0, Number(v) || 0);
      }
      if ('sectionGapAfterPx' in patch) {
        const v = patch.sectionGapAfterPx;
        if (v == null || v === '') delete nextMeta.sectionGapAfterPx;
        else nextMeta.sectionGapAfterPx = Math.max(0, Number(v) || 0);
      }
      if ('sectionPadBottomPx' in patch) {
        const v = patch.sectionPadBottomPx;
        if (v == null || v === '') delete nextMeta.sectionPadBottomPx;
        else nextMeta.sectionPadBottomPx = Math.max(0, Number(v) || 0);
      }
      await onUpdateNode({
        nodeId,
        payload: {
          props: {
            ...(node.props || {}),
            meta: nextMeta,
          },
        },
      });
    },
    [onUpdateNode, pageTree, editingDisabledBySectionLock]
  );

  const updateCmsMeta = async (patch) => {
    if (!selectedNode) return;
    const prevMeta =
      selectedNode.props?.meta && typeof selectedNode.props.meta === 'object' && !Array.isArray(selectedNode.props.meta)
        ? selectedNode.props.meta
        : {};
    const prevCms =
      prevMeta.cms && typeof prevMeta.cms === 'object' && !Array.isArray(prevMeta.cms) ? prevMeta.cms : {};
    const nextMeta = {
      ...prevMeta,
      cms: { ...prevCms, ...(patch || {}) },
    };
    await updateProps({ meta: nextMeta });
  };

  const updateCmsRepeat = async (patch) => {
    if (!selectedNode) return;
    const prevMeta =
      selectedNode.props?.meta && typeof selectedNode.props.meta === 'object' && !Array.isArray(selectedNode.props.meta)
        ? selectedNode.props.meta
        : {};
    const prevCms =
      prevMeta.cms && typeof prevMeta.cms === 'object' && !Array.isArray(prevMeta.cms) ? prevMeta.cms : {};
    const prevRepeat =
      prevCms.repeat && typeof prevCms.repeat === 'object' && !Array.isArray(prevCms.repeat) ? prevCms.repeat : {};
    await updateCmsMeta({ repeat: { ...prevRepeat, ...(patch || {}) } });
  };

  const setCmsBinding = async ({ propKey, path }) => {
    if (!selectedNode) return;
    const key = String(propKey || '').trim();
    if (!key) return;
    const p = String(path || '').trim();
    const prevMeta =
      selectedNode.props?.meta && typeof selectedNode.props.meta === 'object' && !Array.isArray(selectedNode.props.meta)
        ? selectedNode.props.meta
        : {};
    const prevCms =
      prevMeta.cms && typeof prevMeta.cms === 'object' && !Array.isArray(prevMeta.cms) ? prevMeta.cms : {};
    const prevBindings =
      prevCms.bindings && typeof prevCms.bindings === 'object' && !Array.isArray(prevCms.bindings) ? prevCms.bindings : {};
    const nextBindings = { ...(prevBindings || {}) };
    if (!p) delete nextBindings[key];
    else nextBindings[key] = p;
    await updateCmsMeta({ bindings: nextBindings });
    // Write placeholder into prop for parity with runtime binding.
    if (p) {
      await updateProps({ [key]: `{{${p}}}` });
      if (key === 'text') setForm((prev) => ({ ...prev, text: `{{${p}}}` }));
      if (key === 'href') setForm((prev) => ({ ...prev, href: `{{${p}}}` }));
      if (key === 'src') setForm((prev) => ({ ...prev, src: `{{${p}}}` }));
      if (key === 'alt') setForm((prev) => ({ ...prev, alt: `{{${p}}}` }));
    }
  };

  const clearCmsBinding = async ({ propKey }) => {
    const key = String(propKey || '').trim();
    if (!key) return;
    await setCmsBinding({ propKey: key, path: '' });
  };

  const updateCarouselSettings = async (patch) => {
    if (!selectedNode || selectedNode.nodeType !== 'carousel') return;
    const prev = selectedNode.props?.settings && typeof selectedNode.props.settings === 'object' ? selectedNode.props.settings : {};
    const next = { ...prev, ...(patch || {}) };
    await updateProps({ settings: next });
  };

  const updateCarouselTopLevel = async (patch) => {
    if (!selectedNode || selectedNode.nodeType !== 'carousel') return;
    await updateProps({ ...(patch || {}) });
  };

  /** One props write: avoids stale `selectedNode` between back-to-back updates dropping top-level fields (e.g. variant). */
  const updateCarouselMirrored = async (topLevelPatch, settingsPatch = {}) => {
    if (!selectedNode || selectedNode.nodeType !== 'carousel') return;
    const prevSettings =
      selectedNode.props?.settings && typeof selectedNode.props.settings === 'object' && !Array.isArray(selectedNode.props.settings)
        ? selectedNode.props.settings
        : {};
    await updateProps({
      ...(topLevelPatch || {}),
      settings: {
        ...prevSettings,
        ...(settingsPatch || {}),
      },
    });
  };

  const updateStyle = async (styleChanges, styleJsonOverride) => {
    if (!selectedNode) return;
    await updateNode(selectedNode.id, {
      style_json: mergeStyleForDevice(selectedNode, device, styleChanges, siteTheme, styleJsonOverride),
    });
  };

  /** Local inspector form only (no node write). Spacing blur uses this so we do not fire 4× full style saves. */
  const patchForm = useCallback((partial) => {
    if (!partial || typeof partial !== 'object') return;
    if (editingDisabledBySectionLock) return;
    setForm((prev) => ({ ...prev, ...partial }));
  }, [editingDisabledBySectionLock]);

  const normalizeCarouselSlide = (slide, index) => {
    const s = slide && typeof slide === 'object' ? slide : {};
    const card = s.card && typeof s.card === 'object' ? s.card : {};
    const cta = s.cta && typeof s.cta === 'object' ? s.cta : {};
    const focal = String(s.imageObjectPosition || '').toLowerCase().trim();
    const imageObjectPosition = ['center', 'top', 'bottom', 'left', 'right'].includes(focal) ? focal : '';
    const br = Math.round(Number(s.imageBorderRadiusPx));
    const iw = Math.round(Number(s.imageWidthPx));
    const ih = Math.round(Number(s.imageHeightPx));
    const clampN = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : 0);
    return {
      id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : undefined,
      title: String(s.title || `Slide ${index + 1}`),
      subtitle: String(s.subtitle || ''),
      body: String(s.body || ''),
      image:
        typeof s.image === 'string'
          ? s.image
          : typeof s.imageSrc === 'string'
            ? s.imageSrc
            : '',
      imageSrc:
        typeof s.imageSrc === 'string'
          ? s.imageSrc
          : typeof s.image === 'string'
            ? s.image
            : '',
      imageAlt: typeof s.imageAlt === 'string' ? s.imageAlt : '',
      buttonText: typeof s.buttonText === 'string' ? s.buttonText : '',
      buttonUrl: typeof s.buttonUrl === 'string' ? s.buttonUrl : '',
      overlay: typeof s.overlay === 'string' ? s.overlay : 'card',
      imageBorderRadiusPx: clampN(br, 0, 200),
      imageWidthPx: clampN(iw, 0, 2400),
      imageHeightPx: clampN(ih, 0, 2400),
      imageObjectPosition,
      badge: typeof s.badge === 'string' ? s.badge : '',
      buttonText: typeof s.buttonText === 'string' ? s.buttonText : '',
      buttonUrl: typeof s.buttonUrl === 'string' ? s.buttonUrl : '',
      card: {
        title: typeof card.title === 'string' ? card.title : '',
        body: typeof card.body === 'string' ? card.body : '',
        align: typeof card.align === 'string' ? card.align : 'left',
        theme: typeof card.theme === 'string' ? card.theme : 'dark',
      },
      cta: {
        label: typeof cta.label === 'string' ? cta.label : '',
        href: typeof cta.href === 'string' ? cta.href : '',
      },
    };
  };

  const handleResetTablet = async () => {
    if (!selectedNode) return;
    await updateNode(selectedNode.id, {
      style_json: resetDeviceLayerStyleJson(selectedNode, 'tablet', siteTheme),
    });
  };

  const handleResetMobile = async () => {
    if (!selectedNode) return;
    await updateNode(selectedNode.id, {
      style_json: resetDeviceLayerStyleJson(selectedNode, 'mobile', siteTheme),
    });
  };

  const handleCopyDesktopToDevice = async (targetDevice) => {
    if (!selectedNode) return;
    if (targetDevice !== 'tablet' && targetDevice !== 'mobile') return;
    const nt = selectedNode.nodeType ?? null;
    const normalized = normalizeResponsiveStyle(selectedNode.style_json || {}, { nodeType: nt, siteTheme });
    const desktopBase = normalized.desktop || {};
    // Copy full resolved desktop style into device layer as explicit overrides.
    // This preserves override-only semantics during future edits (tablet/mobile edits still store diffs vs desktop).
    await updateNode(selectedNode.id, {
      style_json: {
        ...normalized,
        [targetDevice]: {
          layout: { ...(desktopBase.layout || {}) },
          spacing: { ...(desktopBase.spacing || {}) },
          size: { ...(desktopBase.size || {}) },
          typography: { ...(desktopBase.typography || {}) },
          colors: { ...(desktopBase.colors || {}) },
          background: { ...(desktopBase.background || {}) },
          effects: { ...(desktopBase.effects || {}) },
          border: { ...(desktopBase.border || {}) },
          menu: { ...(desktopBase.menu || {}) },
          interactions: { ...(desktopBase.interactions || {}) },
          transform: { ...(desktopBase.transform || {}) },
        },
      },
    });
  };

  const flushInteractionSave = useCallback(async () => {
    if (ixSaveTimerRef.current) {
      clearTimeout(ixSaveTimerRef.current);
      ixSaveTimerRef.current = null;
    }
    const nextIx = ixPendingIxRef.current;
    const node = selectedNodeRef.current;
    if (!nextIx || !node?.id || !onUpdateNodeRef.current) return;
    ixPendingIxRef.current = null;
    await onUpdateNodeRef.current({
      nodeId: node.id,
      payload: {
        style_json: mergeStyleForDevice(
          node,
          deviceRef.current,
          { interactions: nextIx },
          siteThemeRef.current
        ),
      },
    });
  }, []);

  useEffect(() => {
    return () => {
      if (ixPreviewTimerRef.current) clearTimeout(ixPreviewTimerRef.current);
      void flushInteractionSave();
    };
  }, [selectedNode?.id, flushInteractionSave]);

  const handleApplyStylePreset = async (presetPatch) => {
    if (!selectedNode || !presetPatch) return;
    if (editingDisabledBySectionLock) return;
    await updateStyle(presetPatch);
  };

  const handleVisibilityForDevice = async (targetDevice, visible) => {
    if (!selectedNode) return;
    const isLayoutNode =
      selectedNode.nodeType === 'row' ||
      selectedNode.nodeType === 'column' ||
      selectedNode.nodeType === 'stack' ||
      selectedNode.nodeType === 'menu';
    const patch = visible
      ? {
          layout: {
            visible: true,
            hidden: false,
            display: isLayoutNode ? 'flex' : 'block',
          },
        }
      : { layout: { visible: false, hidden: true } };
    await updateNode(selectedNode.id, {
      style_json: mergeStyleForDevice(selectedNode, targetDevice, patch, siteTheme),
    });
  };

  const handleContentChange = async (key, value) => {
    if (!selectedNode) return;
    if (editingDisabledBySectionLock) return;

    contentChangeInFlightRef.current += 1;
    try {
      await handleContentChangeInner(key, value);
    } finally {
      contentChangeInFlightRef.current = Math.max(0, contentChangeInFlightRef.current - 1);
    }
  };

  const handleContentChangeInner = async (key, value) => {
    const contentTypoKeys = new Set([
      'fontSizePx',
      'fontWeight',
      'lineHeight',
      'letterSpacingPx',
      'textColor',
      'alignment',
    ]);
    if (key === 'splitHeroCtaStylePreset' && isSplitHeroCarouselNode(selectedNode)) {
      const preset = String(value || '').toLowerCase();
      const prev = splitHeroCopyTypoFromProps(selectedNode.props);
      const nextTypo = normalizeSplitHeroCopyTypo(
        preset === 'outline'
          ? { ...prev, ...splitHeroCtaOutlinePreset() }
          : {
              ...prev,
              ctaBackgroundColor: '',
              ctaTextColor: '',
              ctaBorderColor: '',
              ctaBorderWidthPx: 0,
              ctaFontSizePx: 0,
              ctaBorderRadiusPx: 0,
            }
      );
      await updateProps({ splitHeroCopyTypo: nextTypo });
      setForm((prev) => ({
        ...prev,
        ...splitHeroTypoInspectorFormFields({ splitHeroCopyTypo: nextTypo }),
      }));
      return;
    }

    if (isSplitHeroCarouselNode(selectedNode) && isSplitHeroCopyStyleKey(key)) {
      await handleStyleChange(key, value);
      return;
    }

    if (
      sectionStripLayoutRow &&
      isHeaderRowNode(sectionStripLayoutRow) &&
      isHeaderRevealBarStyleKey(key)
    ) {
      await patchHeaderRevealBarField(key, value);
      return;
    }

    if (contentTypoKeys.has(key)) {
      await handleStyleChange(key, value);
      return;
    }

    /** One-click image layout: updates props + merged style (width / align-self) so live + canvas match. */
    if (key === 'imageQuickPreset' && selectedNode.nodeType === 'image') {
      const preset = String(value || '');
      if (preset === 'naturalContain') {
        await updateProps({ imageFit: 'contain', imageHeightPx: 0 });
        await updateStyle({ size: { width: 'auto', height: 'auto' }, layout: { alignSelf: 'center' } });
        setForm((prev) => ({
          ...prev,
          imageFit: 'contain',
          imageHeightPx: 0,
          widthMode: 'auto',
          heightPx: 0,
        }));
        return;
      }
      if (preset === 'fullCover') {
        await updateProps({ imageFit: 'cover', imageHeightPx: 400 });
        await updateStyle({ size: { width: '100%', height: 'auto' }, layout: { alignSelf: 'stretch' } });
        setForm((prev) => ({
          ...prev,
          imageFit: 'cover',
          imageHeightPx: 400,
          widthMode: 'full',
          heightPx: 0,
        }));
        return;
      }
      if (preset === 'slimBanner') {
        await updateProps({ imageFit: 'cover', imageHeightPx: 200 });
        await updateStyle({ size: { width: '100%', height: 'auto' }, layout: { alignSelf: 'stretch' } });
        setForm((prev) => ({
          ...prev,
          imageFit: 'cover',
          imageHeightPx: 200,
          widthMode: 'full',
          heightPx: 0,
        }));
        return;
      }
      if (preset === 'logo') {
        await updateProps({ imageFit: 'contain', imageHeightPx: 56 });
        await updateStyle({ size: { width: 'auto', height: 'auto' }, layout: { alignSelf: 'center' } });
        setForm((prev) => ({
          ...prev,
          imageFit: 'contain',
          imageHeightPx: 56,
          widthMode: 'auto',
          heightPx: 0,
        }));
        return;
      }
      return;
    }

    if (key === 'brandLogoMediaPick' && isBrandLogoInspectorNode(selectedNode, pageTree)) {
      const slot = value?.slot === 'dark' ? 'dark' : value?.slot === 'light' ? 'light' : null;
      const publicUrl = String(value?.publicUrl || '').trim();
      if (slot && publicUrl) {
        const patch = applyBrandLogoSlotPatch(slot, publicUrl, selectedNode.props || {}, {
          altText: value?.altText,
        });
        await updateProps(patch);
        setForm((prev) => ({
          ...prev,
          ...brandLogoFormFields(mergeNodePropsJsonPatch(selectedNode.props || {}, patch)),
        }));
        return;
      }
    }

    if (!INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS.has(key)) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
    recordPendingInspectorForm(pendingCarouselFormRef, key, value);
    if (key === 'text' && (selectedNode.nodeType === 'heading' || selectedNode.nodeType === 'text')) {
      const next =
        typeof value === 'string' && /<[a-z]/i.test(value)
          ? sanitizeInlineLeafHtml(value)
          : String(value ?? '');
      await updateProps(propsPatchForTextContent(selectedNode.props || {}, next));
      return;
    }
    if (key === 'text') await updateProps({ text: value });
    if (isInlineTextInspectorKey(key) && (selectedNode.nodeType === 'heading' || selectedNode.nodeType === 'text')) {
      if (key === 'richTextHtml') {
        const html = sanitizeInlineLeafHtml(String(value ?? ''));
        const built = buildInlineTextPropsPatch(selectedNode.props || {}, 'richTextHtml', html);
        if (built?.patch) {
          await updateProps(built.patch);
          setForm((prev) => ({ ...prev, richTextHtml: html, inlineTextMode: 'rich' }));
        }
        return;
      }
      const built = buildInlineTextPropsPatch(selectedNode.props || {}, key, value);
      if (built?.patch) {
        await updateProps(built.patch);
        if (key === 'inlineTextMode') {
          setForm((prev) => ({ ...prev, inlineTextMode: value === 'rich' ? 'rich' : 'plain' }));
        }
      }
      return;
    }
    if (key === 'href') {
      if (isBrandLogoInspectorNode(selectedNode, pageTree)) {
        const patch = brandLogoPropsPatchFromFormKey('logoLink', value, selectedNode.props || {});
        if (patch) {
          await updateProps(patch);
          setForm((prev) => ({ ...prev, href: value, logoLink: value, ...brandLogoFormFields({ ...(selectedNode.props || {}), ...patch }) }));
          return;
        }
      }
      await updateProps({ href: value });
    }
    if (key === 'openInNewTab') await updateProps({ openInNewTab: Boolean(value) });
    if (key === 'size') await updateProps({ size: value });
    const brandLogoKeys = new Set([
      'lightLogoUrl',
      'darkLogoUrl',
      'logoAlt',
      'logoLink',
      'logoWidth',
      'logoHeight',
      'logoTheme',
    ]);
    if (brandLogoKeys.has(key) && isBrandLogoInspectorNode(selectedNode, pageTree)) {
      const mergedBase = mergeNodePropsJsonPatch(selectedNode.props || {}, { [key]: value });
      const patch = brandLogoPropsPatchFromFormKey(key, value, mergedBase);
      if (patch) {
        await updateProps(patch);
        setForm((prev) => ({ ...prev, ...brandLogoFormFields(mergeNodePropsJsonPatch(selectedNode.props || {}, patch)) }));
        return;
      }
    }
    if (key === 'src') {
      if (isBrandLogoInspectorNode(selectedNode, pageTree)) {
        const patch = brandLogoPropsPatchFromFormKey('lightLogoUrl', value, selectedNode.props || {});
        if (patch) {
          await updateProps(patch);
          setForm((prev) => ({ ...prev, src: value, ...brandLogoFormFields({ ...(selectedNode.props || {}), ...patch }) }));
          return;
        }
      }
      await updateProps({ src: value });
    }
    if (key === 'alt') await updateProps({ alt: value });

    // CMS bindings + repeater controls (additive; stored in props.meta.cms).
    if (key === 'cmsContextCollectionSlug') {
      await updateCmsMeta({ contextCollectionSlug: String(value || '') });
      return;
    }
    if (key === 'cmsRepeatEnabled') {
      const enabled = Boolean(value);
      if (!enabled) {
        await updateCmsMeta({ repeat: null });
      } else {
        await updateCmsRepeat({ collectionSlug: '', limit: 0, sortBy: 'published_at', sortDir: 'desc', status: 'published', emptyMessage: '' });
      }
      return;
    }
    if (key === 'cmsRepeatPatch') {
      const patch = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      await updateCmsRepeat(patch);
      return;
    }
    if (key === 'cmsSetBinding') {
      const payload = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
      if (!payload) return;
      await setCmsBinding(payload);
      return;
    }
    if (key === 'cmsClearBinding') {
      const payload = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
      if (!payload) return;
      await clearCmsBinding(payload);
      return;
    }
    if (key === 'cmsClearAllBindings') {
      await updateCmsMeta({ bindings: {} });
      return;
    }
    if (key === 'menuDirection' && selectedNode.nodeType === 'menu') await updateProps({ orientation: value });
    if (key === 'menuAriaLabel' && selectedNode.nodeType === 'menu') await updateProps({ ariaLabel: value });
    if (key === 'menuUseProjectPages' && selectedNode.nodeType === 'menu') {
      await updateProps({ useProjectPages: Boolean(value) });
    }
    if (key === 'menuVariant' && selectedNode.nodeType === 'menu') {
      await updateProps({ variant: normalizeMenuVariant(value) });
    }
    if (key === 'stylePresetId') {
      const pid = String(value || '').trim();
      await updateProps({ presetId: pid });
      return;
    }
    if (key === 'styleVariant') {
      // Only use `props.variant` as a style variant for node types that don't already use it for behavior.
      if (selectedNode.nodeType === 'menu' || selectedNode.nodeType === 'carousel') return;
      await updateProps({ variant: String(value || '').trim() });
      return;
    }
    if (key === 'menuAlign' && selectedNode.nodeType === 'menu') {
      await updateProps({ align: normalizeMenuAlign(value) });
    }
    if (key === 'menuMegaEnabled' && selectedNode.nodeType === 'menu') {
      await updateProps({ mega: { ...(selectedNode.props?.mega || {}), enabled: Boolean(value) } });
    }
    if (key === 'menuMegaColumns' && selectedNode.nodeType === 'menu') {
      const cols = Math.max(1, Math.min(6, Math.round(Number(value) || 2)));
      await updateProps({ mega: { ...(selectedNode.props?.mega || {}), columns: cols } });
    }
    if (key === 'menuMobileEnabled' && selectedNode.nodeType === 'menu') {
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), enabled: Boolean(value) } });
    }
    if (key === 'menuMobileHamburgerAlign' && selectedNode.nodeType === 'menu') {
      await updateProps({
        mobile: {
          ...(selectedNode.props?.mobile || {}),
          hamburgerAlign: normalizeMenuHamburgerAlign(value, 'right'),
        },
      });
    }
    if (key === 'menuMobileTitle' && selectedNode.nodeType === 'menu') {
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), title: String(value || '') } });
    }
    if (key === 'menuMobileHamburgerLabel' && selectedNode.nodeType === 'menu') {
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), hamburgerLabel: String(value || '') } });
    }
    if (key === 'menuMobileShowDrawerActions' && selectedNode.nodeType === 'menu') {
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), showDrawerActions: Boolean(value) } });
    }
    if (key === 'menuMobileDrawerActionsLayout' && selectedNode.nodeType === 'menu') {
      await updateProps({
        mobile: {
          ...(selectedNode.props?.mobile || {}),
          drawerActionsLayout: normalizeMenuDrawerActionsLayout(value, 'row'),
        },
      });
    }
    if (key === 'menuMobileDrawerDensity' && selectedNode.nodeType === 'menu') {
      await updateProps({
        mobile: {
          ...(selectedNode.props?.mobile || {}),
          drawerDensity: normalizeMenuDrawerDensity(value, 'compact'),
        },
      });
    }
    if (key === 'menuMobileBreakpointPx' && selectedNode.nodeType === 'menu') {
      const bp = Math.max(320, Math.min(1200, Math.round(Number(value) || 1024)));
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), breakpointPx: bp } });
    }
    if (key === 'menuTextColor' && selectedNode.nodeType === 'menu') {
      await updateStyle({
        typography: { color: value },
        colors: { textColor: value },
      });
    }
    if (key === 'menuItemsJson' && selectedNode.nodeType === 'menu') {
      try {
        const parsed = JSON.parse(value || '[]');
        if (!Array.isArray(parsed)) {
          setJsonErrors((prev) => ({ ...prev, menuItemsJson: 'Menu items JSON must be an array.' }));
          return;
        }
        const normalized = normalizeMenuItems(parsed).items;
        setJsonErrors((prev) => ({ ...prev, menuItemsJson: '' }));
        await updateProps({ items: normalized });
      } catch {
        setJsonErrors((prev) => ({ ...prev, menuItemsJson: 'Invalid JSON format.' }));
      }
    }
    if (key === 'carouselSlidesJson' && selectedNode.nodeType === 'carousel') {
      try {
        const parsed = JSON.parse(value || '[]');
        if (!Array.isArray(parsed)) {
          setJsonErrors((prev) => ({ ...prev, carouselSlidesJson: 'Slides JSON must be an array.' }));
          return;
        }
        const normalized = parsed
          .filter((slide) => slide && typeof slide === 'object')
          .map((slide, index) => normalizeCarouselSlide(slide, index));
        setJsonErrors((prev) => ({ ...prev, carouselSlidesJson: '' }));
        await updateProps({ slides: normalized });
      } catch {
        setJsonErrors((prev) => ({ ...prev, carouselSlidesJson: 'Invalid JSON format.' }));
      }
    }
    if (featureTabsTarget) {
      const ftProps = featureTabsTarget.props || {};
      if (key === 'featureTabsJson') {
        try {
          const parsed = JSON.parse(value || '[]');
          if (!Array.isArray(parsed)) {
            setJsonErrors((prev) => ({ ...prev, featureTabsJson: 'Tabs JSON must be an array.' }));
            return;
          }
          const normalized = normalizeFeatureTabs(parsed);
          setJsonErrors((prev) => ({ ...prev, featureTabsJson: '' }));
          await updateFeatureTabsProps({ tabs: normalized });
        } catch {
          setJsonErrors((prev) => ({ ...prev, featureTabsJson: 'Invalid JSON format.' }));
        }
        return;
      }
      if (key === 'featureTabsActiveId') {
        const id = String(value || '').trim();
        await updateFeatureTabsProps({ activeTabId: id });
        return;
      }
      if (key === 'featureTabsAddTab') {
        const current = normalizeFeatureTabs(ftProps.tabs);
        const tab = newFeatureTabFromList(current);
        const next = [...current, tab];
        await updateFeatureTabsProps({ tabs: next, activeTabId: tab.id });
        setForm((prevForm) => ({
          ...prevForm,
          featureTabsJson: JSON.stringify(next, null, 2),
          featureTabsActiveId: tab.id,
        }));
        return;
      }
      if (key === 'featureTabsRemoveActiveTab') {
        const activeId = String(value || ftProps.activeTabId || '').trim();
        const current = normalizeFeatureTabs(ftProps.tabs);
        if (current.length <= 1) return;
        const next = current.filter((t) => t.id !== activeId);
        const newActive = String(next[0]?.id || '');
        await updateFeatureTabsProps({ tabs: next, activeTabId: newActive });
        setForm((prevForm) => ({
          ...prevForm,
          featureTabsJson: JSON.stringify(next, null, 2),
          featureTabsActiveId: newActive,
        }));
        return;
      }
      if (key === 'featureTabsAddBullet') {
        const activeId = String(
          value || form.featureTabsActiveId || ftProps.activeTabId || ''
        ).trim();
        const current = normalizeFeatureTabs(ftProps.tabs);
        const next = addBulletToActiveTab(current, activeId);
        await updateFeatureTabsProps({ tabs: next });
        setForm((prevForm) => ({ ...prevForm, featureTabsJson: JSON.stringify(next, null, 2) }));
        return;
      }
      if (key === 'featureTabsChromeReset') {
        await updateFeatureTabsProps({ chrome: {} });
        setForm((prevForm) => ({
          ...prevForm,
          ...featureTabsChromeInspectorFields({}, () => ''),
        }));
        return;
      }
      if (isFeatureTabsChromeKey(key) && key !== 'featureTabsChromeReset') {
        const chrome = patchFeatureTabsChromeFromKey(key, value, ftProps.chrome);
        if (chrome) await updateFeatureTabsProps({ chrome });
        return;
      }
      if (key === 'featureTabsTabAlign') {
        const raw = String(value || 'center').trim().toLowerCase();
        const tabAlign = raw === 'left' || raw === 'stretch' ? raw : 'center';
        await updateFeatureTabsProps({ tabAlign });
        return;
      }
      if (key === 'featureTabsImageFit') {
        const fit = String(value || 'cover').trim().toLowerCase();
        const imageFit = fit === 'contain' || fit === 'fill' ? fit : 'cover';
        await updateFeatureTabsProps({ imageFit });
        return;
      }
      if (key === 'featureTabsImageHeightPx') {
        const n = Math.max(120, Math.min(800, Math.floor(Number(value) || 360)));
        await updateFeatureTabsProps({ imageHeightPx: n });
        return;
      }
      if (key === 'featureTabsPatch') {
        const payload = value && typeof value === 'object' ? value : null;
        const idx = Number(payload?.index);
        const patch = payload?.patch && typeof payload.patch === 'object' ? payload.patch : null;
        const current = Array.isArray(ftProps.tabs) ? ftProps.tabs : [];
        if (!Number.isInteger(idx) || idx < 0 || idx >= current.length || !patch) return;
        const next = patchFeatureTabs(current, idx, patch);
        await updateFeatureTabsProps({ tabs: next });
        setForm((prevForm) => ({ ...prevForm, featureTabsJson: JSON.stringify(next, null, 2) }));
        return;
      }
    }
    if (key === 'faqAccordionJson' && selectedNode.nodeType === 'accordion') {
      try {
        const parsed = JSON.parse(value || '[]');
        if (!Array.isArray(parsed)) {
          setJsonErrors((prev) => ({ ...prev, faqAccordionJson: 'Items JSON must be an array.' }));
          return;
        }
        const normalized = normalizeFaqItems(parsed);
        setJsonErrors((prev) => ({ ...prev, faqAccordionJson: '' }));
        await updateProps({ items: normalized });
      } catch {
        setJsonErrors((prev) => ({ ...prev, faqAccordionJson: 'Invalid JSON format.' }));
      }
      return;
    }
    if (selectedNode.nodeType === 'accordion' && key === 'faqAccordionPatch') {
      const payload = value && typeof value === 'object' ? value : null;
      const idx = Number(payload?.index);
      const patch = payload?.patch && typeof payload.patch === 'object' ? payload.patch : null;
      const current = Array.isArray(selectedNode.props?.items) ? selectedNode.props.items : [];
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length || !patch) return;
      const next = patchFaqItems(current, idx, patch);
      await updateProps({ items: next });
      setForm((prevForm) => ({ ...prevForm, faqAccordionJson: JSON.stringify(next, null, 2) }));
      return;
    }
    if (selectedNode.nodeType === 'accordion' && key === 'faqAccordionAddItem') {
      const current = Array.isArray(selectedNode.props?.items) ? selectedNode.props.items : [];
      const next = appendFaqItem(current);
      const newItem = next[next.length - 1];
      await updateProps({ items: next, openItemId: newItem?.id || '' });
      setForm((prevForm) => ({ ...prevForm, faqAccordionJson: JSON.stringify(next, null, 2) }));
      return;
    }
    if (selectedNode.nodeType === 'accordion' && key === 'faqAccordionRemoveItem') {
      const idx = Number(value);
      const current = Array.isArray(selectedNode.props?.items) ? selectedNode.props.items : [];
      const next = removeFaqItemAt(current, idx);
      const openId = String(selectedNode.props?.openItemId || '');
      const stillOpen = next.some((it) => it.id === openId);
      await updateProps({ items: next, openItemId: stillOpen ? openId : '' });
      setForm((prevForm) => ({ ...prevForm, faqAccordionJson: JSON.stringify(next, null, 2) }));
      return;
    }

    const advPatch = advancedElementPatchFromFormKey(selectedNode.nodeType, key, value);
    if (advPatch) {
      const payload = { props: { ...(selectedNode.props || {}), ...advPatch.patch } };
      if (advPatch.stylePatch) {
        const prev = selectedNode.style_json || {};
        payload.style_json = {
          ...prev,
          desktop: {
            ...(prev.desktop || {}),
            ...(advPatch.stylePatch.desktop || {}),
            size: {
              ...(prev.desktop?.size || {}),
              ...(advPatch.stylePatch.desktop?.size || {}),
            },
          },
        };
      }
      await updateNode(selectedNode.id, payload);
      return;
    }
    const advancedJsonKeys = [
      'socialIconsJson',
      'gridItemsJson',
      'featureListJson',
      'tableProHeadersJson',
      'tableProRowsJson',
    ];
    if (advancedJsonKeys.includes(key)) {
      try {
        const jsonUpdate = tryParseAdvancedElementJson(selectedNode.nodeType, key, value);
        if (!jsonUpdate) return;
        await updateProps(jsonUpdate.propPatch);
        setJsonErrors((prev) => ({ ...prev, [jsonUpdate.errorKey]: '' }));
        const propVal = jsonUpdate.propPatch[Object.keys(jsonUpdate.propPatch)[0]];
        setForm((prevForm) => ({ ...prevForm, [jsonUpdate.formKey]: JSON.stringify(propVal, null, 2) }));
      } catch (err) {
        setJsonErrors((prev) => ({
          ...prev,
          [key]: err instanceof Error ? err.message : 'Invalid JSON format.',
        }));
      }
      return;
    }

    if (selectedNode.nodeType === 'carousel') {
      if (key === 'carouselVariant') {
        const v = String(value || 'image');
        pendingCarouselVariantRef.current = { value: v, ts: Date.now() };
        const extra =
          v === 'ticker'
            ? { scrollDirection: 'opposite' }
            : v === 'marquee'
              ? { scrollDirection: 'right' }
              : {};
        await updateCarouselMirrored({ variant: v, ...extra }, { variant: v, ...extra });
        return;
      }
      if (key === 'carouselAutoplay') {
        const v = Boolean(value);
        await updateCarouselMirrored({ autoplay: v }, { autoplay: v });
        return;
      }
      if (key === 'carouselLoop') {
        const v = Boolean(value);
        await updateCarouselMirrored({ loop: v }, { loop: v });
        return;
      }
      if (key === 'carouselArrows') {
        const v = Boolean(value);
        await updateCarouselMirrored({ showArrows: v }, { arrows: v });
        return;
      }
      if (key === 'carouselDots') {
        const v = Boolean(value);
        await updateCarouselMirrored({ showDots: v }, { dots: v });
        return;
      }
      if (key === 'carouselSpeedMs') {
        if (value === '') return;
        const ms = Math.max(0, Number(value) || 0);
        await updateCarouselMirrored({ speed: ms }, { speedMs: ms });
        return;
      }
      if (key === 'carouselIntervalMs') {
        if (value === '') return;
        const ms = Math.max(0, Number(value) || 0);
        await updateCarouselMirrored({ interval: ms }, { autoplayMs: ms });
        return;
      }
      if (key === 'carouselPauseOnHover') {
        const v = Boolean(value);
        await updateCarouselMirrored({ pauseOnHover: v }, {});
        return;
      }
      if (key === 'carouselGapPx') {
        if (value === '') return;
        const gap = Math.max(0, Number(value) || 0);
        await updateCarouselMirrored({ gap }, { gapPx: gap });
        return;
      }
      if (key === 'carouselImageFit') {
        const fit = String(value || 'cover').toLowerCase() === 'contain' ? 'contain' : 'cover';
        await updateCarouselMirrored({ imageFit: fit }, { imageFit: fit });
        return;
      }
      if (key === 'splitHeroVisualFrame') {
        const frame = String(value || 'card').toLowerCase() === 'none' ? 'none' : 'card';
        await updateProps({ splitHeroVisualFrame: frame });
        return;
      }
      if (key === 'splitHeroVisualShadow') {
        const raw = String(value || 'none').toLowerCase().trim();
        const shadow = raw === 'light' || raw === 'medium' ? raw : 'none';
        await updateProps({ splitHeroVisualShadow: shadow });
        return;
      }
      if (key === 'splitHeroVisualBorder') {
        const border = String(value || 'show').toLowerCase().trim() === 'none' ? 'none' : 'show';
        await updateProps({ splitHeroVisualBorder: border });
        return;
      }
      if (key === 'splitHeroVisualBgColor') {
        const raw = String(value ?? '').trim();
        const next = raw === '' || /^#[0-9a-f]{3,8}$/i.test(raw) ? raw : '';
        const cur = String(selectedNode.props?.splitHeroVisualBgColor ?? '').trim();
        if (next === cur) return;
        await updateProps({ splitHeroVisualBgColor: next });
        return;
      }
      if (key === 'splitHeroVisualBorderColor') {
        const raw = String(value ?? '').trim();
        const next = raw === '' || /^#[0-9a-f]{3,8}$/i.test(raw) ? raw : '';
        const cur = String(selectedNode.props?.splitHeroVisualBorderColor ?? '').trim();
        if (next === cur) return;
        await updateProps({ splitHeroVisualBorderColor: next });
        return;
      }
      if (key === 'sectionHeightPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(200, Math.min(1200, Number(value) || 560));
        await updateProps({ sectionHeightPx: n });
        return;
      }
      if (key === 'splitHeroSectionMinHeightPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(0, Math.min(9999, Number(value) || 0));
        await updateProps({ splitHeroSectionMinHeightPx: n });
        return;
      }
      if (key === 'splitHeroSectionMaxHeightPx' && selectedNode.nodeType === 'carousel') {
        const raw = String(value ?? '').trim();
        const next = raw === '' ? '' : Math.max(0, Math.min(9999, Number(value) || 0));
        await updateProps({ splitHeroSectionMaxHeightPx: next });
        return;
      }
      if (key === 'splitHeroVisualWidthPct' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(28, Math.min(72, Math.round(Number(value) || 48)));
        await updateProps({ splitHeroVisualWidthPct: n });
        return;
      }
      if (key === 'splitHeroVisualMinHeightPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(0, Math.min(1200, Math.round(Number(value) || 0)));
        await updateProps({ splitHeroVisualMinHeightPx: n });
        return;
      }
      if (key === 'splitHeroVisualOffsetXPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(-480, Math.min(480, Math.round(Number(value) || 0)));
        await updateProps({ splitHeroVisualOffsetXPx: n });
        return;
      }
      if (key === 'splitHeroVisualOffsetYPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(-480, Math.min(480, Math.round(Number(value) || 0)));
        await updateProps({ splitHeroVisualOffsetYPx: n });
        return;
      }
      if (key === 'splitHeroNavOffsetXPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(-480, Math.min(480, Math.round(Number(value) || 0)));
        await updateProps({ splitHeroNavOffsetXPx: n });
        return;
      }
      if (key === 'splitHeroNavOffsetYPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(-480, Math.min(480, Math.round(Number(value) || 0)));
        await updateProps({ splitHeroNavOffsetYPx: n });
        return;
      }
      if (key === 'splitHeroImageMaxHeightPx' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(0, Math.min(1200, Math.round(Number(value) || 0)));
        await updateProps({ splitHeroImageMaxHeightPx: n });
        return;
      }
      if (key === 'splitHeroImageScalePct' && selectedNode.nodeType === 'carousel') {
        const n = Math.max(100, Math.min(140, Math.round(Number(value) || 100)));
        await updateProps({ splitHeroImageScalePct: n });
        return;
      }
      if (key === 'splitHeroVisualLayoutPatch' && selectedNode.nodeType === 'carousel') {
        const patch = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
        if (!patch) return;
        await updateProps(patch);
        const formPatch = {};
        for (const [k, v] of Object.entries(patch)) {
          if (typeof k === 'string' && (k.startsWith('splitHero') || k === 'sectionHeightPx')) {
            formPatch[k] = v;
            recordPendingInspectorForm(pendingCarouselFormRef, k, v);
          }
        }
        if (Object.keys(formPatch).length) {
          setForm((prev) => ({ ...prev, ...formPatch }));
        }
        return;
      }
      if (key === 'carouselImageObjectPosition') {
        const raw = String(value || 'center').toLowerCase().trim();
        const allowed = new Set(['center', 'top', 'bottom', 'left', 'right']);
        const pos = allowed.has(raw) ? raw : 'center';
        await updateCarouselMirrored({ imageObjectPosition: pos }, { imageObjectPosition: pos });
        return;
      }
      if (key === 'carouselTickerDurationSec') {
        if (value === '') return;
        const n = Math.max(8, Math.min(120, Math.floor(Number(value) || 32)));
        await updateCarouselMirrored({ tickerDurationSec: n }, { tickerDurationSec: n });
        return;
      }
      if (key === 'carouselTransitionEasing') {
        const raw = String(value || 'ease').toLowerCase().trim();
        const allowed = new Set(['ease', 'linear', 'ease-in-out', 'ease-out']);
        const easing = allowed.has(raw) ? raw : 'ease';
        await updateCarouselMirrored({ transitionEasing: easing }, { transitionEasing: easing });
        return;
      }
      if (key === 'carouselTransitionEffect') {
        const raw = String(value || 'slide').toLowerCase().trim();
        const effect = raw === 'fade' ? 'fade' : 'slide';
        await updateCarouselMirrored({ transitionEffect: effect }, { transitionEffect: effect });
        return;
      }
      if (key === 'carouselScrollDirection') {
        const raw = String(value || '').toLowerCase().trim();
        const allowed = new Set(['left', 'right', 'opposite']);
        const v0 = String(selectedNode.props?.variant || selectedNode.props?.settings?.variant || 'image');
        const fallback = v0 === 'ticker' ? 'opposite' : v0 === 'marquee' ? 'right' : 'left';
        const dir = allowed.has(raw) ? raw : fallback;
        await updateCarouselMirrored({ scrollDirection: dir }, { scrollDirection: dir });
        return;
      }
      if (key === 'carouselShowOverlay') {
        const enabled = Boolean(value);
        await updateCarouselMirrored({ showOverlay: enabled }, { showOverlay: enabled });
        return;
      }
      if (key === 'carouselPerView') {
        if (value === '') return;
        const n = Math.max(1, Math.min(6, Math.floor(Number(value) || 1)));
        const prevSettings = selectedNode.props?.settings && typeof selectedNode.props.settings === 'object' ? selectedNode.props.settings : {};
        const perView = prevSettings.perView && typeof prevSettings.perView === 'object' ? prevSettings.perView : {};
        const prevSpv = selectedNode.props?.slidesPerView && typeof selectedNode.props.slidesPerView === 'object' ? selectedNode.props.slidesPerView : {};
        await updateCarouselMirrored({ slidesPerView: { ...prevSpv, [device]: n } }, { perView: { ...perView, [device]: n } });
        return;
      }
      if (key === 'carouselSlidesReorder') {
        const payload = value && typeof value === 'object' ? value : null;
        const from = Number(payload?.from);
        const to = Number(payload?.to);
        const current = Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [];
        if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
        if (from < 0 || from >= current.length || to < 0 || to >= current.length) return;
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        await updateProps({ slides: next });
        setForm((prevForm) => ({ ...prevForm, carouselSlidesJson: JSON.stringify(next, null, 2) }));
        return;
      }
      if (key === 'carouselAddSlide') {
        const current = Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [];
        const next = [
          ...current,
          normalizeCarouselSlide(
            {
              id: `slide-${current.length + 1}`,
              title: `Slide title`,
              subtitle: 'Slide subtitle',
              body: '',
              image: '',
              imageSrc: '',
              imageAlt: '',
              buttonText: 'Learn More',
              buttonUrl: '#',
              card: { title: '', body: '', align: 'left', theme: 'dark' },
              cta: { label: '', href: '' },
            },
            current.length
          ),
        ];
        await updateProps({ slides: next });
        setForm((prevForm) => ({ ...prevForm, carouselSlidesJson: JSON.stringify(next, null, 2) }));
        return;
      }
      if (key === 'carouselEnsureSlide0Image') {
        const src = String(value || '');
        if (!src) return;
        const current = Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [];
        let next;
        if (current.length === 0) {
          next = [
            normalizeCarouselSlide(
              {
                id: 'slide-1',
                title: 'Slide 1',
                subtitle: '',
                body: '',
                image: src,
                imageSrc: src,
                imageAlt: '',
                buttonText: 'Learn More',
                buttonUrl: '#',
                card: { title: '', body: '', align: 'left', theme: 'dark' },
                cta: { label: '', href: '' },
              },
              0
            ),
          ];
        } else {
          const merged = { ...(current[0] || {}), imageSrc: src, image: src };
          next = current.map((s, i) => (i === 0 ? normalizeCarouselSlide(merged, 0) : normalizeCarouselSlide(s, i)));
        }
        await updateProps({ slides: next });
        setForm((prevForm) => ({ ...prevForm, carouselSlidesJson: JSON.stringify(next, null, 2) }));
        return;
      }
      if (key === 'carouselRemoveSlide') {
        const idx = Number(value);
        const current = Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [];
        if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) return;
        const next = current.filter((_, i) => i !== idx);
        await updateProps({ slides: next });
        setForm((prevForm) => ({ ...prevForm, carouselSlidesJson: JSON.stringify(next, null, 2) }));
        return;
      }
      if (key === 'carouselSlidePatch') {
        const payload = value && typeof value === 'object' ? value : null;
        const idx = Number(payload?.index);
        const patch = payload?.patch && typeof payload.patch === 'object' ? payload.patch : null;
        const current = Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [];
        if (!Number.isInteger(idx) || idx < 0 || idx >= current.length || !patch) return;
        const prevNorm = normalizeCarouselSlide(current[idx], idx);
        const merged = { ...(current[idx] || {}), ...(patch || {}) };
        const nextNorm = normalizeCarouselSlide(merged, idx);
        if (JSON.stringify(prevNorm) === JSON.stringify(nextNorm)) return;
        const next = current.map((s, i) => (i === idx ? nextNorm : normalizeCarouselSlide(s, i)));
        await updateProps({ slides: next });
        setForm((prevForm) => ({ ...prevForm, carouselSlidesJson: JSON.stringify(next, null, 2) }));
        return;
      }
    }
    if (key === 'dividerOrientation' && selectedNode.nodeType === 'divider') {
      const orientation = value === 'vertical' ? 'vertical' : 'horizontal';
      const thickness = Number(selectedNode.props?.thicknessPx) > 0 ? Number(selectedNode.props.thicknessPx) : 2;
      await updateProps({ orientation });
      await updateStyle({ size: dividerSizePatchForOrientation(orientation, thickness) });
    }
    if (key === 'dividerThicknessPx' && selectedNode.nodeType === 'divider') {
      const thickness = Math.max(1, Math.min(32, parsePxValue(value, 2)));
      const orientation = dividerOrientationFromProps(selectedNode.props);
      await updateProps({ thicknessPx: thickness });
      await updateStyle({ size: dividerSizePatchForThickness(orientation, thickness) });
    }
    if (key === 'bgColor' && selectedNode.nodeType === 'divider') {
      setForm((prev) => ({ ...prev, bgColor: value }));
      await updateStyle({
        colors: { backgroundColor: value },
        background: { backgroundColor: value },
      });
      return;
    }
    if (key === 'imageFit' && selectedNode.nodeType === 'image') await updateProps({ imageFit: value });
    if (key === 'imageHeightPx' && selectedNode.nodeType === 'image') {
      const numericHeight = Math.max(0, parsePxValue(value, 0));
      await updateProps({ imageHeightPx: numericHeight });
    }
    if (key === 'richTextHtml' && selectedNode.nodeType === 'rich_text') {
      await updateProps({ content: sanitizeRichHtml(String(value ?? '')) });
    }
    if (key === 'animationPreset' && selectedNode.nodeType === 'rich_text') {
      await updateProps({
        animation: {
          ...(selectedNode.props?.animation || {}),
          preset: value,
          duration:
            typeof form.animationDuration === 'number' ? form.animationDuration : Number(form.animationDuration) || 0.6,
          delay:
            typeof form.animationDelay === 'number' ? form.animationDelay : Number(form.animationDelay) || 0,
        },
      });
    }
    if (key === 'animationDuration' && selectedNode.nodeType === 'rich_text') {
      const dur = Math.max(0, Number.parseFloat(String(value))) || 0.6;
      await updateProps({
        animation: {
          ...(selectedNode.props?.animation || {}),
          preset: form.animationPreset || 'none',
          duration: dur,
          delay:
            typeof form.animationDelay === 'number'
              ? form.animationDelay
              : Number(form.animationDelay ?? 0) || 0,
        },
      });
    }
    if (key === 'animationDelay' && selectedNode.nodeType === 'rich_text') {
      const del = Math.max(0, Number.parseFloat(String(value))) || 0;
      await updateProps({
        animation: {
          ...(selectedNode.props?.animation || {}),
          preset: form.animationPreset || 'none',
          duration:
            typeof form.animationDuration === 'number'
              ? form.animationDuration
              : Number(form.animationDuration ?? 0.6) || 0.6,
          delay: del,
        },
      });
    }
    if (key === 'alignment') await updateStyle({ typography: { textAlign: value } });
    if (key === 'submitLabel' && selectedNode.nodeType === 'form') await updateProps({ submitLabel: value });
    if (key === 'buttonType' && selectedNode.nodeType === 'button') await updateProps({ type: value });
    if (key === 'buttonIcon' && selectedNode.nodeType === 'button') await updateProps({ icon: value });
    if (key === 'buttonIconPosition' && selectedNode.nodeType === 'button') await updateProps({ iconPosition: value });
    if (key === 'buttonIconSpacing' && selectedNode.nodeType === 'button') {
      const spacing = Math.max(0, Number.parseFloat(String(value)) || 0);
      await updateProps({ iconSpacing: spacing });
    }
    if (key === 'buttonId' && selectedNode.nodeType === 'button') {
      const sanitized = String(value || '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9_-]/g, '');
      if (sanitized !== value) {
        setForm((prev) => ({ ...prev, buttonId: sanitized }));
      }
      await updateProps({ buttonId: sanitized });
    }
    if (key === 'tableColumnsJson' && selectedNode.nodeType === 'table') {
      try {
        const parsed = JSON.parse(value || '[]');
        if (!Array.isArray(parsed)) {
          setJsonErrors((prev) => ({ ...prev, tableColumnsJson: 'Columns JSON must be an array.' }));
          return;
        }
        setJsonErrors((prev) => ({ ...prev, tableColumnsJson: '' }));
        await updateProps({ columns: parsed });
      } catch {
        setJsonErrors((prev) => ({ ...prev, tableColumnsJson: 'Invalid JSON format.' }));
      }
    }
    if (key === 'formFieldsJson' && selectedNode.nodeType === 'form') {
      try {
        const parsed = JSON.parse(value || '[]');
        if (!Array.isArray(parsed)) {
          setJsonErrors((prev) => ({ ...prev, formFieldsJson: 'Fields JSON must be an array.' }));
          return;
        }
        setJsonErrors((prev) => ({ ...prev, formFieldsJson: '' }));
        await updateProps({ fields: parsed });
      } catch {
        setJsonErrors((prev) => ({ ...prev, formFieldsJson: 'Invalid JSON format.' }));
      }
    }
    if (key === 'formAddField' && selectedNode.nodeType === 'form') {
      const existing = Array.isArray(selectedNode.props?.fields) ? selectedNode.props.fields : [];
      const existingNames = new Set(existing.map((f) => String(f?.name || '').trim()).filter(Boolean));
      let n = 1;
      let name = `field_${n}`;
      while (existingNames.has(name) && n < 200) {
        n += 1;
        name = `field_${n}`;
      }
      const next = [
        ...existing,
        {
          id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name,
          label: 'Field label',
          type: 'text',
          placeholder: '',
          required: false,
          width: '100%',
          validation: {},
        },
      ];
      await updateProps({ fields: next });
      setForm((prev) => ({ ...prev, formFieldsJson: JSON.stringify(next, null, 2) }));
    }
    if (key === 'formRemoveField' && selectedNode.nodeType === 'form') {
      const idx = Number(value);
      const existing = Array.isArray(selectedNode.props?.fields) ? selectedNode.props.fields : [];
      if (!Number.isInteger(idx) || idx < 0 || idx >= existing.length) return;
      const next = existing.filter((_f, i) => i !== idx);
      await updateProps({ fields: next });
      setForm((prev) => ({ ...prev, formFieldsJson: JSON.stringify(next, null, 2) }));
    }
    if (key === 'formPatchField' && selectedNode.nodeType === 'form') {
      const idx = Number(value?.index);
      const patch = value?.patch && typeof value.patch === 'object' && !Array.isArray(value.patch) ? value.patch : null;
      const existing = Array.isArray(selectedNode.props?.fields) ? selectedNode.props.fields : [];
      if (!patch) return;
      if (!Number.isInteger(idx) || idx < 0 || idx >= existing.length) return;
      const next = existing.map((f, i) => (i === idx ? { ...(f || {}), ...patch } : f));
      await updateProps({ fields: next });
      setForm((prev) => ({ ...prev, formFieldsJson: JSON.stringify(next, null, 2) }));
    }
    if (key === 'formReorderFields' && selectedNode.nodeType === 'form') {
      const from = Number(value?.from);
      const to = Number(value?.to);
      const existing = Array.isArray(selectedNode.props?.fields) ? selectedNode.props.fields : [];
      if (!Number.isInteger(from) || !Number.isInteger(to)) return;
      if (from < 0 || to < 0 || from >= existing.length || to >= existing.length) return;
      if (from === to) return;
      const next = [...existing];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      await updateProps({ fields: next });
      setForm((prev) => ({ ...prev, formFieldsJson: JSON.stringify(next, null, 2) }));
    }
    if (key === 'formSetLayout' && selectedNode.nodeType === 'form') {
      const patch = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      const prev =
        selectedNode.props?.layout && typeof selectedNode.props.layout === 'object'
          ? selectedNode.props.layout
          : {};
      const next = { ...prev };
      if ('labelGapPx' in patch) {
        const n = Number(patch.labelGapPx);
        if (Number.isFinite(n) && n >= 0) next.labelGapPx = Math.min(48, Math.round(n));
        else delete next.labelGapPx;
      }
      if ('fieldGapPx' in patch) {
        const n = Number(patch.fieldGapPx);
        if (Number.isFinite(n) && n >= 0) next.fieldGapPx = Math.min(80, Math.round(n));
        else delete next.fieldGapPx;
      }
      if ('inputAfterGapPx' in patch) {
        const n = Number(patch.inputAfterGapPx);
        if (Number.isFinite(n) && n >= 0) {
          next.inputAfterGapPx = Math.min(80, Math.round(n));
          delete next.fieldGapPx;
        } else delete next.inputAfterGapPx;
      }
      if ('beforeSubmitGapPx' in patch) {
        const n = Number(patch.beforeSubmitGapPx);
        if (Number.isFinite(n) && n >= 0) next.beforeSubmitGapPx = Math.min(80, Math.round(n));
        else delete next.beforeSubmitGapPx;
      }
      await updateProps({ layout: Object.keys(next).length ? next : undefined });
    }
    if (key === 'formPatchProps' && selectedNode.nodeType === 'form') {
      const patch = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      const prev = selectedNode.props && typeof selectedNode.props === 'object' ? selectedNode.props : {};
      await updateProps({ ...prev, ...patch });
      return;
    }
    if (key === 'formSetNotifications' && selectedNode.nodeType === 'form') {
      const patch = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      const prev = selectedNode.props?.notifications && typeof selectedNode.props.notifications === 'object' ? selectedNode.props.notifications : {};
      const webhookUrl = typeof patch.webhookUrl === 'string' ? patch.webhookUrl : prev.webhookUrl || '';
      const emailTo = typeof patch.emailTo === 'string' ? patch.emailTo : prev.emailTo || '';
      await updateProps({
        notifications: {
          webhookUrl: webhookUrl.trim(),
          emailTo: emailTo.trim(),
        },
      });
    }
    if (key === 'dataSourceResource' && (selectedNode.nodeType === 'table' || selectedNode.nodeType === 'form')) {
      const def = dataSourceRegistry[value];
      if (!def) return;
      const method = selectedNode.nodeType === 'table' ? 'GET' : 'POST';
      await updateNode(selectedNode.id, {
        dataJson: {
          source: {
            kind: 'internal_api',
            resource: value,
            path: def.endpoint?.[method] || def.path,
            method,
          },
        },
      });
      if (selectedNode.nodeType === 'table') {
        await updateProps({ columns: def.defaultColumns || [] });
      } else if (selectedNode.nodeType === 'form') {
        await updateProps({ fields: def.defaultFields || [] });
      }
    }
    if (key === 'actionType' && selectedNode.nodeType === 'button') {
      if (value === 'none') {
        await updateNode(selectedNode.id, { actionsJson: {} });
        setForm((prev) => ({ ...prev, actionJson: '{}' }));
        return;
      }
      const nextAction =
        value === 'navigate'
          ? { onClick: { type: 'navigate', to: '/dashboard' } }
          : value === 'apiCall'
            ? {
                onClick: {
                  type: 'apiCall',
                  method: 'POST',
                  url: '/api/runtime/data/users',
                  body: { name: 'Test User', email: 'test@example.com' },
                  successMessage: 'Action completed',
                },
              }
            : value === 'showToast'
              ? { onClick: { type: 'showToast', message: 'Saved successfully' } }
              : { onClick: { type: 'refreshPage' } };
      await updateNode(selectedNode.id, { actionsJson: nextAction });
      setForm((prev) => ({ ...prev, actionJson: JSON.stringify(nextAction, null, 2) }));
    }
    if (key === 'actionJson' && selectedNode.nodeType === 'button') {
      try {
        const parsed = JSON.parse(value || '{}');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setJsonErrors((prev) => ({ ...prev, actionJson: 'actions_json must be an object.' }));
          return;
        }
        setJsonErrors((prev) => ({ ...prev, actionJson: '' }));
        await updateNode(selectedNode.id, { actionsJson: parsed });
      } catch {
        setJsonErrors((prev) => ({ ...prev, actionJson: 'Invalid JSON format.' }));
      }
    }
  };

  const handleResetLayoutKeys = async (keys) => {
    if (!selectedNode) return;
    await updateNode(selectedNode.id, {
      style_json: stripDeviceLayoutKeysInStyleJson(selectedNode.style_json, device, keys, selectedNode.nodeType, siteTheme),
    });
  };

  const handleRowLayoutLockedChange = async (locked) => {
    if (!selectedNode || selectedNode.nodeType !== 'row') return;
    await updateProps({
      meta: { ...(selectedNode.props?.meta || {}), layoutLocked: Boolean(locked) },
    });
  };

  const handleStyleChange = async (key, value) => {
    if (!selectedNode) return;
    if (isLayoutLockedRow(selectedNode) && LOCKED_LAYOUT_FORM_KEYS.has(key)) return;
    if (editingDisabledBySectionLock) return;

    if (isSplitHeroCarouselNode(selectedNode) && isSplitHeroCopyStyleKey(key)) {
      const patch = patchSplitHeroCopyTypoFromStyleKey(key, value, selectedNode.props);
      if (!patch) return;
      const recordStylePending = (fieldKey, fieldValue) => {
        pendingStyleFormRef.current = {
          ...pendingStyleFormRef.current,
          [fieldKey]: { value: fieldValue, ts: Date.now() },
        };
      };
      recordStylePending(key, value);
      styleChangeInFlightRef.current += 1;
      setForm((prev) => ({ ...prev, [key]: value }));
      try {
        const cur = String(
          JSON.stringify(selectedNode.props?.splitHeroCopyTypo || {})
        );
        const next = String(JSON.stringify(patch.splitHeroCopyTypo || {}));
        if (cur !== next) await updateProps(patch);
      } finally {
        styleChangeInFlightRef.current = Math.max(0, styleChangeInFlightRef.current - 1);
      }
      return;
    }

    if (
      sectionStripLayoutRow &&
      isHeaderRowNode(sectionStripLayoutRow) &&
      isHeaderRevealBarStyleKey(key)
    ) {
      await patchHeaderRevealBarField(key, value);
      return;
    }

    const recordStylePending = (fieldKey, fieldValue) => {
      pendingStyleFormRef.current = {
        ...pendingStyleFormRef.current,
        [fieldKey]: { value: fieldValue, ts: Date.now() },
      };
    };

    recordStylePending(key, value);
    if (key === 'layoutGapScale' && GAP_SCALE_IDS.includes(String(value))) {
      recordStylePending('layoutGapPx', themeSpacingPx(siteTheme, value));
    }
    if (key === 'layoutGapPx') {
      recordStylePending('layoutGapScale', '');
    }

    const buildNextForm = (prevForm) => {
      const prev = prevForm != null && typeof prevForm === 'object' ? prevForm : {};
      let nextForm = { ...prev, [key]: value };
      if (key === 'layoutGapScale' && GAP_SCALE_IDS.includes(String(value))) {
        nextForm = { ...nextForm, layoutGapPx: themeSpacingPx(siteTheme, value) };
      }
      if (key === 'layoutGapPx') {
        nextForm = { ...nextForm, layoutGapScale: '' };
      }
      return nextForm;
    };

    const nextFormSnapshot = buildNextForm(form);
    styleChangeInFlightRef.current += 1;
    setForm(() => nextFormSnapshot);

    try {
      const built = buildInspectorStylePatch(key, nextFormSnapshot, {
        selectedNode,
        siteTheme,
        pageTree,
        device,
      });
      if (!built?.patch || Object.keys(built.patch).length === 0) return;

      const isFlexLayoutContainer =
        selectedNode?.nodeType === 'row' ||
        selectedNode?.nodeType === 'column' ||
        selectedNode?.nodeType === 'stack';
      const gapScaleSel = String(nextFormSnapshot.layoutGapScale || '').trim();
      const useGapScale = GAP_SCALE_IDS.includes(gapScaleSel);
      let baseJsonOverride = built.baseJsonOverride;
      if (isFlexLayoutContainer && !useGapScale && (key === 'layoutGapPx' || key === 'layoutGapScale')) {
        baseJsonOverride = stripDeviceLayoutKeysInStyleJson(
          selectedNode.style_json,
          device,
          ['gapScale'],
          selectedNode.nodeType,
          siteTheme
        );
      }

      previewStylePatch(built.patch);
      const style_json = mergeStyleForDevice(selectedNode, device, built.patch, siteTheme, baseJsonOverride);
      const nodePayload = { style_json };
      if (built.propsMetaPatch) {
        const prevMeta =
          selectedNode.props?.meta &&
          typeof selectedNode.props.meta === 'object' &&
          !Array.isArray(selectedNode.props.meta)
            ? selectedNode.props.meta
            : {};
        nodePayload.props = {
          ...selectedNode.props,
          meta: { ...prevMeta, ...built.propsMetaPatch },
        };
      }
      await updateNode(selectedNode.id, nodePayload);

      const isRow = selectedNode?.nodeType === 'row';
      const isRootLandmarkRow =
        isRow &&
        Array.isArray(pageTree) &&
        pageTree.length > 0 &&
        isRootPageRow(pageTree, selectedNode) &&
        (isHeaderRowNode(selectedNode) || isFooterRowNode(selectedNode));
      const rawMode = isRow ? String(nextFormSnapshot.containerWidthMode || 'full') : 'full';
      const containerMode = rawMode === 'custom' ? 'boxed' : rawMode;
      const containerPx = Math.max(320, Math.min(2400, parsePxFromPatch(nextFormSnapshot.containerWidthPx, 1200)));

      if (onUpdateNode && built.needsRowMeta) {
        const prevMeta =
          selectedNode.props?.meta &&
          typeof selectedNode.props.meta === 'object' &&
          !Array.isArray(selectedNode.props.meta)
            ? selectedNode.props.meta
            : {};
        if (isRootLandmarkRow) {
          const contentMode = containerMode === 'boxed' ? 'boxed' : 'full';
          const contentMetaKey = isHeaderRowNode(selectedNode) ? 'headerContentWidth' : 'footerContentWidth';
          const maxMetaKey = isHeaderRowNode(selectedNode) ? 'headerContentMaxWidthPx' : 'footerContentMaxWidthPx';
          await onUpdateNode({
            nodeId: selectedNode.id,
            payload: {
              props: {
                ...selectedNode.props,
                meta: {
                  ...prevMeta,
                  rootStripLayout: 'full',
                  [contentMetaKey]: contentMode,
                  [maxMetaKey]: containerPx,
                },
              },
            },
          });
        } else if (
          isRow &&
          Array.isArray(pageTree) &&
          pageTree.length > 0 &&
          isRootPageRow(pageTree, selectedNode) &&
          !isHeaderRowNode(selectedNode) &&
          !isFooterRowNode(selectedNode)
        ) {
          const sectionWidthMode =
            key === 'sectionWidthMode' && String(nextFormSnapshot.sectionWidthMode || '').trim()
              ? String(nextFormSnapshot.sectionWidthMode).trim()
              : containerMode === 'boxed'
                ? 'boxed'
                : 'fullWidthContentBoxed';
          await onUpdateNode({
            nodeId: selectedNode.id,
            payload: {
              props: {
                ...selectedNode.props,
                meta: {
                  ...prevMeta,
                  rootStripLayout: containerMode === 'boxed' ? 'boxed' : 'full',
                  sectionWidthMode,
                  sectionContentMaxWidthPx: containerPx,
                },
              },
            },
          });
        }
      }
    } finally {
      styleChangeInFlightRef.current = Math.max(0, styleChangeInFlightRef.current - 1);
    }
  };

  const handleApplyFlexPreset = async (layout) => {
    if (!selectedNode || !layout || typeof layout !== 'object') return;
    if (isLayoutLockedRow(selectedNode)) return;
    if (editingDisabledBySectionLock) return;
    const isFlex =
      selectedNode.nodeType === 'row' ||
      selectedNode.nodeType === 'column' ||
      selectedNode.nodeType === 'stack';
    if (!isFlex) return;
    const gapNum = typeof layout.gap === 'number' ? layout.gap : parsePxValue(layout.gap, 0);
    const gs = typeof layout.gapScale === 'string' && GAP_SCALE_IDS.includes(layout.gapScale) ? layout.gapScale : '';
    setForm((prev) => ({
      ...prev,
      layoutDirection: layout.flexDirection || prev.layoutDirection,
      layoutJustify: layout.justifyContent || prev.layoutJustify,
      layoutAlign: layout.alignItems || prev.layoutAlign,
      layoutFlexWrap: layout.flexWrap || 'nowrap',
      layoutGapPx: gapNum,
      layoutGapScale: gs,
    }));
    await updateStyle({
      layout: {
        flexDirection: layout.flexDirection,
        justifyContent: layout.justifyContent,
        alignItems: layout.alignItems,
        flexWrap: layout.flexWrap != null && layout.flexWrap !== '' ? layout.flexWrap : 'nowrap',
        gap: gapNum,
        ...(gs ? { gapScale: gs } : {}),
      },
    });
  };

  /** Sticky / static shortcuts for header sections (full control still in Advanced → Position). */
  const handleHeaderLayoutQuickAction = async (action) => {
    if (!selectedNode || selectedNode.nodeType !== 'row') return;
    if (editingDisabledBySectionLock) return;
    const meta = selectedNode.props?.meta || {};
    if (!meta.isHeader && meta.role !== 'header') return;
    if (isLayoutLockedRow(selectedNode)) return;
    if (action === 'sticky') {
      await patchHeaderBehavior({ type: 'sticky' });
      return;
    }
    if (action === 'static') {
      await patchHeaderBehavior({ type: 'normal' });
    }
  };

  const handleAdvancedChange = async (key, value) => {
    if (editingDisabledBySectionLock) return;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'margin') await updateStyle({ spacing: { margin: value } });
    if (key === 'paddingAdvanced') await updateStyle({ spacing: { padding: value } });
    if (key === 'position') {
      await updateStyle({ layout: { position: value } });
    }
    if (key === 'left') await updateStyle({ layout: { left: value } });
    if (key === 'top') await updateStyle({ layout: { top: value } });
    if (key === 'right') await updateStyle({ layout: { right: value } });
    if (key === 'bottom') await updateStyle({ layout: { bottom: value } });
    if (key === 'zIndex') {
      const zi = String(value ?? '').trim();
      await updateStyle({ layout: { zIndex: zi } });
    }
  };

  const rootClass = ['bld-inspector', variant === 'rail' ? 'bld-inspector--rail' : ''].filter(Boolean).join(' ');
  const showDeviceBar = activeTab !== 'theme';
  const deviceLabel =
    device === 'tablet' ? 'Tablet' : device === 'mobile' ? 'Mobile' : 'Desktop';

  const clearPreviewCss = useCallback(() => {
    if (!selectedNode?.id) return;
    onSetPreviewCssForNode?.(selectedNode.id, null);
  }, [selectedNode?.id, onSetPreviewCssForNode]);

  const previewStylePatch = useCallback(
    (patch) => {
      if (editingDisabledBySectionLock) return;
      if (!selectedNode?.id) return;
      const nextStyleJson = mergeStyleForDevice(selectedNode, device, patch, siteTheme);
      const tmpNode = { ...selectedNode, style_json: nextStyleJson };
      const resolved = getInspectorResolvedStyle(tmpNode, device, siteTheme);
      const css = resolved ? styleToCss(resolved, siteTheme, { animationPresets }) : null;
      onSetPreviewCssForNode?.(selectedNode.id, css);
    },
    [selectedNode, device, siteTheme, animationPresets, onSetPreviewCssForNode, editingDisabledBySectionLock]
  );

  const scheduleInteractionPreview = useCallback(
    (nextIx) => {
      if (ixPreviewTimerRef.current) clearTimeout(ixPreviewTimerRef.current);
      ixPreviewTimerRef.current = setTimeout(() => {
        ixPreviewTimerRef.current = null;
        previewStylePatch({ interactions: nextIx });
      }, IX_PREVIEW_MS);
    },
    [previewStylePatch]
  );

  const handleInteractionChange = useCallback(
    (group, key, value) => {
      const node = selectedNodeRef.current;
      if (!node) return;
      if (editingDisabledBySectionLock) return;
      const currentStyle = getDeviceStyle(node.style_json || {}, deviceRef.current) || {};
      const nextIx = patchInteractionGroup(currentStyle.interactions, group, key, value);
      setForm((f) => ({ ...f, interactions: nextIx }));
      ixPendingIxRef.current = nextIx;
      if (IX_PREVIEW_IMMEDIATE_KEYS.has(key)) {
        if (ixPreviewTimerRef.current) clearTimeout(ixPreviewTimerRef.current);
        previewStylePatch({ interactions: nextIx });
      } else {
        scheduleInteractionPreview(nextIx);
      }

      if (ixSaveTimerRef.current) clearTimeout(ixSaveTimerRef.current);
      const saveDelay = IX_SAVE_IMMEDIATE_KEYS.has(key) ? 80 : IX_SAVE_MS;
      ixSaveTimerRef.current = setTimeout(() => {
        ixSaveTimerRef.current = null;
        void flushInteractionSave();
      }, saveDelay);
    },
    [editingDisabledBySectionLock, scheduleInteractionPreview, flushInteractionSave]
  );

  const handleInteractionClearGroup = useCallback(
    (group) => {
      const node = selectedNodeRef.current;
      if (!node || editingDisabledBySectionLock) return;
      const currentStyle = getDeviceStyle(node.style_json || {}, deviceRef.current) || {};
      const nextIx = clearInteractionGroup(currentStyle.interactions, group);
      setForm((f) => ({ ...f, interactions: nextIx }));
      ixPendingIxRef.current = nextIx;
      if (ixPreviewTimerRef.current) clearTimeout(ixPreviewTimerRef.current);
      previewStylePatch({ interactions: nextIx });
      if (ixSaveTimerRef.current) clearTimeout(ixSaveTimerRef.current);
      void flushInteractionSave();
    },
    [editingDisabledBySectionLock, previewStylePatch, flushInteractionSave]
  );

  const commitStylePatch = async (patch) => {
    if (!selectedNode) return;
    if (editingDisabledBySectionLock) return;
    await onUpdateNode?.({
      nodeId: selectedNode.id,
      payload: {
        style_json: mergeStyleForDevice(selectedNode, device, patch, siteTheme),
      },
    });
  };

  const freezeInspectorPanels =
    Boolean(selectedNode) &&
    editingDisabledBySectionLock &&
    !isLinkedGlobalPlaceholder(selectedNode);

  return (
    <div className={rootClass}>
      <div className="bld-inspector__sticky-head">
        <div className="bld-inspector__chrome-head">
          {activeTab === 'theme' ? (
            <div className="bld-inspector__chrome-title">
              <span className="bld-inspector__chrome-role">Design system</span>
              <span className="bld-inspector__chrome-name">Page theme</span>
            </div>
          ) : selectedNode ? (
            <div className="bld-inspector__chrome-title">
              <span className="bld-inspector__chrome-role">{inspectorRoleLabel(selectedNode)}</span>
              <span className="bld-inspector__chrome-name" title={selectedNode.displayName || selectedNode.nodeType}>
                {selectedNode.displayName || selectedNode.nodeType}
              </span>
              {isLinkedGlobalPlaceholder(selectedNode) ? (
                <span
                  className="bld-chip"
                  style={{ marginLeft: 10, padding: '2px 8px', cursor: 'default' }}
                  title={
                    getGlobalLinkMeta(selectedNode)?.globalComponentName
                      ? `Linked: ${getGlobalLinkMeta(selectedNode).globalComponentName}`
                      : 'Linked global component'
                  }
                >
                  Linked
                </span>
              ) : null}
              {isLinkedGlobalPlaceholder(selectedNode) ? (
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => onEditGlobalComponent?.(getGlobalLinkMeta(selectedNode)?.globalComponentId)}
                  >
                    Edit Global
                  </button>
                  <button
                    type="button"
                    className="bld-chip bld-chip--danger"
                    onClick={() => onDetachFromGlobalComponent?.(selectedNode.id)}
                  >
                    Detach
                  </button>
                </span>
              ) : null}
              {!isLinkedGlobalPlaceholder(selectedNode) && editingDisabledBySectionLock ? (
                <span
                  className="bld-chip"
                  style={{ marginLeft: 10, padding: '2px 8px', cursor: 'default' }}
                  title="Unlock from the Sections list or Layers tab (lock button)"
                >
                  Locked
                </span>
              ) : null}
            </div>
          ) : (
            <div className="bld-inspector__chrome-placeholder">
              Select something on the canvas, or add a section from the left panel when the page is empty.
            </div>
          )}
        </div>
        {isLinkedGlobalPlaceholder(selectedNode) ? (
          <div className="bld-panel" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <div className="bld-field-note" style={{ margin: 0 }}>
              This section is <strong>linked</strong> to a global component. To prevent accidental desync, editing is
              disabled here—use <strong>Edit Global</strong> or <strong>Detach</strong>.
            </div>
          </div>
        ) : null}
        {!isLinkedGlobalPlaceholder(selectedNode) && editingDisabledBySectionLock ? (
          <div className="bld-panel" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <div className="bld-field-note" style={{ margin: 0 }}>
              This section is <strong>locked</strong>. Edits on the canvas and in the inspector are paused. Open the
              left panel → <strong>Sections</strong> or <strong>Layers</strong> and click the lock icon to unlock.
            </div>
          </div>
        ) : null}
        {showDeviceBar ? (
          <InspectorResponsiveBar
            device={device}
            onDeviceChange={onDeviceChange}
            hasTabletOverrides={hasTabletOverrides}
            hasMobileOverrides={hasMobileOverrides}
            onResetTablet={handleResetTablet}
            onResetMobile={handleResetMobile}
            onCopyDesktopToTablet={() => handleCopyDesktopToDevice('tablet')}
            onCopyDesktopToMobile={() => handleCopyDesktopToDevice('mobile')}
            disableResets={!selectedNode || editingDisabledBySectionLock}
            disabled={Boolean(selectedNode && editingDisabledBySectionLock)}
          />
        ) : null}
        <InspectorTabs activeTab={activeTab} onChange={setActiveTab} tabs={availableTabs} />
        {nestedFeatureTabsNode && typeof onSelectNode === 'function' ? (
          <div className="bld-panel" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <p className="bld-field-note" style={{ margin: '0 0 10px' }}>
              Click <strong>Edit Feature tabs</strong>, then edit text and images on the canvas. Sidebar controls
              alignment and size — not on {inspectorRoleLabel(selectedNode)}.
            </p>
            <button
              type="button"
              className="bld-btn bld-btn--primary"
              onClick={() => {
                onSelectNode(nestedFeatureTabsNode.id);
                setActiveTab('content');
              }}
            >
              Edit Feature tabs
            </button>
          </div>
        ) : null}
        {nestedFaqAccordionNode && typeof onSelectNode === 'function' ? (
          <div className="bld-panel" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <p className="bld-field-note" style={{ margin: '0 0 10px' }}>
              Edit FAQ on the canvas — select <strong>FAQ accordion</strong> (not {inspectorRoleLabel(selectedNode)}).
            </p>
            <button
              type="button"
              className="bld-btn bld-btn--primary"
              onClick={() => {
                onSelectNode(nestedFaqAccordionNode.id);
                setActiveTab('content');
              }}
            >
              Edit FAQ accordion
            </button>
          </div>
        ) : null}
        {variant === 'panel' && onInsertDivider ? (
          <LineToolsPanel
            onInsertHorizontal={() => onInsertDivider('horizontal', 'inside')}
            onInsertVertical={() => onInsertDivider('vertical', 'inside')}
            disabled={!canInsertDivider || editingDisabledBySectionLock}
            busy={isCreatingNode}
            hint={
              !canInsertDivider
                ? 'Add a page section first.'
                : editingDisabledBySectionLock
                  ? 'Unlock this section to add lines.'
                  : 'Adds a line inside the selected stack.'
            }
          />
        ) : null}
      </div>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={
          freezeInspectorPanels
            ? { opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }
            : undefined
        }
      >
      {activeTab === 'content' ? (
        <ContentPanel
          selectedNode={selectedNode}
          form={form}
          onChange={handleContentChange}
          jsonErrors={jsonErrors}
          projectPages={projectPages}
          projectId={projectId}
          pageId={pageId}
          pageTree={pageTree}
          sectionStripLayoutRow={sectionStripLayoutRow}
          onPatchStripRowPaddingY={patchStripRowPaddingY}
          nestedFeatureTabsNode={nestedFeatureTabsNode}
          onSelectFeatureTabs={
            nestedFeatureTabsNode && typeof onSelectNode === 'function'
              ? () => onSelectNode(nestedFeatureTabsNode.id)
              : undefined
          }
        />
      ) : null}
      {activeTab === 'layout' ? (
        <LayoutPanel
          selectedNode={selectedNode}
          form={form}
          onChange={handleStyleChange}
          onContentChange={handleContentChange}
          deviceLabel={deviceLabel}
          visibilityByDevice={visibilityByDevice}
          onVisibilityForDevice={handleVisibilityForDevice}
          onApplyFlexPreset={handleApplyFlexPreset}
          onResetLayoutKeys={handleResetLayoutKeys}
          onRowLayoutLockedChange={handleRowLayoutLockedChange}
          onHeaderLayoutQuickAction={handleHeaderLayoutQuickAction}
          pageTree={pageTree}
          stripLayoutTargetRow={sectionStripLayoutRow}
          onPatchRootStripLayout={patchRootStripLayout}
          onPatchHeaderLayoutMode={patchHeaderLayoutMode}
          onPatchHeaderBehavior={patchHeaderBehavior}
          onPatchSectionLayout={patchSectionLayout}
          onPatchStripRowHeightPx={patchStripRowHeightPx}
          disabled={editingDisabledBySectionLock}
        />
      ) : null}
      {activeTab === 'layout' ? (
        <div className="bld-panel" style={{ paddingTop: 0 }}>
          <OverflowSuggestions
            selectedNode={selectedNode}
            device={device}
            deviceLabel={deviceLabel}
            overflowDiagnostics={overflowDiagnostics}
            onApplyPatch={async (patch) => {
              await commitStylePatch(patch);
            }}
          />
        </div>
      ) : null}
      {activeTab === 'style' ? (
        <StylePanel
          selectedNode={selectedNode}
          capabilities={nodeCaps}
          form={form}
          onChange={handleStyleChange}
          onPatchForm={patchForm}
          projectId={projectId}
          onPreviewStylePatch={previewStylePatch}
          onCommitStylePatch={commitStylePatch}
          onClearPreviewStyle={clearPreviewCss}
          onActiveSpacingEdit={onSetActiveSpacingEdit}
          onApplyPreset={handleApplyStylePreset}
        />
      ) : null}
      {activeTab === 'form' && selectedNode?.nodeType === 'form' ? (
        <FormBuilderPanel
          selectedNode={selectedNode}
          form={form}
          onChange={handleContentChange}
          disabled={editingDisabledBySectionLock}
          pageId={pageId}
          projectId={projectId}
          previewMode={formPreviewMode}
          onPreviewModeChange={(mode) => onSetFormPreviewModeForNode?.(selectedNode?.id, mode)}
          jsonErrors={jsonErrors}
        />
      ) : null}
      {activeTab === 'interactions' ? (
        <InteractionsPanel
          form={form}
          onInteractionChange={handleInteractionChange}
          onInteractionClearGroup={handleInteractionClearGroup}
          disabled={editingDisabledBySectionLock}
          selectedNodeId={selectedNode?.id}
          device={device}
        />
      ) : null}
      {activeTab === 'seo' ? (
        <SeoCmsPanel
          selectedNode={selectedNode}
          projectId={projectId}
          pageId={pageId}
          onChange={handleContentChange}
        />
      ) : null}
      {activeTab === 'advanced' ? (
        <AdvancedPanel
          selectedNode={selectedNode}
          form={form}
          onAdvancedChange={handleAdvancedChange}
          onContentChange={handleContentChange}
          jsonErrors={jsonErrors}
        />
      ) : null}
      {activeTab === 'theme' ? (
        <ThemePanel
          pageTree={pageTree}
          onPatchRootSectionPageSpacing={patchRootSectionPageSpacingById}
          selectedNodeId={
            selectedNode?.nodeType === 'row' && isRootPageRow(pageTree, selectedNode) ? selectedNode.id : null
          }
          onApplyResponsiveToPage={onApplyResponsiveToPage}
          isApplyingResponsive={isApplyingResponsive}
          hideBrandSections={hideBrandThemeSections}
        />
      ) : null}

      {pluginPanelsForTab.length
        ? pluginPanelsForTab
            .filter((p) => {
              try {
                return typeof p.shouldRender === 'function'
                  ? Boolean(p.shouldRender(selectedNode, { capabilities: nodeCaps, activeTab }))
                  : true;
              } catch {
                return false;
              }
            })
            .map((p) => {
              try {
                return p.render({
                  selectedNode,
                  form,
                  capabilities: nodeCaps,
                  activeTab,
                });
              } catch {
                return null;
              }
            })
        : null}
      </div>
    </div>
  );
}