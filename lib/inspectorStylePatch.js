import { GAP_SCALE_IDS } from './layoutGapUtils.js';
import { isFooterRowNode, isHeaderRowNode } from './rowLayoutMeta.js';
import { isRootPageRow } from './liveDocSectionSpacing.js';
import { resolveHeaderLayoutMode } from './headerLayoutMode.js';
import { resolveSectionWidthMode, SECTION_WIDTH_MODES } from './liveContentContainer.js';
import { themeSpacingPx } from './siteDesignTheme.js';

function parsePxValue(value, fallback = 0) {
  const num = parseFloat(String(value ?? '').replace('px', '').trim());
  return Number.isFinite(num) ? num : fallback;
}

function composeTransformString(form) {
  const parts = [];
  const rot = String(form.transformRotate ?? '').trim();
  const scale = String(form.transformScale ?? '').trim();
  const tx = String(form.transformTranslateX ?? '').trim();
  const ty = String(form.transformTranslateY ?? '').trim();
  const skx = String(form.transformSkewX ?? '').trim();
  const sky = String(form.transformSkewY ?? '').trim();
  if (rot) parts.push(`rotate(${rot}${/deg$/i.test(rot) ? '' : 'deg'})`);
  if (scale) parts.push(`scale(${scale})`);
  if (tx || ty) parts.push(`translate(${tx || '0px'}, ${ty || '0px'})`);
  if (skx) parts.push(`skewX(${skx}${/deg$/i.test(skx) ? '' : 'deg'})`);
  if (sky) parts.push(`skewY(${sky}${/deg$/i.test(sky) ? '' : 'deg'})`);
  return parts.length ? parts.join(' ') : undefined;
}

function composeFilterEffects(form) {
  const out = {};
  const blur = String(form.effectBlur ?? '').trim();
  const bb = String(form.effectBackdropBlur ?? '').trim();
  const br = String(form.effectBrightness ?? '').trim();
  const co = String(form.effectContrast ?? '').trim();
  const sa = String(form.effectSaturation ?? '').trim();
  const gr = String(form.effectGrayscale ?? '').trim();
  if (blur) out.blur = blur.includes('px') ? blur : `${blur}px`;
  if (bb) out.backdropFilter = bb.includes('px') ? `blur(${bb})` : `blur(${bb}px)`;
  if (br) out.brightness = br.includes('%') ? br : `${br}%`;
  if (co) out.contrast = co.includes('%') ? co : `${co}%`;
  if (sa) out.saturate = sa.includes('%') ? sa : `${sa}%`;
  if (gr) out.grayscale = gr.includes('%') ? gr : `${gr}%`;
  const blend = String(form.effectBlendMode ?? '').trim();
  if (blend) out.blendMode = blend;
  const ts = String(form.textShadow ?? '').trim();
  if (ts) out.textShadow = ts;
  return out;
}

function buildTypographyPatch(nextForm, changedKey) {
  const patch = {
    fontSize: `${parsePxValue(nextForm.fontSizePx, 16)}px`,
    fontWeight: nextForm.fontWeight,
    lineHeight: String(nextForm.lineHeight || '1.4'),
    letterSpacing: `${parsePxValue(nextForm.letterSpacingPx, 0)}px`,
    textTransform: nextForm.textTransform,
    textDecoration: nextForm.textDecoration,
    whiteSpace: nextForm.whiteSpace,
    color: nextForm.textColor,
    textAlign: nextForm.alignment || nextForm.textAlign,
  };
  if (changedKey === 'fontFamily') {
    const fam = String(nextForm.fontFamily || '').trim();
    patch.fontFamily = fam || null;
  }
  const shadow = String(nextForm.textShadow || '').trim();
  if (shadow) patch.textShadow = shadow;
  return patch;
}

function buildBackgroundPatch(nextForm) {
  const hasBg = Boolean(nextForm.bgImageUrl && String(nextForm.bgImageUrl).trim());
  return {
    backgroundColor: nextForm.bgColor,
    backgroundImage: hasBg ? String(nextForm.bgImageUrl) : undefined,
    backgroundSize: hasBg ? String(nextForm.bgSize || 'cover') : undefined,
    backgroundPosition: hasBg ? String(nextForm.bgPosition || 'center center') : undefined,
    backgroundRepeat: hasBg ? String(nextForm.bgRepeat || 'no-repeat') : undefined,
    meta: hasBg
      ? {
          altText: String(nextForm.bgImageAlt || ''),
          title: String(nextForm.bgImageTitle || ''),
        }
      : undefined,
  };
}

function buildRowMarginPatch(nextForm, selectedNode, pageTree) {
  const isRow = selectedNode?.nodeType === 'row';
  if (!isRow) return null;
  const isRootLandmarkRow =
    Array.isArray(pageTree) &&
    pageTree.length > 0 &&
    isRootPageRow(pageTree, selectedNode) &&
    (isHeaderRowNode(selectedNode) || isFooterRowNode(selectedNode));
  const rawMode = String(nextForm.containerWidthMode || 'full');
  const containerMode = rawMode === 'custom' ? 'boxed' : rawMode;
  const containerPx = Math.max(320, Math.min(2400, parsePxValue(nextForm.containerWidthPx, 1200)));
  const rowWidthPct = Math.min(100, Math.max(10, Number(nextForm.rowWidthPercent) || 100));
  const isBoxed = containerMode === 'boxed';
  const fullRowNarrow = containerMode === 'full' && rowWidthPct < 100;
  const needsHorizontalCenter = !isRootLandmarkRow && (isBoxed || fullRowNarrow);
  return needsHorizontalCenter
    ? `${parsePxValue(nextForm.marginTop)}px auto ${parsePxValue(nextForm.marginBottom)}px auto`
    : `${parsePxValue(nextForm.marginTop)}px ${parsePxValue(nextForm.marginRight)}px ${parsePxValue(nextForm.marginBottom)}px ${parsePxValue(nextForm.marginLeft)}px`;
}

function buildFlexLayoutPatch(nextForm, selectedNode, pageTree, siteTheme) {
  const isRow = selectedNode?.nodeType === 'row';
  const isStatsCounter = selectedNode?.nodeType === 'stats_counter';
  const isFlexLayoutContainer =
    selectedNode?.nodeType === 'row' ||
    selectedNode?.nodeType === 'column' ||
    selectedNode?.nodeType === 'stack' ||
    isStatsCounter;
  if (!isFlexLayoutContainer) return {};

  const isRootLandmarkRow =
    isRow &&
    Array.isArray(pageTree) &&
    pageTree.length > 0 &&
    isRootPageRow(pageTree, selectedNode) &&
    (isHeaderRowNode(selectedNode) || isFooterRowNode(selectedNode));
  const rawMode = isRow ? String(nextForm.containerWidthMode || 'full') : 'full';
  const containerMode = rawMode === 'custom' ? 'boxed' : rawMode;
  const containerPx = Math.max(320, Math.min(2400, parsePxValue(nextForm.containerWidthPx, 1200)));
  const rowWidthPct = Math.min(100, Math.max(10, Number(nextForm.rowWidthPercent) || 100));

  const rowLayoutMaxWidth = !isRow
    ? {}
    : isRootLandmarkRow
      ? { maxWidth: '100%' }
      : containerMode === 'boxed'
        ? { maxWidth: `${containerPx}px` }
        : { maxWidth: `${rowWidthPct}%` };

  const flexGapPx = parsePxValue(nextForm.layoutGapPx, 0);
  const flexWrapVal = String(nextForm.layoutFlexWrap || 'nowrap').trim() || 'nowrap';
  const gapScaleSel = String(nextForm.layoutGapScale || '').trim();
  const useGapScale = GAP_SCALE_IDS.includes(gapScaleSel);

  return {
    flexDirection: nextForm.layoutDirection || (isRow || isStatsCounter ? 'row' : 'column'),
    flexWrap: flexWrapVal,
    alignItems: nextForm.layoutAlign || 'stretch',
    justifyContent: nextForm.layoutJustify || 'flex-start',
    alignContent: nextForm.layoutAlignContent || 'stretch',
    ...rowLayoutMaxWidth,
    ...(useGapScale
      ? { gapScale: gapScaleSel, gap: themeSpacingPx(siteTheme, gapScaleSel) }
      : { gap: flexGapPx }),
  };
}

function buildLayoutProPatch(nextForm, key) {
  const patch = {};
  if (key === 'layoutDisplay') patch.display = nextForm.layoutDisplay || undefined;
  if (key === 'layoutOverflow') patch.overflow = nextForm.layoutOverflow || undefined;
  if (key === 'layoutAlignSelf') patch.alignSelf = nextForm.layoutAlignSelf || undefined;
  if (key === 'layoutOrder') {
    if (nextForm.layoutOrder !== '' && nextForm.layoutOrder != null) patch.order = nextForm.layoutOrder;
  }
  if (key === 'layoutFlexGrow' && nextForm.layoutFlexGrow !== '' && nextForm.layoutFlexGrow != null) {
    patch.flexGrow = nextForm.layoutFlexGrow;
  }
  if (key === 'layoutFlexShrink' && nextForm.layoutFlexShrink !== '' && nextForm.layoutFlexShrink != null) {
    patch.flexShrink = nextForm.layoutFlexShrink;
  }
  if (key === 'layoutFlexBasis' && nextForm.layoutFlexBasis) patch.flexBasis = nextForm.layoutFlexBasis;
  if (key === 'position') patch.position = nextForm.position || 'static';
  if (key === 'left') patch.left = nextForm.left ?? '';
  if (key === 'top') patch.top = nextForm.top ?? '';
  if (key === 'right') patch.right = nextForm.right ?? '';
  if (key === 'bottom') patch.bottom = nextForm.bottom ?? '';
  if (key === 'zIndex') patch.zIndex = nextForm.zIndex ?? '';
  return patch;
}

function buildSizePatch(nextForm, selectedNode) {
  const isRow = selectedNode?.nodeType === 'row';
  const patch = {
    width: isRow
      ? '100%'
      : nextForm.widthMode === 'full'
        ? '100%'
        : nextForm.widthMode === 'px'
          ? `${parsePxValue(nextForm.widthPx, 320)}px`
          : 'auto',
    height: parsePxValue(nextForm.heightPx, 0) > 0 ? `${parsePxValue(nextForm.heightPx, 0)}px` : 'auto',
  };
  if (String(nextForm.sizeMinWidth || '').trim()) patch.minWidth = String(nextForm.sizeMinWidth).trim();
  if (String(nextForm.sizeMaxWidth || '').trim()) patch.maxWidth = String(nextForm.sizeMaxWidth).trim();
  if (String(nextForm.sizeMinHeight || '').trim()) patch.minHeight = String(nextForm.sizeMinHeight).trim();
  if (String(nextForm.sizeMaxHeight || '').trim()) patch.maxHeight = String(nextForm.sizeMaxHeight).trim();
  return patch;
}

const TYPO_KEYS = new Set([
  'fontFamily',
  'fontSizePx',
  'fontWeight',
  'lineHeight',
  'letterSpacingPx',
  'textTransform',
  'textDecoration',
  'whiteSpace',
  'textColor',
  'textShadow',
  'alignment',
  'textAlign',
]);

const FLEX_KEYS = new Set([
  'layoutDirection',
  'layoutFlexWrap',
  'layoutGapPx',
  'layoutGapScale',
  'layoutAlign',
  'layoutJustify',
  'layoutAlignContent',
  'containerWidthMode',
  'containerWidthPx',
  'rowWidthPercent',
  'sectionWidthMode',
]);

const LAYOUT_PRO_KEYS = new Set([
  'layoutDisplay',
  'layoutOverflow',
  'layoutAlignSelf',
  'layoutOrder',
  'layoutFlexGrow',
  'layoutFlexShrink',
  'layoutFlexBasis',
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'zIndex',
]);

const SIZE_KEYS = new Set(['widthMode', 'widthPx', 'heightPx', 'sizeMinWidth', 'sizeMaxWidth', 'sizeMinHeight', 'sizeMaxHeight']);

const BORDER_KEYS = new Set(['borderRadiusPx', 'borderWidthPx', 'borderColor']);

const EFFECT_KEYS = new Set([
  'boxShadow',
  'opacity',
  'effectBlur',
  'effectBackdropBlur',
  'effectBrightness',
  'effectContrast',
  'effectSaturation',
  'effectGrayscale',
  'effectBlendMode',
]);

const BG_KEYS = new Set(['bgColor', 'bgImageUrl', 'bgSize', 'bgPosition', 'bgRepeat', 'bgImageAlt', 'bgImageTitle']);

const TRANSFORM_KEYS = new Set([
  'transformRotate',
  'transformScale',
  'transformTranslateX',
  'transformTranslateY',
  'transformSkewX',
  'transformSkewY',
]);

const MENU_KEYS = new Set([
  'menuGapPx',
  'menuItemPadding',
  'menuBorderRadius',
  'menuHoverColor',
  'menuHoverBg',
]);

const MENU_DROPDOWN_KEYS = new Set([
  'menuDdItemFontSizePx',
  'menuDdItemPadding',
  'menuDdWidth',
  'menuDdMinWidth',
  'menuDdMaxWidth',
  'menuDdOverflow',
  'menuDdChevronVariant',
  'menuDdChevronSizePx',
  'menuDdChevronGapPx',
  'menuDdShadow',
  'menuDdBorderRadiusPx',
  'menuDdItemGapPx',
  'menuDdOffsetXPx',
  'menuDdOffsetYPx',
  'menuDdNestedIndentPx',
  'menuDdNestedGapPx',
  'menuDdNestedMode',
  'menuDdNestedDefaultOpen',
]);

/**
 * Build a minimal style_json patch for one inspector control change.
 * Avoids overwriting unrelated groups (e.g. typography change must not reset position).
 */
export function buildInspectorStylePatch(key, nextForm, ctx) {
  const { selectedNode, siteTheme, pageTree } = ctx;
  const patch = {};
  let baseJsonOverride;

  if (key === 'menuTextColor') {
    const c = nextForm.menuTextColor ?? nextForm.textColor;
    return {
      patch: {
        typography: { color: c },
        colors: { textColor: c },
      },
    };
  }

  if (TYPO_KEYS.has(key)) {
    const typo = buildTypographyPatch(nextForm, key);
    patch.typography = typo;
    if (key === 'textColor' || key === 'alignment' || key === 'textAlign') {
      patch.colors = { textColor: nextForm.textColor };
    }
    const out = { patch };
    if (key === 'fontFamily') {
      const fam = String(nextForm.fontFamily || '').trim();
      out.propsMetaPatch = { userFontOverride: Boolean(fam) };
    }
    return out;
  }

  if (BG_KEYS.has(key)) {
    patch.colors = { backgroundColor: nextForm.bgColor };
    patch.background = buildBackgroundPatch(nextForm);
    return { patch };
  }

  if (FLEX_KEYS.has(key)) {
    const isFlexLayoutContainer =
      selectedNode?.nodeType === 'row' ||
      selectedNode?.nodeType === 'column' ||
      selectedNode?.nodeType === 'stack' ||
      selectedNode?.nodeType === 'stats_counter';
    if (isFlexLayoutContainer) {
      patch.layout = buildFlexLayoutPatch(nextForm, selectedNode, pageTree, siteTheme);
      if (key === 'layoutGapPx' && !GAP_SCALE_IDS.includes(String(nextForm.layoutGapScale || ''))) {
        baseJsonOverride = undefined; // caller strips gapScale when needed
      }
    }
    const rowMargin = buildRowMarginPatch(nextForm, selectedNode, pageTree);
    if (rowMargin != null) {
      patch.spacing = { margin: rowMargin };
    }
    return { patch, baseJsonOverride, needsRowMeta: ['containerWidthMode', 'containerWidthPx', 'sectionWidthMode'].includes(key) };
  }

  if (LAYOUT_PRO_KEYS.has(key)) {
    const lo = buildLayoutProPatch(nextForm, key);
    if (Object.keys(lo).length) patch.layout = lo;
    return { patch };
  }

  if (SIZE_KEYS.has(key)) {
    patch.size = buildSizePatch(nextForm, selectedNode);
    return { patch };
  }

  if (BORDER_KEYS.has(key)) {
    const rad = `${parsePxValue(nextForm.borderRadiusPx)}px`;
    patch.border = {
      radius: rad,
      width: `${parsePxValue(nextForm.borderWidthPx)}px`,
      color: nextForm.borderColor,
      style: 'solid',
    };
    patch.effects = { borderRadius: rad };
    return { patch };
  }

  if (EFFECT_KEYS.has(key)) {
    if (key === 'textShadow') {
      patch.typography = { textShadow: String(nextForm.textShadow || '').trim() };
      return { patch };
    }
    if (key === 'boxShadow') {
      const raw = String(nextForm.boxShadow ?? '').trim();
      patch.effects = { boxShadow: raw || 'none' };
      return { patch };
    }
    if (key === 'opacity') {
      const n = parseFloat(String(nextForm.opacity ?? '1'));
      patch.effects = {
        opacity: Number.isFinite(n) ? String(Math.max(0, Math.min(1, n))) : '1',
      };
      return { patch };
    }
    patch.effects = composeFilterEffects(nextForm);
    return { patch };
  }

  if (TRANSFORM_KEYS.has(key)) {
    const t = composeTransformString(nextForm);
    if (t) patch.transform = { transform: t };
    return { patch };
  }

  if (MENU_KEYS.has(key)) {
    patch.menu = {
      gap: parsePxValue(nextForm.menuGapPx, 12),
      itemPadding: String(nextForm.menuItemPadding || '6px 12px'),
      borderRadius: String(nextForm.menuBorderRadius || '20px'),
      hoverColor: String(nextForm.menuHoverColor || '#6366f1'),
      hoverBg: String(nextForm.menuHoverBg || '#f1f5ff'),
    };
    return { patch };
  }

  if (MENU_DROPDOWN_KEYS.has(key)) {
    const overflowRaw = String(nextForm.menuDdOverflow || '').trim().toLowerCase();
    const overflow =
      overflowRaw === 'visible' || overflowRaw === 'hidden' || overflowRaw === 'auto' ? overflowRaw : 'visible';
    const chevRaw = String(nextForm.menuDdChevronVariant || '').trim().toLowerCase();
    const chevronVariant =
      chevRaw === 'chevron' || chevRaw === 'triangle' || chevRaw === 'caret' || chevRaw === 'plus' || chevRaw === 'none'
        ? chevRaw
        : 'caret';
    const nestedModeRaw = String(nextForm.menuDdNestedMode || '').trim().toLowerCase();
    const nestedMode = nestedModeRaw === 'always' || nestedModeRaw === 'toggle' ? nestedModeRaw : 'toggle';
    const nestedDefaultOpen = Boolean(nextForm.menuDdNestedDefaultOpen);
    patch.menu = {
      dropdown: {
        itemFontSizePx: parsePxValue(nextForm.menuDdItemFontSizePx, 0),
        itemPadding: String(nextForm.menuDdItemPadding || '').trim() || undefined,
        width: String(nextForm.menuDdWidth || '').trim() || undefined,
        minWidth: String(nextForm.menuDdMinWidth || '').trim() || undefined,
        maxWidth: String(nextForm.menuDdMaxWidth || '').trim() || undefined,
        overflow,
        chevronVariant,
        chevronSizePx: parsePxValue(nextForm.menuDdChevronSizePx, 0),
        chevronGapPx: parsePxValue(nextForm.menuDdChevronGapPx, 0),
        shadow: String(nextForm.menuDdShadow || '').trim() || undefined,
        borderRadiusPx: parsePxValue(nextForm.menuDdBorderRadiusPx, 0),
        itemGapPx: parsePxValue(nextForm.menuDdItemGapPx, 0),
        offsetXPx: parsePxValue(nextForm.menuDdOffsetXPx, 0),
        offsetYPx: parsePxValue(nextForm.menuDdOffsetYPx, 0),
        nestedIndentPx: parsePxValue(nextForm.menuDdNestedIndentPx, 0),
        nestedGapPx: parsePxValue(nextForm.menuDdNestedGapPx, 0),
        nestedMode,
        nestedDefaultOpen,
      },
    };
    return { patch };
  }

  return { patch: null, unknownKey: key };
}

export { parsePxValue, buildRowMarginPatch, resolveSectionWidthMode, SECTION_WIDTH_MODES };
