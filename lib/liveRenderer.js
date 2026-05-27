import ActionButton from '@/components/runtime/ActionButton';
import { prefixMenuItemsWithProjectSlug, prefixRelativeAppPath } from '@/lib/projectPathPrefix';
import Carousel from '@/components/runtime/Carousel';
import CarouselTickerStatic from '@/components/runtime/CarouselTickerStatic';
import DynamicForm from '@/components/runtime/DynamicForm';
import DynamicTable from '@/components/runtime/DynamicTable';
import Menu from '@/components/runtime/Menu';
import FeatureTabs from '@/components/runtime/FeatureTabs';
import FaqAccordion from '@/components/runtime/FaqAccordion';
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
import { resolveFaqAccordionProps } from '@/lib/faqAccordionDefaults';
import { mergeDeviceStyleWithTypeDefaults, mergeMenuDeviceStyle } from '@/lib/nodeLayoutDefaults';
import { getRichTextAnimationStyle } from '@/lib/richTextAnimation';
import { neutralizeLeafTextCssObject, sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { isProbablyInlineHtml, sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import { normalizeHeadingLevel } from '@/lib/headingLevel';
import { finalizeLeafDeviceStyle } from '@/lib/leafStylePipeline';
import { mapImageObjectPositionCss, resolveImageShellAlignFromProps } from '@/lib/imageBlockAlign.js';
import { rootSemanticTag } from '@/lib/rootSemanticTag';
import { liveDocRootRowSpacingVars, rowHasSpacingPadding } from '@/lib/liveDocSectionSpacing';
import {
  resolveHeaderLayoutMode,
  sanitizeHeaderRowCss,
} from '@/lib/headerLayoutMode';
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
  applyCompactHeaderDeviceStyle,
  headerBarClassesForNode,
  isHeaderActionsColumnNode,
  isHeaderActionsStackNode,
  isSiteHeaderRowForCompact,
} from '@/lib/headerCompactLayout';
import { getDeviceStyle, menuCssVars, styleToCss } from '@/lib/styleToCss';
import { normalizeResponsiveStyle } from '@/lib/styleNormalizer';
import { DEFAULT_SITE_THEME, mergeNodeStyleWithSiteTheme, normalizeSiteTheme } from '@/lib/siteDesignTheme';
import { isGetInTouchSectionRow } from '@/lib/getInTouchSection';
import { liveRenderChildKey, liveRenderRootKey } from '@/lib/liveRenderKeys';
import {
  applySectionLayoutToDeviceStyle,
  getSectionLayoutClasses,
  normalizeSectionLayout,
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
  const theme = activeSiteTheme(options);
  const rowMeta =
    node?.nodeType === 'row' && node.props?.meta && typeof node.props.meta === 'object' ? node.props.meta : null;
  const normalizedJson = normalizeResponsiveStyle(node.style_json || {}, {
    nodeType: node.nodeType,
    siteTheme: theme,
    rowMeta,
  });
  const raw = getDeviceStyle(normalizedJson, device);
  const merged = mergeNodeStyleWithSiteTheme(raw, theme, node.nodeType);
  return withResolvedLayoutGap(merged, theme);
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

function containerClassName(nodeType) {
  if (nodeType === 'row') return 'live-node bld-row';
  if (nodeType === 'column') return 'live-node bld-column';
  if (nodeType === 'stack') return 'live-node bld-stack';
  return 'live-node';
}

function leafClassName(extra = '', options) {
  const base = `live-node bld-block${extra ? ` ${extra}` : ''}`.trim();
  return options?.builderDataAttr ? base : extra ? `live-node ${extra}`.trim() : 'live-node';
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
  const nodeMeta = node.props?.meta && typeof node.props.meta === 'object' ? node.props.meta : {};
  const rowMetaEarly = node.nodeType === 'row' ? nodeMeta : {};
  const sectionTemplateIdForLayout =
    (node.nodeType === 'row' && rowMetaEarly.sectionTemplate && String(rowMetaEarly.sectionTemplate)) ||
    options.sectionTemplateId ||
    '';
  const layoutConfigSource =
    node.nodeType === 'stack' && nodeMeta.sectionItemsHost
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
    ((node.nodeType === 'stack' && nodeMeta.sectionItemsHost) ||
      (node.nodeType === 'row' && nodeMeta.sectionColumnLayout));
  if (shouldApplySectionLayout) {
    mergedBase = applySectionLayoutToDeviceStyle(mergedBase, activeSectionLayout, device);
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
  const sitePresetDark = normalizeSiteTheme(activeSiteTheme(options)).presetId === 'dark';
  const cssRaw = styleToCss(finalizeLeafDeviceStyle(node, device, mergedBase), activeSiteTheme(options));
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
  if (isHeaderRow && options.isLiveDocRootRow) {
    css = sanitizeHeaderRowCss(css, rowMeta);
  }
  if (
    sitePresetDark &&
    (node.nodeType === 'heading' || node.nodeType === 'text' || node.nodeType === 'rich_text')
  ) {
    css = neutralizeLeafTextCssObject(css);
  }
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
  const cssWithSectionContent =
    sectionContentMode === 'boxed'
      ? {
          ...(cssWithLandmarkContent || {}),
          '--live-section-content-max-width': `${resolveSectionContentMaxWidthPx(rowMeta, cssRaw?.maxWidth)}px`,
        }
      : cssWithLandmarkContent;
  const children = Array.isArray(node.children) ? node.children : [];
  const hit = builderHitAttrs(node, options);

  if (node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack') {
    const useSemantic =
      node.nodeType === 'row' &&
      typeof rootRowTag === 'string' &&
      rootRowTag !== '' &&
      rootRowTag !== 'div';
    const Container = useSemantic ? rootRowTag : 'div';
    const headerAttrs =
      node.nodeType === 'row' && (rowMeta.isHeader || rowMeta.role === 'header' || isSiteHeaderRowForCompact(node))
        ? {
            'data-site-header': 'true',
            ...(rowMeta.headerAlign ? { 'data-header-align': String(rowMeta.headerAlign) } : {}),
            'data-header-layout': String(rowMeta.headerLayout || resolveHeaderLayoutMode(rowMeta)),
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
        : isGetInTouchSectionRow(node)
          ? { 'data-section-template': 'getInTouch' }
          : {};
    const tplRoleAttrs = nodeMeta.tplRole ? { 'data-tpl-role': String(nodeMeta.tplRole) } : {};
    const liveBlogCardsAttrs = nodeMeta.liveBlogCardsGrid ? { 'data-live-blog-cards-grid': 'true' } : {};

    const isSectionItemsHost = node.nodeType === 'stack' && Boolean(nodeMeta.sectionItemsHost);
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

    const headerBarClasses = headerBarClassesForNode(node, {
      device,
      insideSiteHeaderRow: childInsideSiteHeaderRow,
      headerLayout: rowMeta.headerLayout || resolveHeaderLayoutMode(rowMeta),
    });
    const responsiveLayoutClass = liveResponsiveLayoutClasses(node.style_json);
    const containerClass = [
      containerClassName(node.nodeType),
      headerBarClasses,
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
    const childOptions = {
      ...options,
      device,
      isLiveDocRootRow: false,
      insideSiteHeaderRow: childInsideSiteHeaderRow,
      insideSiteFooterRow: childInsideSiteFooterRow,
      parentFlexDirection,
      sectionLayout: childSectionLayout,
      sectionTemplateId: childSectionTemplateId,
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
        {...hit}
      >
        {children.map((child, index) =>
          renderNode(child, liveRenderChildKey(key, child, index), childOptions)
        )}
      </Container>
    );
  }

  if (node.nodeType === 'heading') {
    const leafClass = options.builderDataAttr ? leafClassName('', options) : undefined;
    const HeadingTag = normalizeHeadingLevel(node.props?.tag);
    const raw = node.props?.text || '';
    const inner =
      isProbablyInlineHtml(raw) ? (
        <HeadingTag
          style={css}
          className={leafClass}
          dangerouslySetInnerHTML={{ __html: sanitizeInlineLeafHtml(raw) || '' }}
        />
      ) : (
        <HeadingTag style={css} className={leafClass}>
          {raw}
        </HeadingTag>
      );
    return (
      <div key={key} className="live-leaf-wrap" style={LIVE_LEAF_WRAP_STYLE} {...hit}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'text') {
    const leafClass = options.builderDataAttr ? leafClassName('', options) : undefined;
    const raw = node.props?.text || '';
    const inner = isProbablyInlineHtml(raw) ? (
      <p style={css} className={leafClass} dangerouslySetInnerHTML={{ __html: sanitizeInlineLeafHtml(raw) || '' }} />
    ) : (
      <p style={css} className={leafClass}>
        {raw}
      </p>
    );
    return (
      <div key={key} className="live-leaf-wrap" style={LIVE_LEAF_WRAP_STYLE} {...hit}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'rich_text') {
    const anim = getRichTextAnimationStyle(node.props?.animation || {});
    const merged = {
      ...(css || {}),
      ...(anim.style || {}),
    };
    return (
      <div
        key={key}
        className={leafClassName(`live-rich-text ${anim.className || ''}`.trim(), options)}
        style={merged}
        dangerouslySetInnerHTML={{
          __html: sanitizeRichHtml(node.props?.content || '<p></p>', {
            neutralizeHardcodedBodyTextColors: normalizeSiteTheme(activeSiteTheme(options)).presetId === 'dark',
          }),
        }}
        {...hit}
      />
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
    const src = node.props?.src || '';
    if (!src) return null;
    const caption = node.props?.caption;
    const imageHeightPx = Number(node.props?.imageHeightPx || 0);
    const objectPosition = mapImageObjectPositionCss(node.props?.imageObjectPosition);
    const imgStyleBase = {
      objectFit: node.props?.imageFit || 'cover',
      ...(objectPosition ? { objectPosition } : {}),
    };
    const alignLive = resolveImageShellAlignFromProps(node.props || {}, options.parentFlexDirection || 'column');
    let figureStyle =
      imageFitMode(node.props?.imageFit) === 'contain' ? mergeImageFigureStyleForContain(css) : css;
    if (alignLive && Object.keys(alignLive).length) {
      figureStyle = { ...(figureStyle || {}), ...alignLive, width: figureStyle?.width || 'fit-content', maxWidth: '100%' };
    }
    const { style: clampedFigure, fluid: fluidImage } = clampFigureStyleForViewport(figureStyle);
    figureStyle = clampedFigure;
    const imgStyle = clampImgStyleForViewport(imgStyleBase, { imageHeightPx });
    const figureClass = [
      options.builderDataAttr ? leafClassName('', options) : '',
      fluidImage ? 'live-fluid-image' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <figure key={key} style={figureStyle} className={figureClass || undefined} {...hit}>
        <img src={src} alt={node.props?.alt || ''} style={imgStyle} loading="lazy" />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  if (node.nodeType === 'button') {
    const hrefRaw = node.props?.href;
    const href =
      hrefRaw && typeof hrefRaw === 'string'
        ? prefixRelativeAppPath(hrefRaw, options.projectSlug)
        : hrefRaw;
    const content = renderButtonContent(node);
    const btnType = typeof node.props?.type === 'string' ? node.props.type : 'default';
    const btnClass = `bld-btn bld-btn--${btnType}`.trim();
    if (href && typeof href === 'string') {
      return (
        <a
          key={key}
          href={href}
          style={css}
          className={options.builderDataAttr ? `${leafClassName('', options)} ${btnClass}`.trim() : btnClass}
          {...hit}
        >
          {content}
        </a>
      );
    }
    const onAction = node.actionsJson?.onClick;
    if (onAction) {
      const btn = <ActionButton style={css} className={btnClass} label={content} action={onAction} />;
      return options.builderDataAttr ? (
        <span key={key} className={leafClassName('', options)} style={{ display: 'inline-block' }} {...hit}>
          {btn}
        </span>
      ) : (
        <ActionButton key={key} style={css} className={btnClass} label={content} action={onAction} />
      );
    }
    return (
      <button
        key={key}
        type="button"
        style={css}
        className={options.builderDataAttr ? `${leafClassName('', options)} ${btnClass}`.trim() : btnClass}
        {...hit}
      >
        {content}
      </button>
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
      items = prefixMenuItemsWithProjectSlug(items, options.projectSlug);
    }
    const orientation = node.props?.orientation === 'column' ? 'column' : 'row';
    const deviceStyle = themedDeviceStyle(node, device, options);
    const mergedForMenu = mergeDeviceStyleWithTypeDefaults(
      'menu',
      mergeMenuDeviceStyle(orientation, deviceStyle, { align: node.props?.align }, activeSiteTheme(options))
    );
    const menuCss = styleToCss(mergedForMenu, activeSiteTheme(options));
    const styleVars = menuCssVars(mergedForMenu);
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
        dataSource={node.dataJson?.source}
      />
    );
  }

  if (node.nodeType === 'form') {
    const inner = (
      <DynamicForm
        style={css}
        className="live-form--bound"
        fields={Array.isArray(node.props?.fields) ? node.props.fields : []}
        submitLabel={node.props?.submitLabel}
        layout={node.props?.layout}
        notifications={node.props?.notifications}
        formId={String(node.id)}
        pageId={options?.pageId}
        projectId={options?.projectId}
        dataSource={node.dataJson?.source}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <DynamicForm
        key={key}
        style={css}
        className="live-form--bound"
        fields={Array.isArray(node.props?.fields) ? node.props.fields : []}
        submitLabel={node.props?.submitLabel}
        layout={node.props?.layout}
        notifications={node.props?.notifications}
        formId={String(node.id)}
        pageId={options?.pageId}
        projectId={options?.projectId}
        dataSource={node.dataJson?.source}
      />
    );
  }

  if (node.nodeType === 'tabs') {
    const { tabs, activeTabId, imageFit, imageHeightPx, tabAlign } = resolveFeatureTabsProps(node.props);
    const tabsCss = sanitizeCompoundWidgetShellCss(css);
    const bCanvas = options.builderCanvas;
    const tabsBuilder = Boolean(bCanvas?.tabs?.onActiveTabChange);
    const inner = (
      <FeatureTabs
        key={key}
        style={tabsCss}
        tabs={tabs}
        activeTabId={activeTabId}
        imageFit={imageFit}
        imageHeightPx={imageHeightPx}
        tabAlign={tabAlign}
        builderMode={tabsBuilder}
        builderEditable={tabsBuilder && !bCanvas?.sectionEditLocked}
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
    const faqCss = sanitizeCompoundWidgetShellCss(css);
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

  if (node.nodeType === 'carousel') {
    const carouselVariantKey = resolveCarouselVariantKey(node);
    const carouselVariant = carouselVariantKey !== 'hero' ? carouselVariantKey : undefined;
    const carouselCss = sanitizeCarouselLiveCss(css, carouselVariantKey);
    const carouselImageFit = node.props?.imageFit ?? node.props?.settings?.imageFit;
    const carouselShowOverlay = node.props?.showOverlay ?? node.props?.settings?.showOverlay;
    const carouselImageObjectPosition = node.props?.imageObjectPosition ?? node.props?.settings?.imageObjectPosition;
    const carouselTickerDurationSec = node.props?.tickerDurationSec ?? node.props?.settings?.tickerDurationSec;
    const carouselTransitionEasing = node.props?.transitionEasing ?? node.props?.settings?.transitionEasing;
    const carouselScrollDirection = node.props?.scrollDirection ?? node.props?.settings?.scrollDirection;
    const carouselPauseOnHover = node.props?.pauseOnHover ?? node.props?.settings?.pauseOnHover;
    const carouselAutoplay = node.props?.autoplay ?? node.props?.settings?.autoplay;
    const carouselLoop = node.props?.loop ?? node.props?.settings?.loop;
    const carouselInterval =
      node.props?.interval ?? node.props?.settings?.autoplayMs ?? node.props?.settings?.interval;
    const slideList = Array.isArray(node.props?.slides) ? node.props.slides : [];
    const useStaticTicker =
      !options.builderDataAttr &&
      !options.builderCanvas &&
      (carouselVariantKey === 'ticker' || carouselVariantKey === 'marquee');
    const inner = useStaticTicker ? (
      <CarouselTickerStatic
        style={carouselCss}
        slides={slideList}
        variant={carouselVariantKey}
        gap={node.props?.gap ?? node.props?.settings?.gapPx}
        tickerDurationSec={carouselTickerDurationSec}
        scrollDirection={carouselScrollDirection}
      />
    ) : (
      <Carousel
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
        scrollDirection={carouselScrollDirection}
        pauseOnHover={carouselPauseOnHover}
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
        variant={carouselVariantKey}
        gap={node.props?.gap ?? node.props?.settings?.gapPx}
        tickerDurationSec={carouselTickerDurationSec}
        scrollDirection={carouselScrollDirection}
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
        scrollDirection={carouselScrollDirection}
        pauseOnHover={carouselPauseOnHover}
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
    return renderAdvancedElementShell(
      key,
      css,
      options,
      hit,
      <LiveTestimonialCard
        name={node.props?.name}
        role={node.props?.role}
        message={node.props?.message}
        avatarSrc={node.props?.avatarSrc}
        rating={node.props?.rating}
        className={leafClassName('', options)}
      />
    );
  }

  if (node.nodeType === 'pricing_card') {
    return renderAdvancedElementShell(
      key,
      css,
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
        src={node.props?.src}
        alt={node.props?.alt}
        href={node.props?.href}
        widthPx={node.props?.widthPx}
        className={leafClassName('', options)}
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
  return nodes.map((node, index) => {
    const key = liveRenderRootKey(node, index);
    const semantic = rootSemanticTag(nodes, index);
    const tags = semantic ? { ...options, rootRowTag: semantic } : options;
    return renderNode(node, key, { ...tags, isLiveDocRootRow: true });
  });
}
