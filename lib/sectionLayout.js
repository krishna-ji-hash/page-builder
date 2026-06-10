/**
 * Section-level layout presets (stored on section row `props.meta.sectionLayout`).
 * Applied to stacks marked `props.meta.sectionItemsHost` or rows with `sectionColumnLayout`.
 */

export const SECTION_LAYOUT_DIRECTIONS = ['auto', 'vertical', 'horizontal'];
export const SECTION_LAYOUT_GAPS = ['small', 'medium', 'large'];
export const SECTION_LAYOUT_ALIGNS = ['left', 'center', 'right'];

const GAP_PX = { small: 12, medium: 20, large: 32 };

/** @typedef {{ direction?: string, columns?: number, gap?: string, align?: string, mobileStack?: boolean, reverse?: boolean }} SectionLayout */

/** @type {Record<string, SectionLayout>} */
export const DEFAULT_SECTION_LAYOUTS = {
  pricing: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'center', mobileStack: true, reverse: false },
  stats: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'center', mobileStack: true, reverse: false },
  contactForm: { direction: 'vertical', columns: 1, gap: 'medium', align: 'left', mobileStack: true, reverse: false },
  blogPreview: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  timeline: { direction: 'vertical', columns: 1, gap: 'medium', align: 'left', mobileStack: true, reverse: false },
  comparisonTable: { direction: 'vertical', columns: 1, gap: 'small', align: 'left', mobileStack: true, reverse: false },
  gallery: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  team: { direction: 'horizontal', columns: 4, gap: 'medium', align: 'center', mobileStack: true, reverse: false },
  videoSection: { direction: 'horizontal', columns: 2, gap: 'large', align: 'center', mobileStack: true, reverse: false },
  processSteps: { direction: 'horizontal', columns: 4, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  trustBadges: { direction: 'horizontal', columns: 5, gap: 'small', align: 'center', mobileStack: true, reverse: false },
  brandsLogoSlider: { direction: 'horizontal', columns: 6, gap: 'medium', align: 'center', mobileStack: false, reverse: false },
  splitHeroCarousel: { direction: 'vertical', columns: 1, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  tabHero: { direction: 'vertical', columns: 1, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  webStory: { direction: 'horizontal', columns: 5, gap: 'medium', align: 'center', mobileStack: true, reverse: false },
  mapIntegration: { direction: 'horizontal', columns: 2, gap: 'large', align: 'stretch', mobileStack: true, reverse: false },
  features: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  benefits: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  testimonials: { direction: 'horizontal', columns: 2, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  trustLogos: { direction: 'horizontal', columns: 4, gap: 'medium', align: 'center', mobileStack: true, reverse: false },
  resourcesBlogs: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  whyChooseCourier: { direction: 'horizontal', columns: 2, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  getInTouch: { direction: 'horizontal', columns: 2, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  faq: { direction: 'vertical', columns: 1, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  featureTabs: { direction: 'vertical', columns: 1, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  footer: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  hero: { direction: 'vertical', columns: 1, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
  cards: { direction: 'horizontal', columns: 3, gap: 'medium', align: 'stretch', mobileStack: true, reverse: false },
};

const FALLBACK_LAYOUT = {
  direction: 'auto',
  columns: 3,
  gap: 'medium',
  align: 'stretch',
  mobileStack: true,
  reverse: false,
};

/**
 * @param {SectionLayout|null|undefined} raw
 * @param {string|null|undefined} templateId
 */
export function normalizeSectionLayout(raw, templateId) {
  const base =
    templateId && DEFAULT_SECTION_LAYOUTS[templateId]
      ? { ...DEFAULT_SECTION_LAYOUTS[templateId] }
      : { ...FALLBACK_LAYOUT };
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const columns = Number(src.columns);
  return {
    direction: SECTION_LAYOUT_DIRECTIONS.includes(src.direction) ? src.direction : base.direction,
    columns: Number.isFinite(columns) && columns >= 1 && columns <= 6 ? Math.round(columns) : base.columns,
    gap: SECTION_LAYOUT_GAPS.includes(src.gap) ? src.gap : base.gap,
    align: SECTION_LAYOUT_ALIGNS.includes(src.align) ? src.align : base.align,
    mobileStack: src.mobileStack != null ? Boolean(src.mobileStack) : base.mobileStack,
    reverse: Boolean(src.reverse),
  };
}

export function defaultSectionLayoutFor(templateId) {
  return normalizeSectionLayout(null, templateId);
}

/**
 * @param {SectionLayout} layout
 * @param {'desktop'|'tablet'|'mobile'} device
 */
export function resolveLayoutFlexDirection(layout, device) {
  const isMobile = device === 'mobile' || device === 'tablet';
  let dir = layout.direction;
  if (dir === 'auto') {
    dir = isMobile && layout.mobileStack ? 'vertical' : 'horizontal';
  }
  if (isMobile && layout.mobileStack) {
    dir = 'vertical';
  }
  const flexDirection = dir === 'horizontal' ? 'row' : 'column';
  return layout.reverse
    ? flexDirection === 'row'
      ? 'row-reverse'
      : 'column-reverse'
    : flexDirection;
}

function alignToFlex(align) {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}

function alignToJustify(align, direction) {
  const isRow = direction === 'row' || direction === 'row-reverse';
  const val = alignToFlex(align);
  return isRow ? val : 'flex-start';
}

function alignToItems(align, direction) {
  const isRow = direction === 'row' || direction === 'row-reverse';
  const val = alignToFlex(align);
  return isRow ? 'stretch' : val;
}

/**
 * @param {SectionLayout} layout
 */
export function sectionLayoutGapPx(layout) {
  return GAP_PX[layout.gap] ?? GAP_PX.medium;
}

/**
 * @param {SectionLayout} layout
 * @param {'desktop'|'tablet'|'mobile'} device
 */
export function buildLayoutStyle(layout, device = 'desktop') {
  const flexDirection = resolveLayoutFlexDirection(layout, device);
  const gap = sectionLayoutGapPx(layout);
  const isHorizontal = flexDirection === 'row' || flexDirection === 'row-reverse';
  return {
    display: 'flex',
    flexDirection,
    flexWrap: isHorizontal ? 'wrap' : 'nowrap',
    gap: `${gap}px`,
    justifyContent: alignToJustify(layout.align, flexDirection),
    alignItems: alignToItems(layout.align, flexDirection),
    width: '100%',
  };
}

/**
 * @param {Record<string, unknown>} deviceStyle
 * @param {SectionLayout} layout
 * @param {'desktop'|'tablet'|'mobile'} device
 */
export function applySectionLayoutToDeviceStyle(deviceStyle, layout, device) {
  const layoutStyle = buildLayoutStyle(layout, device);
  const layoutSlice = { ...(deviceStyle.layout || {}) };
  return {
    ...deviceStyle,
    layout: {
      ...layoutSlice,
      ...layoutStyle,
      gap: sectionLayoutGapPx(layout),
    },
  };
}

/**
 * Flex sizing for item cards inside a horizontal section grid.
 * @param {number} cols
 */
export function sectionItemsChildFlexForColumns(cols) {
  const n = Math.min(6, Math.max(1, Number(cols) || 3));
  if (n === 1) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
    };
  }
  if (n === 2) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 'calc(50% - 12px)',
      maxWidth: 'calc(50% - 6px)',
      minWidth: 'min(100%, 260px)',
      alignSelf: 'stretch',
    };
  }
  if (n === 4) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 'calc(25% - 16px)',
      maxWidth: 'calc(25% - 12px)',
      minWidth: 'min(100%, 200px)',
      alignSelf: 'stretch',
    };
  }
  if (n === 5) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 'calc(20% - 16px)',
      maxWidth: 'calc(20% - 12px)',
      minWidth: 'min(100%, 160px)',
      alignSelf: 'stretch',
    };
  }
  if (n === 6) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 'calc(16.666% - 16px)',
      maxWidth: 'calc(16.666% - 12px)',
      minWidth: 'min(100%, 140px)',
      alignSelf: 'stretch',
    };
  }
  return {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'calc(33.333% - 14px)',
    maxWidth: 'calc(33.333% - 10px)',
    minWidth: 'min(100%, 220px)',
    alignSelf: 'stretch',
  };
}

/**
 * Builder canvas: card stacks default to width 100% (column stack rule) which breaks horizontal item grids.
 * @param {Record<string, unknown>} deviceStyle
 * @param {SectionLayout} layout
 * @param {'desktop'|'tablet'|'mobile'} device
 */
export function applySectionItemsChildToDeviceStyle(deviceStyle, layout, device) {
  const flexDir = resolveLayoutFlexDirection(layout, device);
  if (flexDir !== 'row' && flexDir !== 'row-reverse') return deviceStyle;
  const cols = Math.min(6, Math.max(1, Number(layout.columns) || 3));
  const flexPatch = sectionItemsChildFlexForColumns(cols);
  const layoutIn = deviceStyle.layout && typeof deviceStyle.layout === 'object' ? { ...deviceStyle.layout } : {};
  const { flex: _flex, width: _layoutWidth, ...layoutRest } = layoutIn;
  const sizeIn = deviceStyle.size && typeof deviceStyle.size === 'object' ? { ...deviceStyle.size } : {};
  const { width: _sizeWidth, ...sizeRest } = sizeIn;
  return {
    ...deviceStyle,
    layout: { ...layoutRest, ...flexPatch },
    size: sizeRest,
  };
}

/**
 * Patch responsive style_json from section layout (desktop + optional mobile stack).
 * @param {Record<string, unknown>|null|undefined} styleJson
 * @param {SectionLayout} layout
 */
export function applySectionLayoutToStyleJson(styleJson, layout) {
  const base = styleJson && typeof styleJson === 'object' ? { ...styleJson } : {};
  const desktop = applySectionLayoutToDeviceStyle(
    base.desktop && typeof base.desktop === 'object' ? { ...base.desktop } : {},
    layout,
    'desktop'
  );
  const next = { ...base, desktop };
  if (layout.mobileStack) {
    const mobileLayout = normalizeSectionLayout({ ...layout, direction: 'vertical' }, null);
    next.mobile = applySectionLayoutToDeviceStyle(
      base.mobile && typeof base.mobile === 'object' ? { ...base.mobile } : {},
      mobileLayout,
      'mobile'
    );
    next.tablet = applySectionLayoutToDeviceStyle(
      base.tablet && typeof base.tablet === 'object' ? { ...base.tablet } : {},
      { ...layout, direction: 'vertical' },
      'tablet'
    );
  }
  return next;
}

/**
 * @param {SectionLayout} layout
 */
export function sectionLayoutDataAttrs(layout) {
  return {
    'data-bld-section-items': 'true',
    'data-bld-layout-direction': layout.direction,
    'data-bld-layout-cols': String(layout.columns),
    'data-bld-layout-gap': layout.gap,
    'data-bld-layout-align': layout.align,
    'data-bld-layout-mobile-stack': layout.mobileStack ? 'true' : 'false',
    'data-bld-layout-reverse': layout.reverse ? 'true' : 'false',
  };
}

/**
 * @param {SectionLayout} layout
 */
export function getSectionLayoutClasses(layout) {
  const dir =
    layout.direction === 'vertical'
      ? 'bld-layout-vertical'
      : layout.direction === 'horizontal'
        ? 'bld-layout-horizontal'
        : 'bld-layout-auto';
  const cols = Math.min(6, Math.max(1, Number(layout.columns) || 3));
  const gap =
    layout.gap === 'small' ? 'bld-gap-sm' : layout.gap === 'large' ? 'bld-gap-lg' : 'bld-gap-md';
  const align =
    layout.align === 'center'
      ? 'bld-align-center'
      : layout.align === 'right'
        ? 'bld-align-right'
        : 'bld-align-left';
  return [
    'bld-section-layout',
    'bld-layout-grid',
    dir,
    `bld-cols-${cols}`,
    gap,
    align,
    layout.reverse ? 'bld-layout-reverse' : '',
    layout.mobileStack ? 'bld-layout-mobile-stack' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * @param {unknown[]} nodes
 * @param {string|number} sectionRowId
 */
export function findSectionItemsHostNode(nodes, sectionRowId) {
  let found = null;
  const walk = (list, inside) => {
    for (const n of list || []) {
      if (!n || typeof n !== 'object') continue;
      const inSection = inside || String(n.id) === String(sectionRowId);
      if (inSection && n.props?.meta?.sectionItemsHost) {
        found = n;
        return;
      }
      if (Array.isArray(n.children) && n.children.length) walk(n.children, inSection);
      if (found) return;
    }
  };
  walk(nodes, false);
  return found;
}

/**
 * @param {unknown[]} nodes
 * @param {string|number} sectionRowId
 */
export function findSectionColumnLayoutRow(nodes, sectionRowId) {
  const row = findNodeById(nodes, sectionRowId);
  if (!row || row.nodeType !== 'row') return null;
  if (row.props?.meta?.sectionColumnLayout) return row;
  return null;
}

function findNodeById(nodes, id) {
  for (const n of nodes || []) {
    if (!n) continue;
    if (String(n.id) === String(id)) return n;
    const kid = findNodeById(n.children, id);
    if (kid) return kid;
  }
  return null;
}

export function sectionRowHasLayoutControls(meta) {
  if (!meta || typeof meta !== 'object') return false;
  return Boolean(meta.sectionTemplate);
}

const SECTION_ITEM_CARD_ROLES = new Set([
  'blog-card',
  'pricing-card',
  'pricing-card--popular',
  'team-card',
  'stat-card',
  'process-step',
  'story-card',
  'trust-badge',
  'gallery-item',
]);

/** True when every child is a marketplace template item card (blog, pricing, team, …). */
export function nodeHasSectionItemCards(node) {
  if (node?.nodeType !== 'stack' || !Array.isArray(node.children) || node.children.length < 2) return false;
  let cardish = 0;
  for (const child of node.children) {
    const role = child?.props?.meta?.tplRole;
    if (typeof role !== 'string' || !role.trim()) return false;
    const r = role.trim();
    if (SECTION_ITEM_CARD_ROLES.has(r) || r.includes('card') || r.includes('pricing')) cardish += 1;
  }
  return cardish >= 2 && cardish === node.children.length;
}

/** Stack that hosts section item cards (blog, pricing, team, …). */
export function nodeIsSectionItemsHost(node) {
  const meta = node?.props?.meta;
  if (meta && typeof meta === 'object') {
    if (meta.sectionItemsHost || meta.tplRole === 'items-host') return true;
  }
  return nodeHasSectionItemCards(node);
}
