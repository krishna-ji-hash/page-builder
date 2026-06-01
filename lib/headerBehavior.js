/**
 * Header row scroll/placement behaviors (props.meta.headerBehavior).
 * Starters, live CSS data attrs, and inspector options share this registry.
 */

export const DEFAULT_HEADER_BEHAVIOR = {
  type: 'normal',
  variant: 'default',
  revealAfter: 120,
  transparentAtTop: false,
  shadowOnScroll: true,
  shrinkOnScroll: false,
};

/** @typedef {{ id: string, label: string, icon: string, behavior: object, insertsMainRevealPair?: boolean }} HeaderStarterCard */

/** @type {HeaderStarterCard[]} */
export const HEADER_STARTER_CARDS = [
  {
    id: 'headerNormal',
    label: 'Normal Header',
    icon: 'HDR',
    behavior: { type: 'normal', variant: 'default', transparentAtTop: false, shadowOnScroll: false },
  },
  {
    id: 'headerSticky',
    label: 'Sticky Header',
    icon: 'STK',
    behavior: { type: 'sticky', variant: 'default', transparentAtTop: false, shadowOnScroll: true },
  },
  {
    id: 'headerFixed',
    label: 'Fixed Header',
    icon: 'FIX',
    behavior: { type: 'fixed', variant: 'default', transparentAtTop: false, shadowOnScroll: true },
  },
  {
    id: 'headerReveal',
    label: 'Reveal Header',
    icon: 'RVL',
    behavior: {
      type: 'revealOnScroll',
      variant: 'default',
      revealAfter: 120,
      transparentAtTop: false,
      shadowOnScroll: true,
    },
  },
  {
    id: 'headerMainReveal',
    label: 'Main + Reveal Header',
    icon: 'M+R',
    behavior: {
      type: 'mainReveal',
      variant: 'default',
      revealAfter: 120,
      transparentAtTop: true,
      shadowOnScroll: true,
    },
  },
  {
    id: 'headerMainRevealCompact',
    label: 'Compact Reveal Header',
    icon: 'CMP',
    behavior: {
      type: 'mainReveal',
      variant: 'compact',
      revealAfter: 120,
      transparentAtTop: true,
      shadowOnScroll: true,
      shrinkOnScroll: true,
    },
  },
  {
    id: 'headerMainRevealGlass',
    label: 'Glass Reveal Header',
    icon: 'GLS',
    behavior: {
      type: 'mainReveal',
      variant: 'glass',
      revealAfter: 120,
      transparentAtTop: true,
      shadowOnScroll: true,
    },
  },
  {
    id: 'headerMainRevealFloating',
    label: 'Floating Reveal Header',
    icon: 'FLT',
    behavior: {
      type: 'mainReveal',
      variant: 'floating',
      revealAfter: 120,
      transparentAtTop: true,
      shadowOnScroll: true,
    },
  },
  {
    id: 'headerMainRevealCta',
    label: 'CTA Reveal Header',
    icon: 'CTA',
    behavior: {
      type: 'mainReveal',
      variant: 'cta',
      revealAfter: 120,
      transparentAtTop: true,
      shadowOnScroll: true,
    },
  },
  {
    id: 'headerMainRevealDark',
    label: 'Dark Reveal Header',
    icon: 'DRK',
    behavior: {
      type: 'mainReveal',
      variant: 'dark',
      revealAfter: 120,
      transparentAtTop: true,
      shadowOnScroll: true,
    },
  },
];

export const HEADER_BEHAVIOR_TYPE_OPTIONS = [
  { id: 'normal', label: 'Normal' },
  { id: 'sticky', label: 'Sticky' },
  { id: 'fixed', label: 'Fixed' },
  { id: 'revealOnScroll', label: 'Reveal on scroll' },
  { id: 'mainReveal', label: 'Main + reveal' },
];

export const HEADER_BEHAVIOR_VARIANT_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'compact', label: 'Compact' },
  { id: 'glass', label: 'Glass' },
  { id: 'floating', label: 'Floating' },
  { id: 'cta', label: 'CTA focus' },
  { id: 'dark', label: 'Dark' },
];

const VALID_TYPES = new Set(HEADER_BEHAVIOR_TYPE_OPTIONS.map((o) => o.id));
const VALID_VARIANTS = new Set(HEADER_BEHAVIOR_VARIANT_OPTIONS.map((o) => o.id));

/**
 * @param {unknown} raw
 * @param {object} [fallback]
 */
export function normalizeHeaderBehavior(raw, fallback = DEFAULT_HEADER_BEHAVIOR) {
  const base = { ...DEFAULT_HEADER_BEHAVIOR, ...fallback };
  const b = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const type = VALID_TYPES.has(String(b.type || '')) ? String(b.type) : base.type;
  const variant = VALID_VARIANTS.has(String(b.variant || '')) ? String(b.variant) : base.variant;
  const revealAfter = Math.max(0, Math.min(2000, Math.round(Number(b.revealAfter ?? base.revealAfter) || 120)));
  return {
    type,
    variant,
    revealAfter,
    transparentAtTop: Boolean(b.transparentAtTop ?? base.transparentAtTop),
    shadowOnScroll: b.shadowOnScroll !== false,
    shrinkOnScroll: Boolean(b.shrinkOnScroll ?? base.shrinkOnScroll),
    ...(b.role === 'main' || b.role === 'reveal' ? { role: b.role } : {}),
  };
}

/** @param {object} meta */
export function resolveHeaderBehaviorFromMeta(meta) {
  if (!meta || typeof meta !== 'object') return null;
  if (!meta.isHeader && meta.role !== 'header') return null;
  const hb = meta.headerBehavior;
  if (!hb || typeof hb !== 'object') return normalizeHeaderBehavior(null);
  return normalizeHeaderBehavior(hb);
}

/** @param {ReturnType<typeof normalizeHeaderBehavior>} behavior */
export function headerBehaviorDataAttrs(behavior) {
  if (!behavior) return {};
  const attrs = {
    'data-header-behavior-type': behavior.type,
    'data-header-behavior-variant': behavior.variant,
    'data-header-reveal-after': String(behavior.revealAfter),
  };
  if (behavior.role === 'main' || behavior.role === 'reveal') {
    attrs['data-header-behavior-role'] = behavior.role;
  }
  if (behavior.transparentAtTop) attrs['data-header-transparent-top'] = 'true';
  if (behavior.shadowOnScroll) attrs['data-header-shadow-on-scroll'] = 'true';
  if (behavior.shrinkOnScroll) attrs['data-header-shrink-on-scroll'] = 'true';
  return attrs;
}

/** @param {ReturnType<typeof normalizeHeaderBehavior>} behavior */
export function headerBehaviorCssClasses(behavior) {
  if (!behavior || behavior.type === 'normal') return 'live-header-behavior live-header-behavior--normal';
  const parts = [
    'live-header-behavior',
    `live-header-behavior--${behavior.type}`,
    `live-header-behavior--variant-${behavior.variant}`,
  ];
  if (behavior.role) parts.push(`live-header-behavior--role-${behavior.role}`);
  return parts.join(' ');
}

/**
 * @param {object} rowTemplate — from buildHeaderSectionTree
 * @param {object} behavior
 * @param {{ role?: 'main'|'reveal', displayNameSuffix?: string }} [opts]
 */
export function applyHeaderBehaviorToRowTree(rowTemplate, behavior, opts = {}) {
  const hb = normalizeHeaderBehavior({ ...behavior, ...(opts.role ? { role: opts.role } : {}) });
  const meta = {
    ...(rowTemplate.props?.meta || {}),
    isHeader: true,
    role: 'header',
    headerBehavior: hb,
  };
  const style = rowTemplate.style_json && typeof rowTemplate.style_json === 'object' ? rowTemplate.style_json : {};
  const desktop = { ...(style.desktop || {}) };
  const layout = { ...(desktop.layout || {}) };
  const spacing = { ...(desktop.spacing || {}) };
  const background = { ...(desktop.background || {}) };
  const effects = { ...(desktop.effects || {}) };
  const size = { ...(desktop.size || {}) };

  if (hb.type === 'sticky') {
    layout.position = 'sticky';
    layout.top = '0';
    layout.zIndex = '5000';
    background.backgroundColor = background.backgroundColor || 'var(--color-surface, var(--token-bg-surface))';
    effects.boxShadow = effects.boxShadow || '0 1px 0 color-mix(in srgb, var(--color-text) 8%, transparent)';
  } else if (hb.type === 'fixed') {
    layout.position = 'fixed';
    layout.top = '0';
    layout.left = '0';
    layout.right = '0';
    layout.width = '100%';
    layout.zIndex = '5000';
    background.backgroundColor = background.backgroundColor || 'var(--color-surface, var(--token-bg-surface))';
    effects.boxShadow = effects.boxShadow || '0 8px 24px color-mix(in srgb, var(--color-text) 10%, transparent)';
  } else if (hb.type === 'revealOnScroll') {
    layout.position = 'fixed';
    layout.top = '0';
    layout.left = '0';
    layout.right = '0';
    layout.width = '100%';
    layout.zIndex = '5000';
    background.backgroundColor = background.backgroundColor || 'var(--color-surface, var(--token-bg-surface))';
  } else if (hb.type === 'mainReveal' && hb.role === 'main') {
    /* Legacy two-row “main” partner — keep for old pages; prefer single-row mainReveal below. */
    layout.position = 'absolute';
    layout.top = '0';
    layout.left = '0';
    layout.right = '0';
    layout.width = '100%';
    layout.zIndex = '40';
    background.backgroundColor = 'transparent';
    effects.boxShadow = 'none';
    hb.transparentAtTop = true;
    meta.headerBehavior = { ...hb, transparentAtTop: true };
  } else if (hb.type === 'mainReveal' && hb.role === 'reveal') {
    layout.position = 'fixed';
    layout.top = '0';
    layout.left = '0';
    layout.right = '0';
    layout.width = '100%';
    layout.zIndex = '5000';
    if (hb.variant === 'compact') {
      spacing.padding = '8px 20px';
      size.minHeight = '56px';
      hb.shrinkOnScroll = true;
      meta.headerBehavior = { ...hb, shrinkOnScroll: true };
    }
    if (hb.variant === 'dark') {
      background.backgroundColor = 'var(--token-bg-inverse, color-mix(in srgb, var(--color-text) 92%, #000))';
    }
  } else if (hb.type === 'mainReveal') {
    layout.position = 'fixed';
    layout.top = '0';
    layout.left = '0';
    layout.right = '0';
    layout.width = '100%';
    layout.zIndex = '5000';
    background.backgroundColor = 'transparent';
    effects.boxShadow = 'none';
    hb.transparentAtTop = true;
    meta.headerBehavior = { ...hb, transparentAtTop: true };
    if (hb.variant === 'compact') {
      meta.headerBehavior = { ...meta.headerBehavior, shrinkOnScroll: true };
    }
  }

  const suffix = opts.displayNameSuffix ? ` (${opts.displayNameSuffix})` : '';
  return {
    ...rowTemplate,
    displayName: `${rowTemplate.displayName || 'Header'}${suffix}`,
    props: {
      ...(rowTemplate.props || {}),
      meta,
    },
    style_json: {
      ...style,
      desktop: {
        ...desktop,
        layout,
        spacing,
        background,
        effects,
        size,
      },
    },
  };
}

/** @param {string} starterId */
export function getHeaderStarterCard(starterId) {
  return HEADER_STARTER_CARDS.find((c) => c.id === starterId) || null;
}

/** @param {string} starterId */
export function buildHeaderStarterRoots(starterId, buildHeaderSectionTree) {
  const card = getHeaderStarterCard(starterId);
  if (!card || typeof buildHeaderSectionTree !== 'function') return [];
  const base = buildHeaderSectionTree('spread');
  return [applyHeaderBehaviorToRowTree(base, card.behavior)];
}

/**
 * Patch meta.headerBehavior and optional row layout for inspector updates.
 * @param {object} prevMeta
 * @param {Partial<object>} patch
 */
export function headerBehaviorMetaPatch(prevMeta = {}, patch = {}) {
  const prev = normalizeHeaderBehavior(prevMeta.headerBehavior);
  const next = normalizeHeaderBehavior({ ...prev, ...patch });
  return {
    ...prevMeta,
    isHeader: true,
    role: prevMeta.role || 'header',
    headerBehavior: next,
  };
}
