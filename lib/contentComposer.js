/** Section / column heading blocks — props.sectionHeading & props.columnHeading */

const SECTION_ALIGN = new Set(['left', 'center', 'right']);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);

export function normalizeSectionHeading(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const alignRaw = String(s.align || 'center').trim().toLowerCase();
  const tagRaw = String(s.tag || 'h2').trim().toLowerCase();
  const maxW = Number(s.maxWidth);
  const spacing = Number(s.spacingBottom);
  return {
    enabled: Boolean(s.enabled),
    eyebrow: String(s.eyebrow ?? '').trim(),
    heading: String(s.heading ?? '').trim(),
    description: String(s.description ?? '').trim(),
    align: SECTION_ALIGN.has(alignRaw) ? alignRaw : 'center',
    tag: HEADING_TAGS.has(tagRaw) ? tagRaw : 'h2',
    maxWidth: Number.isFinite(maxW) && maxW >= 240 ? Math.min(1400, Math.round(maxW)) : 760,
    spacingBottom:
      Number.isFinite(spacing) && spacing >= 0 ? Math.min(120, Math.round(spacing)) : 32,
  };
}

export function normalizeColumnHeading(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const alignRaw = String(c.align || 'left').trim().toLowerCase();
  const spacing = Number(c.spacingBottom);
  return {
    enabled: Boolean(c.enabled),
    heading: String(c.heading ?? '').trim(),
    description: String(c.description ?? '').trim(),
    align: SECTION_ALIGN.has(alignRaw) ? alignRaw : 'left',
    spacingBottom:
      Number.isFinite(spacing) && spacing >= 0 ? Math.min(120, Math.round(spacing)) : 20,
  };
}

export function sectionHeadingFromProps(props) {
  return normalizeSectionHeading(props?.sectionHeading);
}

export function columnHeadingFromProps(props) {
  return normalizeColumnHeading(props?.columnHeading);
}

export function sectionHeadingToStyleVars(sh) {
  const s = normalizeSectionHeading(sh);
  if (!s.enabled) return {};
  return {
    '--bld-section-heading-max-w': `${s.maxWidth}px`,
    '--bld-section-heading-spacing-bottom': `${s.spacingBottom}px`,
    '--bld-section-heading-align': s.align,
  };
}

export function columnHeadingToStyleVars(ch) {
  const c = normalizeColumnHeading(ch);
  if (!c.enabled) return {};
  return {
    '--bld-column-heading-spacing-bottom': `${c.spacingBottom}px`,
    '--bld-column-heading-align': c.align,
  };
}

export function sectionHeadingInspectorFields(props, pick) {
  const s = sectionHeadingFromProps(props);
  const p = (key, val) => (typeof pick === 'function' ? pick(key, val) : val);
  return {
    sectionHeadingEnabled: p('sectionHeadingEnabled', s.enabled),
    sectionHeadingEyebrow: p('sectionHeadingEyebrow', s.eyebrow),
    sectionHeadingHeading: p('sectionHeadingHeading', s.heading),
    sectionHeadingDescription: p('sectionHeadingDescription', s.description),
    sectionHeadingAlign: p('sectionHeadingAlign', s.align),
    sectionHeadingTag: p('sectionHeadingTag', s.tag),
    sectionHeadingMaxWidth: p('sectionHeadingMaxWidth', s.maxWidth),
    sectionHeadingSpacingBottom: p('sectionHeadingSpacingBottom', s.spacingBottom),
  };
}

export function columnHeadingInspectorFields(props, pick) {
  const c = columnHeadingFromProps(props);
  const p = (key, val) => (typeof pick === 'function' ? pick(key, val) : val);
  return {
    columnHeadingEnabled: p('columnHeadingEnabled', c.enabled),
    columnHeadingHeading: p('columnHeadingHeading', c.heading),
    columnHeadingDescription: p('columnHeadingDescription', c.description),
    columnHeadingAlign: p('columnHeadingAlign', c.align),
    columnHeadingSpacingBottom: p('columnHeadingSpacingBottom', c.spacingBottom),
  };
}

const SECTION_KEYS = new Set([
  'sectionHeadingEnabled',
  'sectionHeadingEyebrow',
  'sectionHeadingHeading',
  'sectionHeadingDescription',
  'sectionHeadingAlign',
  'sectionHeadingTag',
  'sectionHeadingMaxWidth',
  'sectionHeadingSpacingBottom',
  'sectionHeadingReset',
]);

const COLUMN_KEYS = new Set([
  'columnHeadingEnabled',
  'columnHeadingHeading',
  'columnHeadingDescription',
  'columnHeadingAlign',
  'columnHeadingSpacingBottom',
  'columnHeadingReset',
]);

export function isSectionHeadingInspectorKey(key) {
  return SECTION_KEYS.has(key);
}

export function isColumnHeadingInspectorKey(key) {
  return COLUMN_KEYS.has(key);
}

export function patchSectionHeadingFromKey(key, value, prev) {
  const prevN = normalizeSectionHeading(prev);
  const next = { ...prevN };
  if (key === 'sectionHeadingReset') {
    return normalizeSectionHeading({});
  }
  if (key === 'sectionHeadingEnabled') next.enabled = Boolean(value);
  else if (key === 'sectionHeadingEyebrow') next.eyebrow = String(value ?? '').trim();
  else if (key === 'sectionHeadingHeading') next.heading = String(value ?? '').trim();
  else if (key === 'sectionHeadingDescription') next.description = String(value ?? '').trim();
  else if (key === 'sectionHeadingAlign') {
    const a = String(value || 'center').trim().toLowerCase();
    next.align = SECTION_ALIGN.has(a) ? a : 'center';
  } else if (key === 'sectionHeadingTag') {
    const t = String(value || 'h2').trim().toLowerCase();
    next.tag = HEADING_TAGS.has(t) ? t : 'h2';
  } else if (key === 'sectionHeadingMaxWidth') {
    next.maxWidth = Math.max(240, Math.min(1400, Math.round(Number(value) || 760)));
  } else if (key === 'sectionHeadingSpacingBottom') {
    next.spacingBottom = Math.max(0, Math.min(120, Math.round(Number(value) || 32)));
  } else return null;
  return normalizeSectionHeading(next);
}

export function patchColumnHeadingFromKey(key, value, prev) {
  const prevN = normalizeColumnHeading(prev);
  const next = { ...prevN };
  if (key === 'columnHeadingReset') {
    return normalizeColumnHeading({});
  }
  if (key === 'columnHeadingEnabled') next.enabled = Boolean(value);
  else if (key === 'columnHeadingHeading') next.heading = String(value ?? '').trim();
  else if (key === 'columnHeadingDescription') next.description = String(value ?? '').trim();
  else if (key === 'columnHeadingAlign') {
    const a = String(value || 'left').trim().toLowerCase();
    next.align = SECTION_ALIGN.has(a) ? a : 'left';
  } else if (key === 'columnHeadingSpacingBottom') {
    next.spacingBottom = Math.max(0, Math.min(120, Math.round(Number(value) || 20)));
  } else return null;
  return normalizeColumnHeading(next);
}
