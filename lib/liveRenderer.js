import ActionButton from '@/components/runtime/ActionButton';
import TextEffectsWrap from '@/components/runtime/TextEffectsWrap';
import { prefixMenuItemsWithProjectSlug, prefixRelativeAppPath } from '@/lib/projectPathPrefix';
import { isPlaceholderNavHref, resolvePlaceholderNavHref } from '@/lib/seo/navLinkResolver';
import Carousel from '@/components/runtime/Carousel';
import CarouselTickerStatic from '@/components/runtime/CarouselTickerStatic';
import DynamicForm from '@/components/runtime/DynamicForm';
import DynamicTable from '@/components/runtime/DynamicTable';
import Menu from '@/components/runtime/Menu';
import FeatureTabs from '@/components/runtime/FeatureTabs';
import FaqAccordion from '@/components/runtime/FaqAccordion';
import StatsCounter from '@/components/runtime/StatsCounter';
import TabHero from '@/components/runtime/TabHero';
import {
  PdpAddToCart,
  PdpBreadcrumbs,
  PdpDeliveryEta,
  PdpDescription,
  PdpGallery,
  PdpImageZoom,
  PdpPrice,
  PdpRelated,
  PdpReviews,
  PdpSaleBadge,
  PdpSpecifications,
  PdpStock,
  PdpQuantity,
  PdpVariantSelector,
} from '@/components/runtime/PdpBlocks';
// PDP widgets live in runtime/PdpBlocks (client leaves).
import {
  LiveAlertNotice,
  LiveBadgeLabel,
  LiveCodeBlock,
  LiveContainerBox,
  LiveContentCard,
  LiveCountdownTimer,
  LiveCounterBlock,
  LiveFeatureList,
  LiveGridBlock,
  LiveHtmlBlock,
  LiveIcon,
  LiveIconBox,
  LiveLogoBlock,
  LiveLottieAnimation,
  LiveMapEmbed,
  LiveModal,
  LiveNewsletterForm,
  LivePricingCard,
  LiveProgressBar,
  LiveRatingStars,
  LiveSocialIcons,
  LiveSpacer,
  LiveTablePro,
  LiveTestimonialCard,
  LiveVideoEmbed,
  LiveWhatsappButton,
} from '@/components/runtime/AdvancedElement';
import { findModalContentStack, modalDialogStyleFromProps } from '@/lib/modalElement';

function renderAdvancedElementShell(key, css, options, hit, inner) {
  return options.builderDataAttr ? (
    <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
      <div style={css}>{inner}</div>
    </div>
  ) : (
    <div key={key} style={css}>
      {inner}
    </div>
  );
}
import { resolveFeatureTabsProps } from '@/lib/featureTabsDefaults';
import { findFeatureTabPanelStack, isFeatureTabsElementPanelMode } from '@/lib/featureTabPanels.js';
import { featureTabsChromeToCssVars } from '@/lib/featureTabsChrome';
import { faqAccordionChromeToCssVars } from '@/lib/faqAccordionChrome';
import { carouselChromeToCssVars } from '@/lib/carouselChrome';
import { resolveDualTickerSlides } from '@/lib/carouselTickerRows';
import { cardChromeToCssVars } from '@/lib/cardChrome';
import { resolveFaqAccordionProps } from '@/lib/faqAccordionDefaults';
import { resolveStatsCounterProps } from '@/lib/statsCounterDefaults';
import { resolveTabHeroProps } from '@/lib/tabHeroDefaults';
import { mergeDeviceStyleWithTypeDefaults, mergeMenuDeviceStyle } from '@/lib/nodeLayoutDefaults';
import { getRichTextAnimationStyle } from '@/lib/richTextAnimation';
import {
  isSiteContentDarkMode,
  shouldNeutralizeHardcodedBodyTextColors,
} from '@/lib/bodyTextNeutralization.js';
import { neutralizeLeafTextCssObject, sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { isProbablyInlineHtml, sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import { normalizeHeadingLevel } from '@/lib/headingLevel';
import { finalizeLeafDeviceStyle } from '@/lib/leafStylePipeline';
import {
  mapImageObjectPositionCss,
  readImageAlignAxes,
  resolveImageShellAlignFromProps,
  splitImageNodeCss,
} from '@/lib/imageBlockAlign.js';
import HeaderBrandLogo from '@/components/runtime/HeaderBrandLogo';
import RichTextLeaf from '@/components/runtime/RichTextLeaf';
import { BUTTON_LEAF_WRAP_CLASS, liveLeafWrapStyleForButton } from '@/lib/buttonLeafWrap';
import { SectionHeadingBlock, ColumnHeadingBlock } from '@/components/runtime/ContentComposerBlocks';
import { accentLineDataAttrs } from '@/lib/stackAccentLine';
import {
  sectionHeadingFromProps,
  columnHeadingFromProps,
} from '@/lib/contentComposer';
import { normalizeInlineTextProps } from '@/lib/richTextNodeProps';
import {
  brandLogoHasRenderableUrl,
  nodeLooksLikeBrandLogo,
  normalizeBrandLogoProps,
  resolveBrandLogoActiveTone,
} from '@/lib/headerLogo';
import { rootSemanticTag } from '@/lib/rootSemanticTag';
import { segmentRootNodes } from '@/lib/liveHeaderStack';
import { liveDocRootRowSpacingVars, rowHasSpacingPadding } from '@/lib/liveDocSectionSpacing';
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
  resolveLandmarkContentMaxWidthPx,
  resolveLandmarkContentWidth,
  resolveSectionContentMaxWidthPx,
  resolveSectionContentWidth,
  rowSectionStripDataAttrs,
  sectionContentDataAttrs,
} from '@/lib/livePageCssVars';
import { withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { mergeImageFigureStyleForShadow } from '@/lib/boxShadowLayout';
import { dividerOrientationFromProps } from '@/lib/dividerDefaults';
import {
  sanitizeCompoundWidgetShellCss,
  sanitizeLiveFlowPositionCss,
  sanitizeLiveRootContentRowCss,
} from '@/lib/sanitizeLiveLayout';
import { imageFitMode, mergeImageFigureStyleForContain } from '@/lib/imageFigureStyle';
import { clampFigureStyleForViewport, clampImgStyleForViewport } from '@/lib/liveImageFluid';
import {
  applyFigureLayoutStability,
  liveImageIntrinsicAttrs,
  pickImageLoadingPolicy,
  resolveLiveImageDims,
} from '@/lib/liveImagePerf';
import {
  applyCompactHeaderDeviceStyle,
  headerBarClassesForNode,
  isHeaderActionsColumnNode,
  isHeaderActionsStackNode,
  isSiteHeaderRowForCompact,
} from '@/lib/headerCompactLayout';
import {
  hasInteractionCssVars,
  interactionPresentationClass,
  mergeBuilderInlineCss,
} from '@/lib/nodeInteractionCss.js';
import { styleWithResolvedInteractions } from '@/lib/resolveNodeAnimation.js';
import { sectionToneDataAttrForCss, liveSectionContrastPair } from '@/lib/liveSectionContrastVars.js';
import { applySectionToneToLeafCss, resolveSectionToneForNode } from '@/lib/sectionToneContext.js';
import { neutralizeLightSurfaceDeviceStyle } from '@/lib/sectionSurfaceNeutralization.js';
import { getDeviceStyle, menuCssVars, sanitizeInlineMarginCss, styleToCss } from '@/lib/styleToCss';
import { normalizeResponsiveStyle } from '@/lib/styleNormalizer';
import { DEFAULT_SITE_THEME, mergeNodeStyleWithSiteTheme, normalizeSiteTheme } from '@/lib/siteDesignTheme';
import { applyStylePresetToDeviceStyle } from '@/lib/stylePresetEngine.js';
import {
  applyTemplateSectionContrast,
  isGetInTouchSectionRow,
  sectionTemplateDataAttrsForRow,
} from '@/lib/getInTouchSection';
import { liveRenderChildKey, liveRenderRootKey } from '@/lib/liveRenderKeys';
import {
  applySectionItemsChildToDeviceStyle,
  applySectionLayoutToDeviceStyle,
  getSectionLayoutClasses,
  nodeIsSectionItemsHost,
  normalizeSectionLayout,
  sectionLayoutCssVars,
  sectionLayoutDataAttrs,
} from '@/lib/sectionLayout';
import { liveResponsiveLayoutClasses } from '@/lib/liveResponsiveClasses';

const DEFAULT_DEVICE = 'desktop';

function activeSiteTheme(options) {
  return options?.siteTheme || DEFAULT_SITE_THEME;
}

/**
 * Same style pipeline as builder canvas (normalizeResponsiveStyle → getDeviceStyle → theme merge).
 * Keeps SSR and client hydration output identical on published pages.
 */
function themedDeviceStyle(node, device, options) {
  const cache = options?._renderStyleCache;
  const cacheKey = node?.id != null ? `${node.id}:${device}` : null;
  if (cache && cacheKey && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const theme = activeSiteTheme(options);
  const rowMeta =
    node?.nodeType === 'row' && node.props?.meta && typeof node.props.meta === 'object' ? node.props.meta : null;
  const normalizedJson = normalizeResponsiveStyle(node.style_json || {}, {
    nodeType: node.nodeType,
    siteTheme: theme,
    rowMeta,
  });
  const raw = getDeviceStyle(normalizedJson, device);
  const withPreset = applyStylePresetToDeviceStyle({
    node,
    device,
    localDeviceStyle: raw,
    stylePresets: options?.stylePresets,
  });
  const surfaceReady = neutralizeLightSurfaceDeviceStyle(
    withPreset,
    theme,
    options?.themeTokens,
    node
  );
  const merged = withResolvedLayoutGap(
    mergeNodeStyleWithSiteTheme(surfaceReady, theme, node.nodeType, { treeNode: node }),
    theme
  );
  if (cache && cacheKey) cache.set(cacheKey, merged);
  return merged;
}

function resolveDevice(options) {
  const d = options?.device;
  if (d === 'tablet' || d === 'mobile' || d === 'desktop') return d;
  return DEFAULT_DEVICE;
}

/** Builder canvas: selection + parity with NodeRenderer class names. */
function builderHitAttrs(node, options) {
  if (!options?.builderDataAttr || node?.id == null) return {};
  return { 'data-bld-node': String(node.id) };
}

/** Parity with builder leaf shells (see `.bld-canvas__page .bld-block` min-width / box sizing). */
const LIVE_LEAF_WRAP_STYLE = { minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' };

function liveLeafWrapStyleForProps(props) {
  if (normalizeInlineTextProps(props || {}).marquee.enabled) {
    return {
      ...LIVE_LEAF_WRAP_STYLE,
      display: 'block',
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
    };
  }
  return LIVE_LEAF_WRAP_STYLE;
}

function containerClassName(nodeType) {
  if (nodeType === 'row') return 'live-node bld-row';
  if (nodeType === 'column') return 'live-node bld-column';
  if (nodeType === 'stack') return 'live-node bld-stack';
  return 'live-node';
}

function leafClassName(extra = '', options) {
  const ix = options?._ixClass ? ` ${options._ixClass}` : '';
  const base = `live-node bld-block${extra ? ` ${extra}` : ''}${ix}`.trim();
  return options?.builderDataAttr ? base : extra ? `live-node ${extra}${ix}`.trim() : `live-node${ix}`.trim();
}

/** Builder canvas and published/draft live both need ix class when interactions are configured. */
function shouldAttachLeafClass(options) {
  return Boolean(options?.builderDataAttr || options?._ixClass);
}

function leafClassForNode(extra = '', options) {
  return shouldAttachLeafClass(options) ? leafClassName(extra, options) : undefined;
}

function leafClassForButton(options, btnClass) {
  if (!shouldAttachLeafClass(options)) return btnClass;
  return `${leafClassName('', options)} ${btnClass}`.trim();
}

function wrapButtonForFlexTrack(key, btnEl, css, hit, extraAttrs = {}) {
  return (
    <div
      key={key}
      className={BUTTON_LEAF_WRAP_CLASS}
      style={liveLeafWrapStyleForButton(css)}
      {...extraAttrs}
      {...hit}
    >
      {btnEl}
    </div>
  );
}

function buttonIconGlyph(name) {
  const n = typeof name === 'string' ? name.trim().toLowerCase() : '';
  if (!n) return '';
  const map = {
    'arrow-down': '↓',
    'arrow-up': '↑',
    'arrow-left': '←',
    'arrow-right': '→',
    down: '↓',
    up: '↑',
    left: '←',
    right: '→',
    check: '✓',
    plus: '+',
    minus: '−',
    close: '×',
    x: '×',
    mail: '✉',
    phone: '☎',
    star: '★',
    search: '⌕',
  };
  return map[n] || (n.length <= 2 ? n : '');
}

function resolveCarouselVariantKey(node) {
  if (typeof node?.props?.variant === 'string' && node.props.variant.trim()) {
    return node.props.variant.trim().toLowerCase();
  }
  if (typeof node?.props?.settings?.variant === 'string' && node.props.settings.variant.trim()) {
    return node.props.settings.variant.trim().toLowerCase();
  }
  return 'hero';
}

/** Split-hero layout props must reach Carousel (not only generic carousel fields). */
function splitHeroCarouselLayoutProps(node, variantKey) {
  if (String(variantKey || '').toLowerCase() !== 'splithero') return {};
  const p = node?.props && typeof node.props === 'object' ? node.props : {};
  return {
    splitHeroVisualWidthPct: p.splitHeroVisualWidthPct,
    splitHeroVisualFrame: p.splitHeroVisualFrame,
    splitHeroVisualShadow: p.splitHeroVisualShadow,
    splitHeroVisualBorder: p.splitHeroVisualBorder,
    splitHeroVisualBgColor: p.splitHeroVisualBgColor,
    splitHeroVisualBorderColor: p.splitHeroVisualBorderColor,
    splitHeroVisualMinHeightPx: p.splitHeroVisualMinHeightPx,
    splitHeroVisualOffsetXPx: p.splitHeroVisualOffsetXPx,
    splitHeroVisualOffsetYPx: p.splitHeroVisualOffsetYPx,
    splitHeroNavOffsetXPx: p.splitHeroNavOffsetXPx,
    splitHeroNavOffsetYPx: p.splitHeroNavOffsetYPx,
    splitHeroImageMaxHeightPx: p.splitHeroImageMaxHeightPx,
    splitHeroImageScalePct: p.splitHeroImageScalePct,
    splitHeroCopyTypo: p.splitHeroCopyTypo,
    splitHeroSectionMinHeightPx: p.splitHeroSectionMinHeightPx,
    splitHeroSectionMaxHeightPx: p.splitHeroSectionMaxHeightPx,
    sectionHeightPx: p.sectionHeightPx,
  };
}

/** Strip inline background on ticker/logo carousels so live CSS surfaces (builder mirror already uses visible overflow). */
function sanitizeCarouselLiveCss(css, variantKey) {
  if (!css || typeof css !== 'object') return css;
  const v = String(variantKey || '').toLowerCase();
  if (v !== 'ticker' && v !== 'marquee' && v !== 'logo') return css;
  const next = { ...css };
  delete next.background;
  delete next.backgroundColor;
  delete next.backgroundImage;
  delete next.backgroundSize;
  delete next.backgroundPosition;
  delete next.backgroundRepeat;
  return next;
}

function renderButtonContent(node) {
  const text = node.props?.text || 'Button';
  const iconName = node.props?.icon;
  const icon = buttonIconGlyph(iconName);
  if (!icon) return text;
  const pos = node.props?.iconPosition === 'before' ? 'before' : 'after';
  const spacing = Math.max(0, Number(node.props?.iconSpacing ?? 10) || 0);
  const iconEl = (
    <span className="bld-btn__icon" aria-hidden="true" style={{ marginRight: pos === 'before' ? spacing : 0, marginLeft: pos === 'after' ? spacing : 0 }}>
      {icon}
    </span>
  );
  return pos === 'before' ? (
    <>
      {iconEl}
      <span>{text}</span>
    </>
  ) : (
    <>
      <span>{text}</span>
      {iconEl}
    </>
  );
}

/**
 * Single node → React (same pipeline for public site, draft preview, and builder mirror).
 * Text/heading use a `.live-leaf-wrap` shell (inline shrink box) so flex layout matches the builder canvas.
 * @param {object} options
 * @param {'desktop'|'tablet'|'mobile'} [options.device='desktop'] — responsive style_json layer
 * @param {boolean} [options.builderDataAttr] — set `data-bld-node` + bld-* classes for builder selection
 */
export function renderNode(node, key, options = {}) {
  const { rootRowTag, currentPath, projectPages } = options;
  const device = resolveDevice(options);
  const siteHeaderRow = isSiteHeaderRowForCompact(node);
  const childInsideSiteHeaderRow = Boolean(options.insideSiteHeaderRow) || siteHeaderRow;
  const rowMetaPeek =
    node?.nodeType === 'row' && node.props?.meta && typeof node.props.meta === 'object' ? node.props.meta : {};
  const siteFooterRow =
    node?.nodeType === 'row' &&
    (rowMetaPeek.isFooter === true || String(rowMetaPeek.role || '').toLowerCase() === 'footer');
  const childInsideSiteFooterRow = Boolean(options.insideSiteFooterRow) || siteFooterRow;
  if (!node?.nodeType) return null;
  const deviceStyleThemed = themedDeviceStyle(node, device, options);
  let mergedBase = mergeDeviceStyleWithTypeDefaults(node.nodeType, deviceStyleThemed, { treeNode: node });
  mergedBase = applyCompactHeaderDeviceStyle(node, device, mergedBase, options.insideSiteHeaderRow);
  mergedBase = styleWithResolvedInteractions(mergedBase, options?.animationPresets) || mergedBase;
  options._ixClass = interactionPresentationClass(mergedBase, options?.animationPresets);
  const nodeMeta = node.props?.meta && typeof node.props.meta === 'object' ? node.props.meta : {};
  const rowMetaEarly = node.nodeType === 'row' ? nodeMeta : {};
  const sectionTemplateIdForLayout =
    (node.nodeType === 'row' && rowMetaEarly.sectionTemplate && String(rowMetaEarly.sectionTemplate)) ||
    options.sectionTemplateId ||
    '';
  const isSectionItemsHostNode = node.nodeType === 'stack' && nodeIsSectionItemsHost(node);
  const layoutConfigSource =
    isSectionItemsHostNode
      ? options.sectionLayout
      : node.nodeType === 'row' && rowMetaEarly.sectionTemplate
        ? rowMetaEarly.sectionLayout
        : options.sectionLayout;
  const activeSectionLayout =
    layoutConfigSource != null || sectionTemplateIdForLayout
      ? normalizeSectionLayout(layoutConfigSource, sectionTemplateIdForLayout)
      : null;
  const shouldApplySectionLayout =
    activeSectionLayout &&
    (isSectionItemsHostNode || (node.nodeType === 'row' && nodeMeta.sectionColumnLayout));
  if (shouldApplySectionLayout) {
    mergedBase = applySectionLayoutToDeviceStyle(mergedBase, activeSectionLayout, device);
  }
  if (options.insideSectionItemsHost && options.sectionLayout && node.nodeType === 'stack') {
    const parentLayout = normalizeSectionLayout(
      options.sectionLayout,
      options.sectionTemplateId || ''
    );
    mergedBase = applySectionItemsChildToDeviceStyle(mergedBase, parentLayout, device);
  }
  if (device === 'desktop' && childInsideSiteHeaderRow) {
    if (isHeaderActionsStackNode(node) || isHeaderActionsColumnNode(node)) {
      const layout = { ...(mergedBase.layout || {}) };
      if (layout.display === 'none' || layout.visibility === 'hidden') {
        const { display: _d, visibility: _v, ...rest } = layout;
        mergedBase = { ...mergedBase, layout: { ...rest, display: 'flex' } };
      }
    }
  }
  const siteThemeActive = activeSiteTheme(options);
  const darkContentMode = isSiteContentDarkMode(siteThemeActive, options?.themeTokens);
  const isTextLeaf =
    node.nodeType === 'heading' ||
    node.nodeType === 'text' ||
    node.nodeType === 'paragraph' ||
    node.nodeType === 'rich_text';
  let leafSectionTone = null;
  if (isTextLeaf) {
    const toneFromTree =
      Array.isArray(options.builderTree) && options.builderTree.length && node.id != null
        ? resolveSectionToneForNode(
            options.builderTree,
            node.id,
            device,
            siteThemeActive,
            options.themeTokens
          )
        : null;
    leafSectionTone =
      toneFromTree === 'dark' || options.sectionTone === 'dark'
        ? 'dark'
        : toneFromTree === 'light'
          ? 'light'
          : options.sectionTone === 'light' || options.sectionTone === 'dark'
            ? options.sectionTone
            : null;
  }
  const cssRaw = styleToCss(finalizeLeafDeviceStyle(node, device, mergedBase), siteThemeActive, {
    nodeType: node.nodeType,
    animationPresets: options?.animationPresets,
    darkContentMode,
    sectionTone: leafSectionTone,
  });
  const rowMeta = node.nodeType === 'row' ? node.props?.meta || {} : {};
  const isFooterRow =
    node.nodeType === 'row' && (rowMeta.isFooter || rowMeta.role === 'footer' || rootRowTag === 'footer');
  const isHeaderRow =
    node.nodeType === 'row' && (rowMeta.isHeader || rowMeta.role === 'header' || rootRowTag === 'header');
  const isRootContentRow =
    options.isLiveDocRootRow &&
    node.nodeType === 'row' &&
    !isHeaderRow &&
    !isFooterRow &&
    (rootRowTag === 'section' || rootRowTag === 'main');
  // Free-move can persist absolute positioning on rows; never allow on live landmarks / content sections.
  let css =
    isFooterRow || isHeaderRow
      ? {
          ...cssRaw,
          position: 'static',
          top: undefined,
          right: undefined,
          bottom: undefined,
          left: undefined,
          zIndex: undefined,
        }
      : isRootContentRow
        ? sanitizeLiveRootContentRowCss(cssRaw)
        : cssRaw;
  if (!options.builderDataAttr) {
    css = sanitizeLiveFlowPositionCss(css);
  }
  const boxShadow = mergedBase?.effects?.boxShadow;
  if (boxShadow && css) {
    css = mergeImageFigureStyleForShadow(css, boxShadow);
  }
  if (options.builderInlineCss && typeof options.builderInlineCss === 'object') {
    css = mergeBuilderInlineCss(css, options.builderInlineCss);
    if (hasInteractionCssVars(options.builderInlineCss) && !String(options._ixClass || '').includes('live-node--ix')) {
      options._ixClass = [options._ixClass, 'live-node--ix'].filter(Boolean).join(' ');
    }
  }
  if (node.nodeType === 'row' && (isHeaderRow || childInsideSiteHeaderRow)) {
    css = sanitizeHeaderRowCss(css, isHeaderRow ? rowMeta : {});
  }
  if (isTextLeaf) {
    css = neutralizeLeafTextCssObject(css, {
      darkContentMode,
      sectionTone: leafSectionTone,
    });
    css = applySectionToneToLeafCss(css, leafSectionTone, {
      nodeType: node.nodeType,
      darkContentMode,
    });
  }
  const leafSectionToneAttrs =
    leafSectionTone === 'light' || leafSectionTone === 'dark'
      ? {
          'data-section-tone': leafSectionTone,
          ...(leafSectionTone === 'dark' ? { 'data-dark-surface': 'true' } : {}),
        }
      : {};
  const rootSpacingVars =
    options.isLiveDocRootRow && node.nodeType === 'row' ? liveDocRootRowSpacingVars(rowMeta) : null;
  const cssWithRootSpacing =
    rootSpacingVars && Object.keys(rootSpacingVars).length ? { ...(css || {}), ...rootSpacingVars } : css;
  const landmarkContentMode =
    options.isLiveDocRootRow && (isHeaderRow || isFooterRow)
      ? resolveLandmarkContentWidth(rowMeta, { isHeaderRow, isFooterRow })
      : '';
  const cssWithLandmarkContent =
    landmarkContentMode === 'boxed'
      ? {
          ...(cssWithRootSpacing || {}),
          '--live-header-content-max-width': `${resolveLandmarkContentMaxWidthPx(rowMeta, cssRaw?.maxWidth)}px`,
        }
      : cssWithRootSpacing;
  const liveRootGapAfterAttrs =
    options.isLiveDocRootRow &&
    node.nodeType === 'row' &&
    rootSpacingVars &&
    Object.prototype.hasOwnProperty.call(rootSpacingVars, '--live-row-gap-after')
      ? { 'data-live-root-gap-after': 'true' }
      : {};
  const liveRootGapBeforeAttrs =
    options.isLiveDocRootRow &&
    node.nodeType === 'row' &&
    rootSpacingVars &&
    Object.prototype.hasOwnProperty.call(rootSpacingVars, '--live-row-gap-before')
      ? { 'data-live-root-gap-before': 'true' }
      : {};
  const sectionWidthCtx = {
    isLiveDocRootRow: Boolean(options.isLiveDocRootRow),
    isHeaderRow,
    isFooterRow,
    isRootContentRow,
  };
  const stripAttrs =
    node.nodeType === 'row' ? rowSectionStripDataAttrs(Boolean(options.isLiveDocRootRow), rowMeta, sectionWidthCtx) : {};
  const landmarkContentAttrs =
    node.nodeType === 'row' ? landmarkContentDataAttrs(rowMeta, sectionWidthCtx) : {};
  const sectionContentAttrs =
    node.nodeType === 'row' ? sectionContentDataAttrs(rowMeta, sectionWidthCtx) : {};
  const sectionContentMode =
    node.nodeType === 'row' ? resolveSectionContentWidth(rowMeta, sectionWidthCtx) : '';
  let cssWithSectionContent =
    sectionContentMode === 'boxed'
      ? {
          ...(cssWithLandmarkContent || {}),
          '--live-section-content-max-width': `${resolveSectionContentMaxWidthPx(rowMeta, cssRaw?.maxWidth)}px`,
        }
      : cssWithLandmarkContent;
  const rowSectionTemplate =
    node.nodeType === 'row' ? String(rowMeta.sectionTemplate || '').trim() : '';
  if (rowSectionTemplate === 'splitHeroCarousel' && sectionContentMode === 'boxed') {
    const heroContentMax = resolveSectionContentMaxWidthPx(
      { ...rowMeta, sectionContentMaxWidthPx: undefined, containerWidthPx: undefined },
      undefined
    );
    cssWithSectionContent = {
      ...(cssWithSectionContent || {}),
      '--live-section-content-max-width': `${heroContentMax}px`,
      maxWidth: 'none',
      width: '100%',
    };
  }
  const templateContrast = applyTemplateSectionContrast(node, cssWithSectionContent, {
    sectionTemplateId: options.sectionTemplateId,
    rowChildColumnIndex: options.rowChildColumnIndex,
    tree: options.builderTree,
    device,
    siteTheme: siteThemeActive,
  });
  cssWithSectionContent = templateContrast.css;
  const children = Array.isArray(node.children) ? node.children : [];
  const hit = builderHitAttrs(node, options);

  if (node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack') {
    const useSemantic =
      node.nodeType === 'row' &&
      typeof rootRowTag === 'string' &&
      rootRowTag !== '' &&
      rootRowTag !== 'div';
    const Container = useSemantic ? rootRowTag : 'div';
    const headerBehavior = node.nodeType === 'row' ? resolveHeaderBehaviorFromMeta(rowMeta) : null;
    const headerRevealExtras = headerBehavior ? headerBehaviorRenderExtras(headerBehavior) : { style: {}, attrs: {} };
    if (node.nodeType === 'row' && headerRevealExtras.style && Object.keys(headerRevealExtras.style).length) {
      cssWithSectionContent = { ...(cssWithSectionContent || {}), ...headerRevealExtras.style };
    }
    const headerAttrs =
      node.nodeType === 'row' && (rowMeta.isHeader || rowMeta.role === 'header' || isSiteHeaderRowForCompact(node))
        ? {
            'data-site-header': 'true',
            ...(rowMeta.headerAlign ? { 'data-header-align': String(rowMeta.headerAlign) } : {}),
            'data-header-layout': String(rowMeta.headerLayout || resolveHeaderLayoutMode(rowMeta)),
            ...(headerBehavior ? headerBehaviorDataAttrs(headerBehavior) : {}),
            ...headerRevealExtras.attrs,
          }
        : {};
    const footerAttrs =
      node.nodeType === 'row' && (rowMeta.isFooter || rowMeta.role === 'footer' || rootRowTag === 'footer')
        ? { 'data-site-footer': 'true' }
        : {};
    const rowPaddingDefinedAttrs =
      options.isLiveDocRootRow &&
      node.nodeType === 'row' &&
      (rootRowTag === 'section' || rootRowTag === 'main') &&
      rowHasSpacingPadding(mergedBase)
        ? { 'data-live-row-padding-defined': 'true' }
        : {};
    const sectionTemplateAttrs =
      node.nodeType === 'row' && node.props?.meta?.sectionTemplate
        ? {
            'data-section-template': String(node.props.meta.sectionTemplate),
            ...(node.props.meta.tplPolish ? { 'data-tpl-polish': 'true' } : {}),
          }
        : sectionTemplateDataAttrsForRow(node);
    const tplRoleAttrs = nodeMeta.tplRole ? { 'data-tpl-role': String(nodeMeta.tplRole) } : {};
    const liveBlogCardsAttrs = nodeMeta.liveBlogCardsGrid ? { 'data-live-blog-cards-grid': 'true' } : {};
    const sectionToneAttrs = {
      ...sectionToneDataAttrForCss(cssWithSectionContent),
      ...templateContrast.toneAttrs,
    };
    const sectionTone =
      sectionToneAttrs['data-section-tone'] || options.sectionTone || null;

    const isSectionItemsHost = node.nodeType === 'stack' && nodeIsSectionItemsHost(node);
    const isSectionColumnRow = node.nodeType === 'row' && Boolean(nodeMeta.sectionColumnLayout);
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
    const accentAttrs = accentLineDataAttrs(node);

    const headerBarClasses = headerBarClassesForNode(node, {
      device,
      insideSiteHeaderRow: childInsideSiteHeaderRow,
      headerLayout: rowMeta.headerLayout || resolveHeaderLayoutMode(rowMeta),
    });
    const responsiveLayoutClass = liveResponsiveLayoutClasses(node.style_json);
    const headerBehaviorClass =
      node.nodeType === 'row' && headerBehavior ? headerBehaviorCssClasses(headerBehavior) : '';
    const containerClass = [
      containerClassName(node.nodeType),
      options._ixClass,
      headerBarClasses,
      headerBehaviorClass,
      sectionLayoutClass,
      responsiveLayoutClass,
    ]
      .filter(Boolean)
      .join(' ');
    const parentFlexRaw = String(mergedBase.layout?.flexDirection || 'column').toLowerCase();
    const parentFlexDirection =
      parentFlexRaw === 'row' || parentFlexRaw === 'row-reverse' ? 'row' : 'column';
    const childSectionLayout =
      node.nodeType === 'row' && rowMeta.sectionTemplate
        ? normalizeSectionLayout(rowMeta.sectionLayout, rowMeta.sectionTemplate)
        : options.sectionLayout;
    const childSectionTemplateId =
      node.nodeType === 'row' && rowMeta.sectionTemplate
        ? String(rowMeta.sectionTemplate)
        : options.sectionTemplateId;
    if (isSectionItemsHost && activeSectionLayout) {
      cssWithSectionContent = {
        ...(cssWithSectionContent || {}),
        ...sectionLayoutCssVars(activeSectionLayout),
      };
    }

    const childOptions = {
      ...options,
      device,
      isLiveDocRootRow: false,
      insideSiteHeaderRow: childInsideSiteHeaderRow,
      insideSiteFooterRow: childInsideSiteFooterRow,
      insideSectionItemsHost: isSectionItemsHost,
      parentFlexDirection,
      sectionLayout: childSectionLayout,
      sectionTemplateId: childSectionTemplateId,
      sectionTone,
    };

    return (
      <Container
        key={key}
        style={cssWithSectionContent}
        className={containerClass}
        {...liveRootGapAfterAttrs}
        {...liveRootGapBeforeAttrs}
        {...stripAttrs}
        {...landmarkContentAttrs}
        {...sectionContentAttrs}
        {...headerAttrs}
        {...footerAttrs}
        {...rowPaddingDefinedAttrs}
        {...sectionTemplateAttrs}
        {...tplRoleAttrs}
        {...liveBlogCardsAttrs}
        {...sectionLayoutAttr}
        {...sectionColumnAttrs}
        {...sectionToneAttrs}
        {...accentAttrs}
        {...hit}
      >
        {node.nodeType === 'row' ? (
          <SectionHeadingBlock sectionHeading={sectionHeadingFromProps(node.props)} />
        ) : null}
        {node.nodeType === 'column' || node.nodeType === 'stack' ? (
          <ColumnHeadingBlock columnHeading={columnHeadingFromProps(node.props)} />
        ) : null}
        {children.map((child, index) =>
          renderNode(child, liveRenderChildKey(key, child, index), {
            ...childOptions,
            ...(node.nodeType === 'row' ? { rowChildColumnIndex: index } : {}),
          })
        )}
      </Container>
    );
  }

  const leafNeutralizeBodyText = shouldNeutralizeHardcodedBodyTextColors({
    darkContentMode,
    sectionTone: leafSectionTone,
  });

  if (node.nodeType === 'heading') {
    const leafClass = leafClassForNode('', options);
    const sanitizeOptions = {
      neutralizeHardcodedBodyTextColors: leafNeutralizeBodyText,
      remapLightNeutralTextColors: leafSectionTone !== 'dark',
    };
    return (
      <div
        key={key}
        className="live-leaf-wrap"
        style={liveLeafWrapStyleForProps(node.props)}
        {...leafSectionToneAttrs}
        {...hit}
      >
        <RichTextLeaf
          nodeType="heading"
          props={node.props}
          style={css}
          className={leafClass}
          sanitizeOptions={sanitizeOptions}
        />
      </div>
    );
  }

  if (node.nodeType === 'text' || node.nodeType === 'paragraph') {
    const leafClass = leafClassForNode(
      node.nodeType === 'paragraph' ? 'bld-paragraph' : '',
      options
    );
    const sanitizeOptions = {
      neutralizeHardcodedBodyTextColors: leafNeutralizeBodyText,
      remapLightNeutralTextColors: leafSectionTone !== 'dark',
    };
    return (
      <div
        key={key}
        className="live-leaf-wrap"
        style={liveLeafWrapStyleForProps(node.props)}
        {...leafSectionToneAttrs}
        {...hit}
      >
        <RichTextLeaf
          nodeType="text"
          props={node.props}
          style={css}
          className={leafClass}
          tag={node.nodeType === 'paragraph' ? 'p' : undefined}
          sanitizeOptions={sanitizeOptions}
        />
      </div>
    );
  }

  if (node.nodeType === 'rich_text') {
    const anim = getRichTextAnimationStyle(node.props?.animation || {});
    const merged = {
      ...(css || {}),
      ...(anim.style || {}),
    };
    const blockHtml = sanitizeRichHtml(node.props?.content || '<p></p>', {
      neutralizeHardcodedBodyTextColors: leafNeutralizeBodyText,
      remapLightNeutralTextColors: leafSectionTone !== 'dark',
    });
    return (
      <div
        key={key}
        className="live-leaf-wrap"
        style={liveLeafWrapStyleForProps(node.props)}
        {...leafSectionToneAttrs}
        {...hit}
      >
        <TextEffectsWrap props={node.props} style={merged}>
          <div
            className={leafClassName(`live-rich-text bld-rich-content ${anim.className || ''}`.trim(), options)}
            style={merged}
            dangerouslySetInnerHTML={{ __html: blockHtml }}
          />
        </TextEffectsWrap>
      </div>
    );
  }

  if (node.nodeType === 'divider') {
    const orientation = dividerOrientationFromProps(node.props);
    return (
      <div
        key={key}
        role="separator"
        aria-orientation={orientation}
        className={leafClassName('live-divider', options)}
        style={css}
        {...hit}
      />
    );
  }

  if (node.nodeType === 'image') {
    const isBrandLogo = nodeLooksLikeBrandLogo(node);
    const brandNormalized = isBrandLogo ? normalizeBrandLogoProps(node.props || {}) : null;
    if (isBrandLogo && !brandLogoHasRenderableUrl(brandNormalized)) return null;

    const src = node.props?.src || '';
    if (!isBrandLogo && !src) return null;

    const hrefRaw = node.props?.href;
    const href =
      hrefRaw && typeof hrefRaw === 'string'
        ? prefixRelativeAppPath(hrefRaw, options.projectSlug)
        : hrefRaw;
    const caption = node.props?.caption;
    const imageDims = resolveLiveImageDims(node, mergedBase);
    const imageHeightPx = imageDims.imageHeightPx;
    const objectPosition = mapImageObjectPositionCss(node.props?.imageObjectPosition);
    const isNarrowViewport = device === 'mobile' || device === 'tablet';
    const imgStyleBase = {
      objectFit: node.props?.imageFit || 'cover',
      ...(objectPosition ? { objectPosition } : {}),
    };
    const alignLive = resolveImageShellAlignFromProps(node.props || {}, options.parentFlexDirection || 'column');
    const imageCssSplit = splitImageNodeCss(css);
    let shellStyle = sanitizeInlineMarginCss({
      ...(imageCssSplit.shell || {}),
      ...(alignLive && Object.keys(alignLive).length ? alignLive : {}),
    });
    let figureStyle = { ...(imageCssSplit.figure || {}) };
    if (imageFitMode(node.props?.imageFit) === 'contain' || isNarrowViewport) {
      figureStyle = mergeImageFigureStyleForContain(figureStyle);
    }
    figureStyle = applyFigureLayoutStability(figureStyle, imageDims);
    if (isNarrowViewport && imageHeightPx > 0) {
      const { minHeight, aspectRatio, ...rest } = figureStyle;
      figureStyle = rest;
    }
    const { style: clampedFigure, fluid: fluidImage } = clampFigureStyleForViewport(figureStyle);
    figureStyle = clampedFigure;
    const imgStyle = clampImgStyleForViewport(imgStyleBase, { imageHeightPx, device, fluid: fluidImage });
    const { horizontal: imageAlignH, vertical: imageAlignV } = readImageAlignAxes(node.props || {});
    const imgOrdinal = options._liveImageCounter?.n ?? 0;
    if (options._liveImageCounter) options._liveImageCounter.n += 1;
    const loadPolicy = pickImageLoadingPolicy(imgOrdinal);
    const intrinsic = liveImageIntrinsicAttrs(imageDims);
    const figureClass = [
      options.builderDataAttr ? leafClassName('', options) : '',
      fluidImage ? 'live-fluid-image' : '',
      'live-image-stable',
    ]
      .filter(Boolean)
      .join(' ');
    const brandLogoInner = isBrandLogo ? (
      <HeaderBrandLogo
        props={node.props}
        href={href && typeof href === 'string' ? href : undefined}
        imgStyle={imgStyle}
        linkStyle={{ display: 'block' }}
        siteTheme={siteThemeActive}
        themeTokens={options.themeTokens}
        sectionTone={options.sectionTone}
        builderTree={options.builderTree}
        nodeId={node.id}
        device={device}
        inSiteHeader={Boolean(options.insideSiteHeaderRow)}
      />
    ) : null;

    const figureEl = (
      <figure
        style={figureStyle}
        className={[figureClass, isBrandLogo ? 'live-brand-logo' : ''].filter(Boolean).join(' ') || undefined}
        data-has-fixed-height={imageHeightPx > 0 ? 'true' : undefined}
      >
        {isBrandLogo ? (
          brandLogoInner
        ) : href && typeof href === 'string' ? (
          <a
            href={href}
            target={node.props?.openInNewTab ? '_blank' : undefined}
            rel={node.props?.openInNewTab ? 'noreferrer noopener' : undefined}
            style={{ display: 'block' }}
          >
            <img
              src={src}
              alt={node.props?.alt || ''}
              style={imgStyle}
              loading={loadPolicy.loading}
              fetchPriority={loadPolicy.fetchPriority}
              decoding={loadPolicy.decoding}
              {...intrinsic}
            />
          </a>
        ) : (
          <img
            src={src}
            alt={node.props?.alt || ''}
            style={imgStyle}
            loading={loadPolicy.loading}
            fetchPriority={loadPolicy.fetchPriority}
            decoding={loadPolicy.decoding}
            {...intrinsic}
          />
        )}
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
    return (
      <div
        key={key}
        className="live-leaf-wrap live-image-leaf-wrap"
        style={shellStyle && Object.keys(shellStyle).length ? shellStyle : LIVE_LEAF_WRAP_STYLE}
        {...(imageAlignH ? { 'data-image-align-h': imageAlignH } : {})}
        {...(imageAlignV ? { 'data-image-align-v': imageAlignV } : {})}
        {...hit}
      >
        {figureEl}
      </div>
    );
  }

  if (node.nodeType === 'button') {
    let hrefRaw = node.props?.href;
    if (isPlaceholderNavHref(hrefRaw)) {
      const knownSlugs = (Array.isArray(options.projectPages) ? options.projectPages : [])
        .map((p) => p.slug || (typeof p.href === 'string' ? p.href.split('/').filter(Boolean).pop() : ''))
        .filter(Boolean);
      const resolved = resolvePlaceholderNavHref(
        node.props?.text || node.displayName,
        options.projectSlug,
        knownSlugs
      );
      if (resolved) hrefRaw = resolved;
    }
    const href =
      hrefRaw && typeof hrefRaw === 'string'
        ? prefixRelativeAppPath(hrefRaw, options.projectSlug, { currentPath: options.currentPath })
        : hrefRaw;
    const content = renderButtonContent(node);
    const btnType = typeof node.props?.type === 'string' ? node.props.type : 'default';
    const btnClass = `bld-btn bld-btn--${btnType}`.trim();
    if (href && typeof href === 'string') {
      return wrapButtonForFlexTrack(
        key,
        <a
          href={href}
          style={css}
          className={leafClassForButton(options, btnClass)}
        >
          {content}
        </a>,
        css,
        hit
      );
    }
    const onAction = node.actionsJson?.onClick;
    if (onAction) {
      const btn = (
        <ActionButton
          style={css}
          className={leafClassForButton(options, btnClass)}
          label={content}
          action={onAction}
        />
      );
      const inner = shouldAttachLeafClass(options) ? (
        <span className={leafClassName('', options)} style={{ display: 'inline-block' }}>
          {btn}
        </span>
      ) : (
        btn
      );
      return wrapButtonForFlexTrack(key, inner, css, hit);
    }
    return wrapButtonForFlexTrack(
      key,
      <button
        type="button"
        style={css}
        className={leafClassForButton(options, btnClass)}
      >
        {content}
      </button>,
      css,
      hit
    );
  }

  if (node.nodeType === 'menu') {
    const useProjectPages = Boolean(node.props?.useProjectPages);
    let items = useProjectPages
      ? (Array.isArray(projectPages) ? projectPages : []).map((page) => ({
          label: page.title,
          to: page.href,
        }))
      : Array.isArray(node.props?.items)
        ? node.props.items
        : [];
    if (!useProjectPages && options.projectSlug) {
      const knownSlugs = (Array.isArray(projectPages) ? projectPages : [])
        .map((p) => p.slug || (typeof p.href === 'string' ? p.href.split('/').filter(Boolean).pop() : ''))
        .filter(Boolean);
      items = prefixMenuItemsWithProjectSlug(items, options.projectSlug, currentPath, knownSlugs);
    }
    const orientation = node.props?.orientation === 'column' ? 'column' : 'row';
    const deviceStyle = themedDeviceStyle(node, device, options);
    const mergedForMenu = mergeDeviceStyleWithTypeDefaults(
      'menu',
      mergeMenuDeviceStyle(orientation, deviceStyle, { align: node.props?.align }, activeSiteTheme(options))
    );
    const menuCss = styleToCss(mergedForMenu, activeSiteTheme(options));
    const styleVars = menuCssVars(mergedForMenu, { darkContentMode });
    const dropdownStyle = mergedForMenu?.menu?.dropdown || null;
    const inner = (
      <Menu
        style={{
          ...menuCss,
          ...styleVars,
        }}
        items={items}
        orientation={orientation}
        variant={node.props?.variant}
        align={node.props?.align}
        ariaLabel={node.props?.ariaLabel || 'Main navigation'}
        currentPath={currentPath || ''}
        mega={node.props?.mega || {}}
        dropdownStyle={dropdownStyle}
        mobile={
          options.insideSiteFooterRow
            ? { ...(node.props?.mobile || {}), enabled: false }
            : node.props?.mobile || {}
        }
        sticky={node.props?.sticky || {}}
        className={options.builderDataAttr ? 'live-node bld-block' : 'live-node'}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <div key={key} style={{ width: '100%', minWidth: 0 }}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'table') {
    const inner = (
      <DynamicTable
        style={css}
        columns={Array.isArray(node.props?.columns) ? node.props.columns : []}
        rows={Array.isArray(node.props?.rows) ? node.props.rows : []}
        dataSource={node.dataJson?.source}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <DynamicTable
        key={key}
        style={css}
        columns={Array.isArray(node.props?.columns) ? node.props.columns : []}
        rows={Array.isArray(node.props?.rows) ? node.props.rows : []}
        dataSource={node.dataJson?.source}
      />
    );
  }

  if (
    node.nodeType === 'pdp_gallery' ||
    node.nodeType === 'pdp_image_zoom' ||
    node.nodeType === 'pdp_variant_selector' ||
    node.nodeType === 'pdp_price' ||
    node.nodeType === 'pdp_sale_badge' ||
    node.nodeType === 'pdp_stock' ||
    node.nodeType === 'pdp_quantity' ||
    node.nodeType === 'pdp_add_to_cart' ||
    node.nodeType === 'pdp_description' ||
    node.nodeType === 'pdp_specifications' ||
    node.nodeType === 'pdp_reviews' ||
    node.nodeType === 'pdp_related' ||
    node.nodeType === 'pdp_delivery_eta' ||
    node.nodeType === 'pdp_breadcrumbs'
  ) {
    const runtimeKey = node.props?.runtimeKey || node.props?.settings?.runtimeKey || '';
    const product = node.dataJson?.product || node.props?.product || null;
    const shared = {
      runtimeKey,
      product,
      style: css,
      className: leafClassForNode('pdp-block', options),
      ...node.props,
      ...(node.props?.settings || {}),
    };
    let inner = null;
    if (node.nodeType === 'pdp_gallery') inner = <PdpGallery {...shared} />;
    else if (node.nodeType === 'pdp_image_zoom') inner = <PdpImageZoom {...shared} />;
    else if (node.nodeType === 'pdp_variant_selector') inner = <PdpVariantSelector {...shared} />;
    else if (node.nodeType === 'pdp_price') inner = <PdpPrice {...shared} />;
    else if (node.nodeType === 'pdp_sale_badge') inner = <PdpSaleBadge {...shared} />;
    else if (node.nodeType === 'pdp_stock') inner = <PdpStock {...shared} />;
    else if (node.nodeType === 'pdp_quantity') inner = <PdpQuantity {...shared} />;
    else if (node.nodeType === 'pdp_add_to_cart') inner = <PdpAddToCart {...shared} />;
    else if (node.nodeType === 'pdp_description') inner = <PdpDescription {...shared} />;
    else if (node.nodeType === 'pdp_specifications') inner = <PdpSpecifications {...shared} />;
    else if (node.nodeType === 'pdp_reviews') inner = <PdpReviews {...shared} />;
    else if (node.nodeType === 'pdp_related') inner = <PdpRelated {...shared} />;
    else if (node.nodeType === 'pdp_delivery_eta') inner = <PdpDeliveryEta {...shared} />;
    else if (node.nodeType === 'pdp_breadcrumbs') inner = <PdpBreadcrumbs {...shared} />;

    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      inner
    );
  }

  if (node.nodeType === 'form') {
    const formProps = {
      style: css,
      className: 'live-form--bound',
      fields: Array.isArray(node.props?.fields) ? node.props.fields : [],
      steps: node.props?.steps,
      workflow: node.props?.workflow,
      states: node.props?.states,
      analytics: node.props?.analytics,
      submitLabel: node.props?.submitLabel,
      layout: node.props?.layout,
      notifications: node.props?.notifications,
      formId: String(node.id),
      pageId: options?.pageId,
      projectId: options?.projectId,
      dataSource: node.dataJson?.source,
      previewMode: options?.formPreviewMode ?? null,
      builderPreview: Boolean(options?.builderPreview ?? options?.builderDataAttr),
    };
    const inner = <DynamicForm {...formProps} />;
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <DynamicForm key={key} {...formProps} />
    );
  }

  if (node.nodeType === 'tabs') {
    const { tabs, activeTabId, imageFit, imageHeightPx, tabAlign } = resolveFeatureTabsProps(node.props);
    const bCanvas = options.builderCanvas;
    const panelMode = String(node.props?.panelMode || 'fields').trim();
    const useElementsPanel = isFeatureTabsElementPanelMode(node.props);
    let panelContent = null;
    if (useElementsPanel) {
      const renderPanel = bCanvas?.tabs?.renderPanel;
      if (typeof renderPanel === 'function') {
        panelContent = renderPanel(node, activeTabId);
      } else {
        const panelStack = findFeatureTabPanelStack(node, activeTabId);
        const panelKids = panelStack?.children || [];
        if (panelKids.length) {
          panelContent = panelKids.map((ch, i) =>
            renderNode(ch, `${String(key)}-tab-panel-${i}`, options)
          );
        }
      }
    }
    let tabsSectionTone =
      options.sectionTone === 'dark' || options.sectionTone === 'light' ? options.sectionTone : null;
    if (!tabsSectionTone && Array.isArray(options.builderTree) && node.id != null) {
      const resolved = resolveSectionToneForNode(
        options.builderTree,
        node.id,
        device,
        siteThemeActive,
        options.themeTokens
      );
      if (resolved === 'dark' || resolved === 'light') tabsSectionTone = resolved;
    }
    const tabsContrastVars =
      tabsSectionTone === 'dark'
        ? liveSectionContrastPair(false)
        : tabsSectionTone === 'light'
          ? liveSectionContrastPair(true)
          : {};
    const tabsCss = sanitizeCompoundWidgetShellCss(css);
    const tabsChromeVars = featureTabsChromeToCssVars(node.props?.chrome);
    const tabsStyle = { ...(tabsCss || {}), ...tabsContrastVars, ...tabsChromeVars };
    const tabsBuilder = Boolean(bCanvas?.tabs?.onActiveTabChange || bCanvas?.tabs?.onPatchTab);
    const inner = (
      <FeatureTabs
        key={key}
        style={tabsStyle}
        sectionTone={tabsSectionTone}
        darkContentMode={darkContentMode}
        tabs={tabs}
        activeTabId={activeTabId}
        imageFit={imageFit}
        imageHeightPx={imageHeightPx}
        tabAlign={tabAlign}
        panelMode={panelMode}
        panelContent={panelContent}
        builderMode={tabsBuilder}
        builderEditable={tabsBuilder && !bCanvas?.sectionEditLocked}
        textEditBlurCommitGuard={bCanvas?.textEditBlurCommitGuard}
        featureTabValueSyncGuard={bCanvas?.featureTabValueSyncGuard}
        onActiveTabChange={bCanvas?.tabs?.onActiveTabChange}
        onPatchTab={bCanvas?.tabs?.onPatchTab}
        onTabImageFile={bCanvas?.tabs?.onTabImageFile}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      inner
    );
  }

  if (node.nodeType === 'accordion') {
    const { items, openItemId } = resolveFaqAccordionProps(node.props);
    const faqChromeVars = faqAccordionChromeToCssVars(node.props?.chrome);
    const faqCss = { ...sanitizeCompoundWidgetShellCss(css), ...faqChromeVars };
    const bCanvas = options.builderCanvas;
    const faqBuilder = Boolean(bCanvas?.accordion?.onOpenItemChange);
    const inner = (
      <FaqAccordion
        key={key}
        style={faqCss}
        items={items}
        openItemId={openItemId}
        builderMode={faqBuilder}
        builderEditable={faqBuilder && !bCanvas?.sectionEditLocked}
        onOpenItemChange={bCanvas?.accordion?.onOpenItemChange}
        onPatchItem={bCanvas?.accordion?.onPatchItem}
        onAddItem={bCanvas?.accordion?.onAddItem}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      inner
    );
  }

  if (node.nodeType === 'stats_counter') {
    const { items, animate, gapPx } = resolveStatsCounterProps(node.props);
    const statsCss = sanitizeCompoundWidgetShellCss(css);
    const bCanvas = options.builderCanvas;
    const statsBuilder = Boolean(bCanvas?.statsCounter?.onPatchItem);
    const inner = (
      <StatsCounter
        key={key}
        style={statsCss}
        items={items}
        animate={animate}
        gapPx={gapPx}
        builderMode={statsBuilder}
        builderEditable={statsBuilder && !bCanvas?.sectionEditLocked}
        onPatchItem={bCanvas?.statsCounter?.onPatchItem}
        textEditBlurCommitGuard={bCanvas?.textEditBlurCommitGuard}
        featureTabValueSyncGuard={bCanvas?.featureTabValueSyncGuard}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      inner
    );
  }

  if (node.nodeType === 'tab_hero') {
    const { panels, activePanelId, tabAlign } = resolveTabHeroProps(node.props);
    let tabHeroSectionTone =
      options.sectionTone === 'dark' || options.sectionTone === 'light' ? options.sectionTone : null;
    if (!tabHeroSectionTone && Array.isArray(options.builderTree) && node.id != null) {
      const resolved = resolveSectionToneForNode(
        options.builderTree,
        node.id,
        device,
        siteThemeActive,
        options.themeTokens
      );
      if (resolved === 'dark' || resolved === 'light') tabHeroSectionTone = resolved;
    }
    const tabHeroCss = sanitizeCompoundWidgetShellCss(css);
    const bCanvas = options.builderCanvas;
    const tabHeroBuilder = Boolean(bCanvas?.tabHero?.onPatchPanel);
    const inner = (
      <TabHero
        key={key}
        style={tabHeroCss}
        sectionTone={tabHeroSectionTone}
        darkContentMode={darkContentMode}
        panels={panels}
        activePanelId={activePanelId}
        tabAlign={tabAlign}
        defaultTabExplicit={node.props?.defaultTabExplicit === true}
        builderMode={tabHeroBuilder}
        builderEditable={tabHeroBuilder && !bCanvas?.sectionEditLocked}
        onActivePanelChange={bCanvas?.tabHero?.onActivePanelChange}
        onPatchPanel={bCanvas?.tabHero?.onPatchPanel}
        onPanelImageFile={bCanvas?.tabHero?.onPanelImageFile}
        textEditBlurCommitGuard={bCanvas?.textEditBlurCommitGuard}
        featureTabValueSyncGuard={bCanvas?.featureTabValueSyncGuard}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      inner
    );
  }

  if (node.nodeType === 'carousel') {
    const carouselVariantKey = resolveCarouselVariantKey(node);
    const carouselVariant = carouselVariantKey !== 'hero' ? carouselVariantKey : undefined;
    const carouselChromeVars = carouselChromeToCssVars(node.props?.chrome);
    const carouselCss = { ...sanitizeCarouselLiveCss(css, carouselVariantKey), ...carouselChromeVars };
    const carouselImageFit = node.props?.imageFit ?? node.props?.settings?.imageFit;
    const carouselShowOverlay = node.props?.showOverlay ?? node.props?.settings?.showOverlay;
    const carouselImageObjectPosition = node.props?.imageObjectPosition ?? node.props?.settings?.imageObjectPosition;
    const carouselTickerDurationSec = node.props?.tickerDurationSec ?? node.props?.settings?.tickerDurationSec;
    const carouselTransitionEasing = node.props?.transitionEasing ?? node.props?.settings?.transitionEasing;
    const carouselTransitionEffect = node.props?.transitionEffect ?? node.props?.settings?.transitionEffect;
    const carouselScrollDirection = node.props?.scrollDirection ?? node.props?.settings?.scrollDirection;
    const carouselPauseOnHover =
      node.props?.pauseOnHover ?? node.props?.settings?.pauseOnHover ?? true;
    const carouselLogoHoverZoom =
      node.props?.logoHoverZoom ?? node.props?.settings?.logoHoverZoom ?? false;
    const carouselLogoHoverZoomScale =
      node.props?.logoHoverZoomScale ?? node.props?.settings?.logoHoverZoomScale;
    const carouselAutoplay = node.props?.autoplay ?? node.props?.settings?.autoplay;
    const carouselLoop = node.props?.loop ?? node.props?.settings?.loop;
    const carouselInterval =
      node.props?.interval ?? node.props?.settings?.autoplayMs ?? node.props?.settings?.interval;
    const slideList = Array.isArray(node.props?.slides) ? node.props.slides : [];
    const { topSlides: tickerTopSlides, bottomSlides: tickerBottomSlides } = resolveDualTickerSlides(node.props);
    const bCanvas = options.builderCanvas;
    const splitHeroBuilder =
      carouselVariantKey === 'splithero' && Boolean(bCanvas?.splitHero?.onPatchSlide);
    const splitHeroLayoutProps = splitHeroCarouselLayoutProps(node, carouselVariantKey);
    const splitHeroCarouselProps = splitHeroBuilder
      ? {
          builderMode: true,
          builderEditable: !bCanvas?.sectionEditLocked,
          onPatchSlide: bCanvas.splitHero.onPatchSlide,
          onSlideImageFile: bCanvas.splitHero.onSlideImageFile,
        }
      : {};
    // Ticker/marquee: same CSS-only component in builder + preview + live (client Carousel missed dual-row slide updates).
    const useStaticTicker =
      carouselVariantKey === 'ticker' || carouselVariantKey === 'marquee';
    const inner = useStaticTicker ? (
      <CarouselTickerStatic
        style={carouselCss}
        slides={slideList}
        slidesTop={tickerTopSlides}
        slidesBottom={tickerBottomSlides}
        variant={carouselVariantKey}
        gap={node.props?.gap ?? node.props?.settings?.gapPx}
        tickerDurationSec={carouselTickerDurationSec}
        scrollDirection={carouselScrollDirection}
        pauseOnHover={carouselPauseOnHover}
        logoHoverZoom={carouselLogoHoverZoom}
        logoHoverZoomScale={carouselLogoHoverZoomScale}
      />
    ) : (
      <Carousel
        style={carouselCss}
        slides={slideList}
        tickerSlidesTop={tickerTopSlides}
        tickerSlidesBottom={tickerBottomSlides}
        settings={node.props?.settings}
        device={device}
        variant={carouselVariant}
        autoplay={carouselAutoplay}
        loop={carouselLoop}
        showArrows={node.props?.showArrows}
        showDots={node.props?.showDots}
        speed={node.props?.speed}
        interval={carouselInterval}
        slidesPerView={node.props?.slidesPerView}
        gap={node.props?.gap}
        imageFit={carouselImageFit}
        showOverlay={carouselShowOverlay}
        imageObjectPosition={carouselImageObjectPosition}
        tickerDurationSec={carouselTickerDurationSec}
        transitionEasing={carouselTransitionEasing}
        transitionEffect={carouselTransitionEffect}
        scrollDirection={carouselScrollDirection}
        pauseOnHover={carouselPauseOnHover}
        logoHoverZoom={carouselLogoHoverZoom}
        logoHoverZoomScale={carouselLogoHoverZoomScale}
        builderPreview={Boolean(options?.builderPreview ?? options?.builderDataAttr)}
        {...splitHeroLayoutProps}
        {...splitHeroCarouselProps}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : useStaticTicker ? (
      <CarouselTickerStatic
        key={key}
        style={carouselCss}
        slides={slideList}
        slidesTop={tickerTopSlides}
        slidesBottom={tickerBottomSlides}
        variant={carouselVariantKey}
        gap={node.props?.gap ?? node.props?.settings?.gapPx}
        tickerDurationSec={carouselTickerDurationSec}
        scrollDirection={carouselScrollDirection}
        pauseOnHover={carouselPauseOnHover}
        logoHoverZoom={carouselLogoHoverZoom}
        logoHoverZoomScale={carouselLogoHoverZoomScale}
      />
    ) : (
      <Carousel
        key={key}
        style={carouselCss}
        slides={slideList}
        settings={node.props?.settings}
        device={device}
        variant={carouselVariant}
        autoplay={carouselAutoplay}
        loop={carouselLoop}
        showArrows={node.props?.showArrows}
        showDots={node.props?.showDots}
        speed={node.props?.speed}
        interval={carouselInterval}
        slidesPerView={node.props?.slidesPerView}
        gap={node.props?.gap}
        imageFit={carouselImageFit}
        showOverlay={carouselShowOverlay}
        imageObjectPosition={carouselImageObjectPosition}
        tickerDurationSec={carouselTickerDurationSec}
        transitionEasing={carouselTransitionEasing}
        transitionEffect={carouselTransitionEffect}
        scrollDirection={carouselScrollDirection}
        pauseOnHover={carouselPauseOnHover}
        logoHoverZoom={carouselLogoHoverZoom}
        logoHoverZoomScale={carouselLogoHoverZoomScale}
        builderPreview={Boolean(options?.builderPreview ?? options?.builderDataAttr)}
        {...splitHeroLayoutProps}
        {...splitHeroCarouselProps}
      />
    );
  }

  if (
    node.nodeType === 'input' ||
    node.nodeType === 'textarea' ||
    node.nodeType === 'select' ||
    node.nodeType === 'checkbox' ||
    node.nodeType === 'radio' ||
    node.nodeType === 'switch' ||
    node.nodeType === 'date' ||
    node.nodeType === 'submit'
  ) {
    const label = typeof node.props?.label === 'string' ? node.props.label : '';
    const name = typeof node.props?.name === 'string' ? node.props.name : '';
    const placeholder = typeof node.props?.placeholder === 'string' ? node.props.placeholder : '';
    const required = Boolean(node.props?.required);
    const type = typeof node.props?.type === 'string' ? node.props.type : node.nodeType;
    const optionsList = Array.isArray(node.props?.options) ? node.props.options : [];
    const safeOptions = optionsList
      .filter((o) => o && (typeof o === 'string' || typeof o === 'object'))
      .slice(0, 50)
      .map((o, i) => {
        if (typeof o === 'string') return { value: o, label: o, key: `${o}-${i}` };
        const v = typeof o.value === 'string' ? o.value : '';
        const l = typeof o.label === 'string' ? o.label : v;
        return { value: v, label: l, key: `${v}-${i}` };
      })
      .filter((o) => o.value || o.label);

    const inner =
      node.nodeType === 'textarea' ? (
        <label className="live-form-field" style={css}>
          {label ? (
            <span className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </span>
          ) : null}
          <textarea
            className="live-form-field__control"
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
            rows={Number(node.props?.rows || 4)}
          />
        </label>
      ) : node.nodeType === 'select' ? (
        <label className="live-form-field" style={css}>
          {label ? (
            <span className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </span>
          ) : null}
          <select className="live-form-field__control" name={name || undefined} required={required} defaultValue="">
            {placeholder ? <option value="">{placeholder}</option> : <option value="">Select…</option>}
            {safeOptions.map((o) => (
              <option key={o.key} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : node.nodeType === 'checkbox' || node.nodeType === 'switch' ? (
        <label className="live-form-field live-form-field--toggle" style={css}>
          <input type="checkbox" name={name || undefined} required={required} />
          <span className="live-form-field__toggleLabel">
            {label || 'Checkbox'}
            {required ? <span className="live-form-field__req"> *</span> : null}
          </span>
        </label>
      ) : node.nodeType === 'radio' ? (
        <fieldset className="live-form-field live-form-field--radio" style={css}>
          {label ? (
            <legend className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </legend>
          ) : null}
          {(safeOptions.length
            ? safeOptions
            : [
                { value: 'a', label: 'Option A', key: 'a' },
                { value: 'b', label: 'Option B', key: 'b' },
              ]
          ).map((o) => (
            <label key={o.key} className="live-form-field__radioOption">
              <input type="radio" name={name || `radio-${node.id}`} value={o.value} required={required} />
              <span>{o.label}</span>
            </label>
          ))}
        </fieldset>
      ) : node.nodeType === 'submit' ? (
        <button key={key} type="submit" style={css} className={options.builderDataAttr ? leafClassName('', options) : undefined} {...hit}>
          {typeof node.props?.text === 'string' && node.props.text.trim() ? node.props.text.trim() : 'Submit'}
        </button>
      ) : (
        <label className="live-form-field" style={css}>
          {label ? (
            <span className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </span>
          ) : null}
          <input
            className="live-form-field__control"
            type={type === 'email' ? 'email' : type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
          />
        </label>
      );

    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <div key={key} style={{ width: '100%', minWidth: 0 }}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'icon') {
    const inner = (
      <LiveIcon symbol={node.props?.symbol} ariaLabel={node.props?.ariaLabel} className={leafClassName('', options)} />
    );
    return (
      <div key={key} className="live-leaf-wrap" style={LIVE_LEAF_WRAP_STYLE} {...hit}>
        <span style={css}>{inner}</span>
      </div>
    );
  }

  if (node.nodeType === 'icon_box') {
    const inner = (
      <LiveIconBox
        symbol={node.props?.symbol}
        title={node.props?.title}
        text={node.props?.text}
        align={node.props?.align}
        className={leafClassName('', options)}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        <div style={css}>{inner}</div>
      </div>
    ) : (
      <div key={key} style={css}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'content_card') {
    const cardVars = cardChromeToCssVars(node.props?.chrome);
    const cardShell = { ...sanitizeCompoundWidgetShellCss(css), ...cardVars };
    const inner = (
      <LiveContentCard
        title={node.props?.title}
        body={node.props?.body}
        imageSrc={node.props?.imageSrc}
        imageAlt={node.props?.imageAlt}
        buttonText={node.props?.buttonText}
        buttonHref={node.props?.buttonHref}
        showImage={node.props?.showImage !== false}
        showButton={node.props?.showButton !== false}
        className={leafClassName('', options)}
        style={cardVars}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        <div style={cardShell}>{inner}</div>
      </div>
    ) : (
      <div key={key} style={cardShell}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'spacer') {
    const h = Number(node.props?.heightPx) > 0 ? Number(node.props.heightPx) : 48;
    return (
      <div key={key} className={leafClassName('live-spacer-wrap', options)} style={css} {...hit}>
        <LiveSpacer heightPx={h} />
      </div>
    );
  }

  if (node.nodeType === 'modal') {
    const bCanvas = options.builderCanvas;
    const contentStack = findModalContentStack(node);
    const stackChildren = contentStack?.children || [];
    const nestedContent =
      stackChildren.length > 0
        ? stackChildren.map((child, index) =>
            renderNode(child, liveRenderChildKey(key, child, index), {
              ...options,
              builderCanvas: bCanvas,
            })
          )
        : null;
    const inner = (
      <LiveModal
        triggerLabel={node.props?.triggerLabel}
        title={node.props?.title}
        body={node.props?.body}
        previewOpen={Boolean(node.props?.previewOpen)}
        builderMode={Boolean(bCanvas)}
        showTitle={node.props?.showTitle !== false}
        showClose={node.props?.showClose !== false}
        closeOnBackdrop={node.props?.closeOnBackdrop !== false}
        dialogStyle={modalDialogStyleFromProps(node.props)}
      >
        {nestedContent}
      </LiveModal>
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        <div style={css}>{inner}</div>
      </div>
    ) : (
      <div key={key} style={css}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'video_embed') {
    const inner = (
      <LiveVideoEmbed
        embedUrl={node.props?.embedUrl}
        title={node.props?.title}
        aspectRatio={node.props?.aspectRatio}
        className={leafClassName('', options)}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        <div style={css}>{inner}</div>
      </div>
    ) : (
      <div key={key} style={css}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'map_embed') {
    const inner = (
      <LiveMapEmbed embedUrl={node.props?.embedUrl} address={node.props?.address} heightPx={node.props?.heightPx} />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        <div style={css}>{inner}</div>
      </div>
    ) : (
      <div key={key} style={css}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'social_icons') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveSocialIcons
        links={node.props?.links}
        sizePx={node.props?.sizePx}
        gapPx={node.props?.gapPx}
        variant={node.props?.variant}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'container_box') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveContainerBox
        title={node.props?.title}
        body={node.props?.body}
        align={node.props?.align}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'grid_block') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveGridBlock
        columns={node.props?.columns}
        gapPx={node.props?.gapPx}
        mobileStack={node.props?.mobileStack !== false}
        items={node.props?.items}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'alert_notice') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveAlertNotice
        variant={node.props?.variant}
        title={node.props?.title}
        message={node.props?.message}
        showClose={node.props?.showClose !== false}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'badge_label') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveBadgeLabel
        text={node.props?.text}
        variant={node.props?.variant}
        size={node.props?.size}
        href={node.props?.href}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'counter_block') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveCounterBlock
        value={node.props?.value}
        prefix={node.props?.prefix}
        suffix={node.props?.suffix}
        label={node.props?.label}
        description={node.props?.description}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'progress_bar') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveProgressBar
        label={node.props?.label}
        percentage={node.props?.percentage}
        helperText={node.props?.helperText}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'pdp_breadcrumbs') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpBreadcrumbs
        runtimeKey={options?.pdp?.runtimeKey}
        product={options?.pdp?.product}
        projectSlug={options?.pdp?.projectSlug}
        {...(node.props || {})}
        className={leafClassName('pdp-block', options)}
      />
    );
  }
  if (node.nodeType === 'pdp_gallery') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpGallery runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_image_zoom') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpImageZoom runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_variant_selector') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpVariantSelector runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_price') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpPrice runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_sale_badge') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpSaleBadge runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_stock') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpStock runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_quantity') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpQuantity runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_add_to_cart') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpAddToCart runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_description') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpDescription runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_specifications') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpSpecifications runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_reviews') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpReviews runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }
  if (node.nodeType === 'pdp_related') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpRelated
        runtimeKey={options?.pdp?.runtimeKey}
        product={options?.pdp?.product}
        projectSlug={options?.pdp?.projectSlug}
        {...(node.props || {})}
      />
    );
  }
  if (node.nodeType === 'pdp_delivery_eta') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <PdpDeliveryEta runtimeKey={options?.pdp?.runtimeKey} product={options?.pdp?.product} {...(node.props || {})} />
    );
  }

  if (node.nodeType === 'rating_stars') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveRatingStars
        rating={node.props?.rating}
        maxStars={node.props?.maxStars}
        reviewText={node.props?.reviewText}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'testimonial_card') {
    const cardVars = cardChromeToCssVars(node.props?.chrome);
    const cardShell = { ...sanitizeCompoundWidgetShellCss(css), ...cardVars };
    return renderAdvancedElementShell(
      key,
      cardShell,
      options,
      hit,
      <LiveTestimonialCard
        name={node.props?.name}
        role={node.props?.role}
        message={node.props?.message}
        avatarSrc={node.props?.avatarSrc}
        rating={node.props?.rating}
        className={leafClassName('', options)}
        style={cardVars}
      />
    );
  }

  if (node.nodeType === 'pricing_card') {
    const cardVars = cardChromeToCssVars(node.props?.chrome);
    const cardShell = { ...sanitizeCompoundWidgetShellCss(css), ...cardVars };
    return renderAdvancedElementShell(
      key,
      cardShell,
      options,
      hit,
      <LivePricingCard
        planName={node.props?.planName}
        price={node.props?.price}
        period={node.props?.period}
        description={node.props?.description}
        features={node.props?.features}
        ctaText={node.props?.ctaText}
        ctaHref={node.props?.ctaHref}
        popular={Boolean(node.props?.popular)}
        className={leafClassName('', options)}
        style={cardVars}
      />
    );
  }

  if (node.nodeType === 'newsletter_form') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveNewsletterForm
        heading={node.props?.heading}
        text={node.props?.text}
        emailPlaceholder={node.props?.emailPlaceholder}
        buttonText={node.props?.buttonText}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'whatsapp_button') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveWhatsappButton
        phone={node.props?.phone}
        message={node.props?.message}
        buttonText={node.props?.buttonText}
        floating={Boolean(node.props?.floating)}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'countdown_timer') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveCountdownTimer
        targetIso={node.props?.targetIso}
        label={node.props?.label}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'html_block') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveHtmlBlock html={node.props?.html} className={leafClassName('', options)} />
    );
  }

  if (node.nodeType === 'code_block') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveCodeBlock language={node.props?.language} code={node.props?.code} className={leafClassName('', options)} />
    );
  }

  if (node.nodeType === 'lottie_animation') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveLottieAnimation
        jsonUrl={node.props?.jsonUrl}
        widthPx={node.props?.widthPx}
        heightPx={node.props?.heightPx}
        alt={node.props?.alt}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'logo_block') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveLogoBlock
        props={node.props}
        src={node.props?.src}
        alt={node.props?.alt}
        href={node.props?.href}
        widthPx={node.props?.widthPx}
        className={leafClassName('', options)}
        siteTheme={siteThemeActive}
        themeTokens={options.themeTokens}
        sectionTone={options.sectionTone}
        builderTree={options.builderTree}
        nodeId={node.id}
        device={device}
        inSiteHeader={Boolean(options.insideSiteHeaderRow)}
      />
    );
  }

  if (node.nodeType === 'feature_list') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveFeatureList
        direction={node.props?.direction}
        items={node.props?.items}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'table_pro') {
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveTablePro
        headers={node.props?.headers}
        rows={node.props?.rows}
        highlightColumn={node.props?.highlightColumn}
        className={leafClassName('', options)}
      />
    );
  }

  return null;
}

export function renderTree(nodes = [], options = {}) {
  if (!Array.isArray(nodes)) return null;
  const treeOptions = {
    ...options,
    _renderStyleCache: options._renderStyleCache || new Map(),
    _liveImageCounter: options._liveImageCounter || { n: 0 },
  };
  const segments = segmentRootNodes(nodes);
  return segments.map((segment) => {
    if (segment.type === 'header-stack') {
      const stackChildren = segment.items.map(({ node: headerNode, index: rootIndex }) => {
        const key = liveRenderRootKey(headerNode, rootIndex);
        const semantic = rootSemanticTag(nodes, rootIndex);
        const tags = semantic ? { ...treeOptions, rootRowTag: semantic } : treeOptions;
        return renderNode(headerNode, key, { ...tags, isLiveDocRootRow: true });
      });
      const first = segment.items[0]?.node;
      return (
        <div
          key={`live-header-stack-${first?.id ?? segment.items[0]?.index ?? 0}`}
          className="live-header-stack"
          data-live-header-stack="true"
        >
          {stackChildren}
        </div>
      );
    }
    const { node, index } = segment.items[0];
    const key = liveRenderRootKey(node, index);
    const semantic = rootSemanticTag(nodes, index);
    const tags = semantic ? { ...treeOptions, rootRowTag: semantic } : treeOptions;
    return renderNode(node, key, { ...tags, isLiveDocRootRow: true });
  });
}
