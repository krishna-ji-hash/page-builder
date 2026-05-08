'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { dataSourceRegistry } from '@/lib/runtime/dataSourceRegistry';
import { normalizeResponsiveStyle, stripDeviceLayoutKeysInStyleJson } from '@/lib/styleNormalizer';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { normalizeMenuAlign, normalizeMenuVariant } from '@/lib/menuNav';
import { normalizeMenuItems } from '@/lib/menuItems';
import { mergeDeviceStyleWithTypeDefaults, mergeMenuDeviceStyle } from '@/lib/nodeLayoutDefaults';
import { mergeNodeStyleWithSiteTheme, themeSpacingPx } from '@/lib/siteDesignTheme';
import { GAP_SCALE_IDS, inferGapScaleFromPx, withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { buildFlexLayoutPresets } from '@/lib/flexLayoutPresets';
import { isLayoutLockedRow } from '@/lib/rowLayoutMeta';
import { getDeviceStyle, styleToCss } from '@/lib/styleToCss';
import InspectorTabs from './inspector/InspectorTabs';
import InspectorResponsiveBar from './inspector/InspectorResponsiveBar';
import ContentPanel from './inspector/ContentPanel';
import StylePanel from './inspector/StylePanel';
import AdvancedPanel from './inspector/AdvancedPanel';
import ThemePanel from './inspector/ThemePanel';
import OverflowSuggestions from './inspector/OverflowSuggestions';
import { getGlobalLinkMeta, isLinkedGlobalPlaceholder } from '@/lib/globalComponentLinkMeta';

function inspectorRoleLabel(node) {
  if (!node?.nodeType) return '';
  if (node.nodeType === 'row') return 'Section';
  if (node.nodeType === 'column') return 'Column';
  if (node.nodeType === 'stack') return 'Stack';
  return 'Widget';
}

function getSelectedDeviceStyle(selectedNode, device, siteTheme) {
  const nt = selectedNode?.nodeType ?? null;
  const normalized = normalizeResponsiveStyle(selectedNode?.style_json || {}, { nodeType: nt, siteTheme });
  return getDeviceStyle(normalized, device);
}

/** Resolved style for the active breakpoint: theme merge + type/menu defaults (matches canvas / liveRenderer). */
function getInspectorResolvedStyle(selectedNode, device, siteTheme) {
  const raw = getSelectedDeviceStyle(selectedNode, device, siteTheme);
  const nt = selectedNode?.nodeType;
  if (!nt) return mergeNodeStyleWithSiteTheme(raw, siteTheme, null);
  const themed = withResolvedLayoutGap(mergeNodeStyleWithSiteTheme(raw, siteTheme, nt), siteTheme);
  if (nt === 'menu') {
    const orientation = selectedNode.props?.orientation === 'column' ? 'column' : 'row';
    return mergeDeviceStyleWithTypeDefaults(
      nt,
      mergeMenuDeviceStyle(orientation, themed, { align: selectedNode.props?.align }, siteTheme)
    );
  }
  return mergeDeviceStyleWithTypeDefaults(nt, themed);
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
    spacing: { ...(currentDevice.spacing || {}), ...(patch.spacing || {}) },
    size: { ...(currentDevice.size || {}), ...(patch.size || {}) },
    typography: { ...(currentDevice.typography || {}), ...(patch.typography || {}) },
    colors: { ...(currentDevice.colors || {}), ...(patch.colors || {}) },
    background: { ...(currentDevice.background || {}), ...(patch.background || {}) },
    effects: { ...(currentDevice.effects || {}), ...(patch.effects || {}) },
    border: { ...(currentDevice.border || {}), ...(patch.border || {}) },
    menu: { ...(currentDevice.menu || {}), ...(patch.menu || {}) },
  };

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
    return next;
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
  };

  Object.keys(next[device]).forEach((group) => {
    if (!next[device][group]) delete next[device][group];
  });

  return next;
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

function parseBoxToObject(value) {
  const parts = String(value || '0px 0px 0px 0px').trim().split(/\s+/);
  const [top = '0px', right = top, bottom = top, left = right] = parts;
  return {
    top: parsePxValue(top, 0),
    right: parsePxValue(right, 0),
    bottom: parsePxValue(bottom, 0),
    left: parsePxValue(left, 0),
  };
}

export default function BuilderInspector({
  device = 'desktop',
  onDeviceChange,
  selectedNode,
  onUpdateNode,
  projectPages = [],
  projectId,
  activeTab: activeTabProp,
  onActiveTabChange,
  /** `rail` = embedded under library; `panel` / `default` = dedicated right column. */
  variant = 'default',
  onSetPreviewCssForNode,
  onSetActiveSpacingEdit,
  overflowDiagnostics,
  onEditGlobalComponent,
  onDetachFromGlobalComponent,
}) {
  const [internalTab, setInternalTab] = useState('content');
  const activeTab = activeTabProp || internalTab;
  const setActiveTab = onActiveTabChange || setInternalTab;
  const { siteTheme } = useBuilderTheme();
  // Prevent "snap back" in selects when parent re-renders selectedNode before async save completes.
  const pendingCarouselVariantRef = useRef(null);
  // Same issue for other carousel fields (number inputs + other selects/toggles).
  // Parent often provides a new `selectedNode` object before async save completes, so we keep a short-lived draft.
  const pendingCarouselFormRef = useRef({});
  const [jsonErrors, setJsonErrors] = useState({
    tableColumnsJson: '',
    formFieldsJson: '',
    actionJson: '',
    menuItemsJson: '',
    carouselSlidesJson: '',
  });
  const [form, setForm] = useState({
    text: '',
    href: '',
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
    textColor: '#0f172a',
    bgColor: '#ffffff',
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
    menuUseProjectPages: false,
    menuVariant: 'pill',
    menuAlign: 'center',
    menuMegaEnabled: false,
    menuMegaColumns: 2,
    menuMobileEnabled: true,
    menuMobileTitle: '',
    menuMobileHamburgerLabel: '',
    richTextHtml: '',
    animationPreset: 'none',
    animationDuration: 0.6,
    animationDelay: 0,
    carouselSlidesJson: '[]',
    carouselVariant: 'hero',
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
    carouselShowOverlay: true,
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
    const marginObj = parseBoxToObject(style?.spacing?.margin);
    const paddingObj = parseBoxToObject(style?.spacing?.padding);
    const maxWidthRaw = String(style?.layout?.maxWidth || '').trim();
    const hasAutoMargins = String(style?.spacing?.margin || '').includes('auto');
    const parsedMaxWidthPx = parsePxValue(maxWidthRaw, 1200);
    let inferredContainerWidthMode = 'full';
    let rowWidthPercent = 100;
    if (selectedNode?.nodeType === 'row') {
      if (maxWidthRaw.endsWith('px') && hasAutoMargins) {
        inferredContainerWidthMode = 'boxed';
      } else if (maxWidthRaw.endsWith('%')) {
        inferredContainerWidthMode = 'full';
        rowWidthPercent = Math.min(100, Math.max(10, parseFloat(maxWidthRaw) || 100));
      } else {
        inferredContainerWidthMode = 'full';
      }
    }
    const nodeCarouselVariant = String(selectedNode.props?.variant || selectedNode.props?.settings?.variant || 'hero');
    const pendingVariant = pendingCarouselVariantRef.current;
    const shouldUsePendingVariant =
      pendingVariant &&
      pendingVariant.value &&
      pendingVariant.value !== nodeCarouselVariant &&
      Date.now() - pendingVariant.ts < 1500;

    const pending = pendingCarouselFormRef.current || {};
    const pickPending = (fieldKey, nodeValue) => {
      const p = pending[fieldKey];
      if (!p) return nodeValue;
      if (Date.now() - p.ts >= 1500) return nodeValue;
      // Always prefer the draft if it differs (including '' for number inputs while typing).
      return p.value !== nodeValue ? p.value : nodeValue;
    };

    setForm({
      text: selectedNode.props?.text || '',
      href: selectedNode.props?.href || '',
      alignment: style?.typography?.textAlign || 'left',
      size: selectedNode.props?.size || 'medium',
      src: selectedNode.props?.src || '',
      alt: selectedNode.props?.alt || '',
      imageFit: selectedNode.props?.imageFit || 'cover',
      imageHeightPx: Number(selectedNode.props?.imageHeightPx || 0),
      fontFamily: style?.typography?.fontFamily || 'Inter',
      fontSizePx: parsePxValue(style?.typography?.fontSize, 16),
      fontWeight: style?.typography?.fontWeight || '400',
      lineHeight: style?.typography?.lineHeight || '1.4',
      letterSpacingPx: parsePxValue(style?.typography?.letterSpacing, 0),
      textTransform: style?.typography?.textTransform || 'none',
      textDecoration: style?.typography?.textDecoration || 'none',
      textColor: style?.colors?.textColor || style?.typography?.color || '#0f172a',
      bgColor: style?.colors?.backgroundColor || style?.background?.backgroundColor || '#ffffff',
      bgImageUrl: style?.background?.backgroundImage || '',
      bgImageAlt: style?.background?.meta?.altText || '',
      bgImageTitle: style?.background?.meta?.title || '',
      marginTop: marginObj.top,
      marginRight: marginObj.right,
      marginBottom: marginObj.bottom,
      marginLeft: marginObj.left,
      paddingTop: paddingObj.top,
      paddingRight: paddingObj.right,
      paddingBottom: paddingObj.bottom,
      paddingLeft: paddingObj.left,
      borderRadiusPx: parsePxValue(style?.border?.radius || style?.effects?.borderRadius, 0),
      borderWidthPx: parsePxValue(style?.border?.width, 0),
      borderColor: style?.border?.color || '#dddddd',
      padding: style?.spacing?.padding || '0px',
      margin: style?.spacing?.margin || '0px 0px 0px 0px',
      paddingAdvanced: style?.spacing?.padding || '0px 0px 0px 0px',
      position: style?.layout?.position || 'static',
      left: style?.layout?.left ?? '',
      top: style?.layout?.top ?? '',
      right: style?.layout?.right ?? '',
      bottom: style?.layout?.bottom ?? '',
      zIndex: style?.layout?.zIndex ?? '',
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
        style?.layout?.flexDirection ||
        (selectedNode?.nodeType === 'stack' ? 'row' : 'column'),
      layoutFlexWrap: String(style?.layout?.flexWrap || 'nowrap'),
      layoutGapScale: (() => {
        const gs = style?.layout?.gapScale;
        if (typeof gs === 'string' && GAP_SCALE_IDS.includes(gs)) return gs;
        return inferGapScaleFromPx(style?.layout?.gap, siteTheme) || '';
      })(),
      layoutGapPx: parsePxValue(style?.layout?.gap, 0),
      layoutAlign: style?.layout?.alignItems || 'stretch',
      layoutJustify: style?.layout?.justifyContent || 'flex-start',
      layoutAlignContent: style?.layout?.alignContent || 'stretch',
      widthMode:
        String(style?.size?.width || '') === '100%'
          ? 'full'
          : String(style?.size?.width || '').endsWith('px')
            ? 'px'
            : 'auto',
      widthPx: parsePxValue(style?.size?.width, 320),
      heightPx: parsePxValue(style?.size?.height, 0),
      containerWidthMode: inferredContainerWidthMode,
      containerWidthPx: parsedMaxWidthPx || 1200,
      rowWidthPercent,
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
      menuUseProjectPages: Boolean(selectedNode.props?.useProjectPages),
      menuVariant: normalizeMenuVariant(selectedNode.props?.variant),
      menuAlign: normalizeMenuAlign(selectedNode.props?.align),
      menuMegaEnabled: Boolean(selectedNode.props?.mega?.enabled),
      menuMegaColumns: Number(selectedNode.props?.mega?.columns ?? 2),
      menuMobileEnabled: selectedNode.props?.mobile?.enabled !== false,
      menuMobileTitle: typeof selectedNode.props?.mobile?.title === 'string' ? selectedNode.props.mobile.title : '',
      menuMobileHamburgerLabel:
        typeof selectedNode.props?.mobile?.hamburgerLabel === 'string' ? selectedNode.props.mobile.hamburgerLabel : '',
      richTextHtml: selectedNode.props?.content || '',
      animationPreset: selectedNode.props?.animation?.preset || 'none',
      animationDuration: Number(selectedNode.props?.animation?.duration ?? 0.6),
      animationDelay: Number(selectedNode.props?.animation?.delay ?? 0),
      carouselSlidesJson: JSON.stringify(Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [], null, 2),
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
      carouselShowOverlay: pickPending(
        'carouselShowOverlay',
        Boolean(selectedNode.props?.showOverlay ?? selectedNode.props?.settings?.showOverlay ?? true)
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
  }, [selectedNode, device, siteTheme]);

  const updateNode = async (id, changes) => {
    if (!onUpdateNode) return;
    if (isLinkedGlobalPlaceholder(selectedNode)) return;
    await onUpdateNode({ nodeId: id, payload: changes });
  };

  const updateProps = async (changes) => {
    if (!selectedNode) return;
    await updateNode(selectedNode.id, {
      props: {
        ...(selectedNode.props || {}),
        ...changes,
      },
    });
  };

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

  const updateStyle = async (styleChanges, styleJsonOverride) => {
    if (!selectedNode) return;
    await updateNode(selectedNode.id, {
      style_json: mergeStyleForDevice(selectedNode, device, styleChanges, siteTheme, styleJsonOverride),
    });
  };

  const normalizeCarouselSlide = (slide, index) => {
    const s = slide && typeof slide === 'object' ? slide : {};
    const card = s.card && typeof s.card === 'object' ? s.card : {};
    const cta = s.cta && typeof s.cta === 'object' ? s.cta : {};
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
        },
      },
    });
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
    setForm((prev) => ({ ...prev, [key]: value }));
    if (!selectedNode) return;
    if (selectedNode.nodeType === 'carousel' && typeof key === 'string' && key.startsWith('carousel')) {
      const pending = pendingCarouselFormRef.current || {};
      pendingCarouselFormRef.current = { ...pending, [key]: { value, ts: Date.now() } };
    }
    if (key === 'text') await updateProps({ text: value });
    if (key === 'href') await updateProps({ href: value });
    if (key === 'size') await updateProps({ size: value });
    if (key === 'src') await updateProps({ src: value });
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
    if (key === 'menuMobileTitle' && selectedNode.nodeType === 'menu') {
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), title: String(value || '') } });
    }
    if (key === 'menuMobileHamburgerLabel' && selectedNode.nodeType === 'menu') {
      await updateProps({ mobile: { ...(selectedNode.props?.mobile || {}), hamburgerLabel: String(value || '') } });
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
    if (selectedNode.nodeType === 'carousel') {
      if (key === 'carouselVariant') {
        const v = String(value || 'hero');
        pendingCarouselVariantRef.current = { value: v, ts: Date.now() };
        await updateCarouselTopLevel({ variant: v });
        await updateCarouselSettings({ variant: v });
        return;
      }
      if (key === 'carouselAutoplay') {
        const v = Boolean(value);
        await updateCarouselTopLevel({ autoplay: v });
        await updateCarouselSettings({ autoplay: v });
        return;
      }
      if (key === 'carouselLoop') {
        const v = Boolean(value);
        await updateCarouselTopLevel({ loop: v });
        await updateCarouselSettings({ loop: v });
        return;
      }
      if (key === 'carouselArrows') {
        const v = Boolean(value);
        await updateCarouselTopLevel({ showArrows: v });
        await updateCarouselSettings({ arrows: v });
        return;
      }
      if (key === 'carouselDots') {
        const v = Boolean(value);
        await updateCarouselTopLevel({ showDots: v });
        await updateCarouselSettings({ dots: v });
        return;
      }
      if (key === 'carouselSpeedMs') {
        if (value === '') return;
        const ms = Math.max(0, Number(value) || 0);
        await updateCarouselTopLevel({ speed: ms });
        await updateCarouselSettings({ speedMs: ms });
        return;
      }
      if (key === 'carouselIntervalMs') {
        if (value === '') return;
        const ms = Math.max(0, Number(value) || 0);
        await updateCarouselTopLevel({ interval: ms });
        await updateCarouselSettings({ autoplayMs: ms });
        return;
      }
      if (key === 'carouselPauseOnHover') {
        const v = Boolean(value);
        await updateCarouselTopLevel({ pauseOnHover: v });
        return;
      }
      if (key === 'carouselGapPx') {
        if (value === '') return;
        const gap = Math.max(0, Number(value) || 0);
        await updateCarouselTopLevel({ gap });
        await updateCarouselSettings({ gapPx: gap });
        return;
      }
      if (key === 'carouselImageFit') {
        const fit = String(value || 'cover').toLowerCase() === 'contain' ? 'contain' : 'cover';
        await updateCarouselTopLevel({ imageFit: fit });
        await updateCarouselSettings({ imageFit: fit });
        return;
      }
      if (key === 'carouselShowOverlay') {
        const enabled = Boolean(value);
        await updateCarouselTopLevel({ showOverlay: enabled });
        await updateCarouselSettings({ showOverlay: enabled });
        return;
      }
      if (key === 'carouselPerView') {
        if (value === '') return;
        const n = Math.max(1, Math.min(6, Math.floor(Number(value) || 1)));
        const prevSettings = selectedNode.props?.settings && typeof selectedNode.props.settings === 'object' ? selectedNode.props.settings : {};
        const perView = prevSettings.perView && typeof prevSettings.perView === 'object' ? prevSettings.perView : {};
        const prevSpv = selectedNode.props?.slidesPerView && typeof selectedNode.props.slidesPerView === 'object' ? selectedNode.props.slidesPerView : {};
        await updateCarouselTopLevel({ slidesPerView: { ...prevSpv, [device]: n } });
        await updateCarouselSettings({ perView: { ...perView, [device]: n } });
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
        const next = current.map((s, i) => (i === idx ? { ...(s || {}), ...(patch || {}) } : s));
        const normalized = next.map((s, i) => normalizeCarouselSlide(s, i));
        await updateProps({ slides: normalized });
        setForm((prevForm) => ({ ...prevForm, carouselSlidesJson: JSON.stringify(normalized, null, 2) }));
        return;
      }
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
    if (isLayoutLockedRow(selectedNode) && LOCKED_LAYOUT_FORM_KEYS.has(key)) return;

    let nextForm = { ...form, [key]: value };
    if (key === 'layoutGapScale' && GAP_SCALE_IDS.includes(String(value))) {
      nextForm = { ...nextForm, layoutGapPx: themeSpacingPx(siteTheme, value) };
    }
    if (key === 'layoutGapPx') {
      nextForm = { ...nextForm, layoutGapScale: '' };
    }
    setForm(nextForm);
    const isLayoutNode =
      selectedNode?.nodeType === 'row' ||
      selectedNode?.nodeType === 'column' ||
      selectedNode?.nodeType === 'stack' ||
      selectedNode?.nodeType === 'menu';
    const isFlexLayoutContainer =
      selectedNode?.nodeType === 'row' ||
      selectedNode?.nodeType === 'column' ||
      selectedNode?.nodeType === 'stack';

    if (key === 'menuTextColor' && selectedNode?.nodeType === 'menu') {
      await updateStyle({
        typography: { color: value },
        colors: { textColor: value },
      });
      return;
    }

    const isRow = selectedNode?.nodeType === 'row';
    const rawMode = isRow ? String(nextForm.containerWidthMode || 'full') : 'full';
    const containerMode = rawMode === 'custom' ? 'boxed' : rawMode;
    const containerPx = Math.max(320, Math.min(2400, parsePxValue(nextForm.containerWidthPx, 1200)));
    const rowWidthPct = Math.min(100, Math.max(10, Number(nextForm.rowWidthPercent) || 100));
    const isBoxed = isRow && containerMode === 'boxed';
    const fullRowNarrow = isRow && containerMode === 'full' && rowWidthPct < 100;
    const needsHorizontalCenter = isRow && (isBoxed || fullRowNarrow);
    const nextMargin = needsHorizontalCenter
      ? `${parsePxValue(nextForm.marginTop)}px auto ${parsePxValue(nextForm.marginBottom)}px auto`
      : `${parsePxValue(nextForm.marginTop)}px ${parsePxValue(nextForm.marginRight)}px ${parsePxValue(nextForm.marginBottom)}px ${parsePxValue(nextForm.marginLeft)}px`;

    const rowLayoutMaxWidth =
      !isRow
        ? {}
        : containerMode === 'boxed'
          ? { maxWidth: `${containerPx}px` }
          : { maxWidth: `${rowWidthPct}%` };

    const flexGapPx = parsePxValue(nextForm.layoutGapPx, 0);
    const flexWrapVal = String(nextForm.layoutFlexWrap || 'nowrap').trim() || 'nowrap';
    const gapScaleSel = String(nextForm.layoutGapScale || '').trim();
    const useGapScale = GAP_SCALE_IDS.includes(gapScaleSel);
    const baseJsonOverride =
      isFlexLayoutContainer && !useGapScale
        ? stripDeviceLayoutKeysInStyleJson(selectedNode.style_json, device, ['gapScale'], selectedNode.nodeType, siteTheme)
        : undefined;

    const flexLayoutCore = isFlexLayoutContainer
      ? {
          flexDirection:
            nextForm.layoutDirection || (selectedNode?.nodeType === 'stack' ? 'row' : 'column'),
          flexWrap: flexWrapVal,
          alignItems: nextForm.layoutAlign || 'stretch',
          justifyContent: nextForm.layoutJustify || 'flex-start',
          alignContent: nextForm.layoutAlignContent || 'stretch',
          ...rowLayoutMaxWidth,
          ...(useGapScale
            ? { gapScale: gapScaleSel, gap: themeSpacingPx(siteTheme, gapScaleSel) }
            : { gap: flexGapPx }),
        }
      : {};

    const stylePatch = {
      layout: flexLayoutCore,
      typography: {
        fontFamily: nextForm.fontFamily,
        fontSize: `${parsePxValue(nextForm.fontSizePx, 16)}px`,
        fontWeight: nextForm.fontWeight,
        lineHeight: String(nextForm.lineHeight || '1.4'),
        letterSpacing: `${parsePxValue(nextForm.letterSpacingPx, 0)}px`,
        textTransform: nextForm.textTransform,
        textDecoration: nextForm.textDecoration,
        color: nextForm.textColor,
      },
      colors: {
        textColor: nextForm.textColor,
        backgroundColor: nextForm.bgColor,
      },
      background: {
        backgroundColor: nextForm.bgColor,
        backgroundImage: nextForm.bgImageUrl ? String(nextForm.bgImageUrl) : undefined,
        backgroundSize: nextForm.bgImageUrl ? 'cover' : undefined,
        backgroundPosition: nextForm.bgImageUrl ? 'center' : undefined,
        backgroundRepeat: nextForm.bgImageUrl ? 'no-repeat' : undefined,
        meta:
          nextForm.bgImageUrl
            ? {
                altText: String(nextForm.bgImageAlt || ''),
                title: String(nextForm.bgImageTitle || ''),
              }
            : undefined,
      },
      spacing: {
        margin: nextMargin,
        padding: `${parsePxValue(nextForm.paddingTop)}px ${parsePxValue(nextForm.paddingRight)}px ${parsePxValue(nextForm.paddingBottom)}px ${parsePxValue(nextForm.paddingLeft)}px`,
        ...(isFlexLayoutContainer ? {} : { gap: `${flexGapPx}px` }),
      },
      size: {
        width: isRow
          ? '100%'
          : nextForm.widthMode === 'full'
            ? '100%'
            : nextForm.widthMode === 'px'
              ? `${parsePxValue(nextForm.widthPx, 320)}px`
              : 'auto',
        height: parsePxValue(nextForm.heightPx, 0) > 0 ? `${parsePxValue(nextForm.heightPx, 0)}px` : 'auto',
      },
      border: {
        radius: `${parsePxValue(nextForm.borderRadiusPx)}px`,
        width: `${parsePxValue(nextForm.borderWidthPx)}px`,
        color: nextForm.borderColor,
        style: 'solid',
      },
      effects: {
        borderRadius: `${parsePxValue(nextForm.borderRadiusPx)}px`,
      },
      menu:
        selectedNode?.nodeType === 'menu'
          ? {
              gap: parsePxValue(nextForm.menuGapPx, 12),
              itemPadding: String(nextForm.menuItemPadding || '6px 12px'),
              borderRadius: String(nextForm.menuBorderRadius || '20px'),
              hoverColor: String(nextForm.menuHoverColor || '#6366f1'),
              hoverBg: String(nextForm.menuHoverBg || '#f1f5ff'),
            }
          : {},
    };

    await updateStyle(stylePatch, baseJsonOverride);
  };

  const handleApplyFlexPreset = async (layout) => {
    if (!selectedNode || !layout || typeof layout !== 'object') return;
    if (isLayoutLockedRow(selectedNode)) return;
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
    const meta = selectedNode.props?.meta || {};
    if (!meta.isHeader && meta.role !== 'header') return;
    if (isLayoutLockedRow(selectedNode)) return;
    if (action === 'sticky') {
      setForm((prev) => ({ ...prev, position: 'sticky', top: '0', zIndex: '50' }));
      await updateStyle({ layout: { position: 'sticky', top: '0', zIndex: '50' } });
      return;
    }
    if (action === 'static') {
      setForm((prev) => ({ ...prev, position: 'static', top: '', zIndex: '' }));
      await updateStyle({ layout: { position: 'static', top: 'auto', zIndex: 'auto' } });
    }
  };

  const handleAdvancedChange = async (key, value) => {
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

  const setPreviewCss = (css) => {
    if (!selectedNode?.id) return;
    onSetPreviewCssForNode?.(selectedNode.id, css);
  };

  const clearPreviewCss = () => {
    if (!selectedNode?.id) return;
    onSetPreviewCssForNode?.(selectedNode.id, null);
  };

  const previewStylePatch = (patch) => {
    if (!selectedNode) return;
    const nextStyleJson = mergeStyleForDevice(selectedNode, device, patch, siteTheme);
    const tmpNode = { ...selectedNode, style_json: nextStyleJson };
    const resolved = getInspectorResolvedStyle(tmpNode, device, siteTheme);
    setPreviewCss(resolved ? styleToCss(resolved, siteTheme) : null);
  };

  const commitStylePatch = async (patch) => {
    if (!selectedNode) return;
    await onUpdateNode?.(selectedNode.id, {
      style_json: mergeStyleForDevice(selectedNode, device, patch, siteTheme),
    });
  };

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
            disableResets={!selectedNode}
          />
        ) : null}
        <InspectorTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === 'content' ? (
        <ContentPanel
          selectedNode={selectedNode}
          form={form}
          onChange={handleContentChange}
          jsonErrors={jsonErrors}
          projectPages={projectPages}
          projectId={projectId}
        />
      ) : null}
      {activeTab === 'style' ? (
        <StylePanel
          selectedNode={selectedNode}
          form={form}
          onChange={handleStyleChange}
          projectId={projectId}
          onPreviewStylePatch={previewStylePatch}
          onCommitStylePatch={commitStylePatch}
          onClearPreviewStyle={clearPreviewCss}
          onActiveSpacingEdit={onSetActiveSpacingEdit}
          deviceLabel={deviceLabel}
          visibilityByDevice={visibilityByDevice}
          onVisibilityForDevice={handleVisibilityForDevice}
          onApplyFlexPreset={handleApplyFlexPreset}
          onResetLayoutKeys={handleResetLayoutKeys}
          onRowLayoutLockedChange={handleRowLayoutLockedChange}
          onHeaderLayoutQuickAction={handleHeaderLayoutQuickAction}
        />
      ) : null}
      {activeTab === 'style' ? (
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
      {activeTab === 'theme' ? <ThemePanel /> : null}
      {activeTab === 'advanced' ? (
        <AdvancedPanel
          selectedNode={selectedNode}
          form={form}
          onAdvancedChange={handleAdvancedChange}
          onContentChange={handleContentChange}
          jsonErrors={jsonErrors}
        />
      ) : null}
    </div>
  );
}