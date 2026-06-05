/**
 * Compound widgets: props.chrome + dedicated CSS — not full style_json typography.
 * Used by nodeCapabilities + inspector Style tab.
 */

export const COMPOUND_CHROME_KINDS = Object.freeze({
  tabs: 'tabs',
  carousel: 'carousel',
  accordion: 'accordion',
  card: 'card',
});

/** @type {Record<string, { kind: string, label: string, caps: Record<string, boolean> }>} */
export const COMPOUND_WIDGET_META = Object.freeze({
  tabs: {
    kind: COMPOUND_CHROME_KINDS.tabs,
    label: 'Feature tabs',
    caps: {
      supportsTypography: false,
      supportsBackground: false,
      supportsBorder: false,
      supportsEffects: false,
      supportsTransform: false,
      supportsCompoundChrome: true,
    },
  },
  carousel: {
    kind: COMPOUND_CHROME_KINDS.carousel,
    label: 'Carousel',
    caps: {
      supportsTypography: false,
      supportsBackground: false,
      supportsBorder: false,
      supportsEffects: false,
      supportsTransform: false,
      supportsCarousel: true,
      supportsCompoundChrome: true,
    },
  },
  accordion: {
    kind: COMPOUND_CHROME_KINDS.accordion,
    label: 'FAQ accordion',
    caps: {
      supportsTypography: false,
      supportsBackground: false,
      supportsBorder: false,
      supportsEffects: false,
      supportsTransform: false,
      supportsCompoundChrome: true,
    },
  },
  pricing_card: {
    kind: COMPOUND_CHROME_KINDS.card,
    label: 'Pricing card',
    caps: {
      supportsTypography: false,
      supportsBackground: false,
      supportsBorder: false,
      supportsEffects: false,
      supportsTransform: false,
      supportsCompoundChrome: true,
    },
  },
  content_card: {
    kind: COMPOUND_CHROME_KINDS.card,
    label: 'Card',
    caps: {
      supportsTypography: false,
      supportsBackground: false,
      supportsBorder: false,
      supportsEffects: false,
      supportsTransform: false,
      supportsCompoundChrome: true,
    },
  },
  testimonial_card: {
    kind: COMPOUND_CHROME_KINDS.card,
    label: 'Testimonial card',
    caps: {
      supportsTypography: false,
      supportsBackground: false,
      supportsBorder: false,
      supportsEffects: false,
      supportsTransform: false,
      supportsCompoundChrome: true,
    },
  },
});

export function getCompoundWidgetMeta(nodeType) {
  const nt = String(nodeType || '').trim();
  return COMPOUND_WIDGET_META[nt] || null;
}

export function isCompoundWidgetType(nodeType) {
  return Boolean(getCompoundWidgetMeta(nodeType));
}

export function compoundChromeKindForNodeType(nodeType) {
  return getCompoundWidgetMeta(nodeType)?.kind || null;
}

/** Data-driven blocks — no normal child widgets inside the node itself. */
export const DATA_DRIVEN_COMPOUND_NODE_TYPES = new Set(['tabs', 'accordion', 'carousel']);

/**
 * @param {string} nodeType
 * @param {object | Record<string, unknown> | null | undefined} [nodeOrProps] — full node or props for tabs panelMode
 */
export function isDataDrivenCompoundWidget(nodeType, nodeOrProps = null) {
  const nt = String(nodeType || '').trim();
  if (nt === 'tabs') {
    const props =
      nodeOrProps?.props && typeof nodeOrProps.props === 'object'
        ? nodeOrProps.props
        : nodeOrProps && typeof nodeOrProps === 'object' && !nodeOrProps.nodeType
          ? nodeOrProps
          : null;
    if (props && String(props.panelMode || 'fields').trim() === 'elements') return false;
  }
  return DATA_DRIVEN_COMPOUND_NODE_TYPES.has(nt);
}
