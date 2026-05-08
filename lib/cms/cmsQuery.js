function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export const CMS_FILTER_OPS = /** @type {const} */ ([
  'eq',
  'neq',
  'contains',
  'starts_with',
  'ends_with',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'in',
  'has_any',
]);

function safeOp(op) {
  const o = String(op || '').trim();
  return CMS_FILTER_OPS.includes(o) ? o : null;
}

function safeField(field) {
  const f = String(field || '').trim();
  // Allowed: title, slug, or data.<fieldId>
  if (f === 'title' || f === 'slug') return f;
  if (f.startsWith('data.')) {
    const id = f.slice('data.'.length);
    if (!id) return null;
    // conservative: field ids are slug-like
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return null;
    return `data.${id}`;
  }
  return null;
}

function normalizeRule(rule) {
  const r = isPlainObject(rule) ? rule : {};
  const field = safeField(r.field);
  const op = safeOp(r.op);
  if (!field || !op) return null;
  const value = r.value;
  return { field, op, value };
}

function normalizeGroup(group) {
  const g = isPlainObject(group) ? group : {};
  const combinator = g.combinator === 'or' ? 'or' : 'and';
  const rulesRaw = Array.isArray(g.rules) ? g.rules : [];
  const rules = rulesRaw.map(normalizeRule).filter(Boolean);
  const groupsRaw = Array.isArray(g.groups) ? g.groups : [];
  const groups = groupsRaw.map(normalizeGroup).filter(Boolean);
  if (!rules.length && !groups.length) return null;
  return { combinator, rules, groups };
}

export function normalizeCmsRepeatQuery(raw) {
  const q = isPlainObject(raw) ? raw : {};
  const limit = clamp(Number(q.limit ?? 0) || 0, 0, 200);
  const offset = clamp(Number(q.offset ?? 0) || 0, 0, 100000);
  const pageSize = clamp(Number(q.pageSize ?? 0) || 0, 0, 200);
  const page = clamp(Number(q.page ?? 1) || 1, 1, 100000);
  const sortBy = typeof q.sortBy === 'string' && q.sortBy ? q.sortBy : 'published_at';
  const sortDir = q.sortDir === 'asc' ? 'asc' : 'desc';
  const status = q.status === 'draft' ? 'draft' : 'published';
  const featuredOnly = Boolean(q.featuredOnly);
  const preset = typeof q.preset === 'string' ? q.preset : '';
  const filterGroup = normalizeGroup(q.filterGroup) || null;
  const byCategory = typeof q.byCategory === 'string' ? q.byCategory.trim() : '';
  const byTag = typeof q.byTag === 'string' ? q.byTag.trim() : '';
  const randomSeed = typeof q.randomSeed === 'string' ? q.randomSeed.trim().slice(0, 40) : '';

  return {
    limit,
    offset,
    pageSize,
    page,
    sortBy,
    sortDir,
    status,
    featuredOnly,
    preset,
    filterGroup,
    byCategory,
    byTag,
    randomSeed,
  };
}

