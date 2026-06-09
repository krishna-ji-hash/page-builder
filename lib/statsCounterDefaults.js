/** Default stats counter items — three-column impact metrics. */

export const DEFAULT_STATS_COUNTER_ITEMS = [
  { id: 'stat-1', value: 500, suffix: '+', label: 'Carrier Partners' },
  { id: 'stat-2', value: 75, suffix: '+', label: 'Communication Gateways' },
  { id: 'stat-3', value: 50, suffix: '+', label: 'Platforms, OMS & WMS' },
];

/**
 * @param {unknown} item
 * @param {number} index
 */
export function normalizeStatsCounterItem(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  const id = String(t.id || `stat-${index + 1}`).trim() || `stat-${index + 1}`;
  const display = String(t.display ?? '').trim();
  const rawValue = t.value ?? t.number ?? display;
  const suffix = String(t.suffix ?? '').trim();
  const prefix = String(t.prefix ?? '').trim();
  const label = String(t.label ?? t.title ?? `Stat ${index + 1}`).trim();
  const numericMatch = String(rawValue ?? '')
    .trim()
    .match(/^([\d.]+)/);
  const numericValue = numericMatch ? Number(numericMatch[1]) : null;
  const decimals =
    typeof t.decimals === 'number'
      ? Math.max(0, t.decimals)
      : numericValue != null && String(numericValue).includes('.')
        ? 1
        : 0;

  return {
    id,
    value: numericValue != null ? numericValue : String(rawValue ?? '0').trim(),
    suffix,
    prefix,
    label,
    display: display || undefined,
    decimals,
    numericValue: Number.isFinite(numericValue) ? numericValue : null,
  };
}

/**
 * @param {unknown} items
 */
export function normalizeStatsCounterItems(items) {
  if (!Array.isArray(items)) {
    return DEFAULT_STATS_COUNTER_ITEMS.map((item, i) => normalizeStatsCounterItem(item, i));
  }
  const out = items.filter((x) => x && typeof x === 'object').map((item, i) => normalizeStatsCounterItem(item, i));
  return out.length ? out : DEFAULT_STATS_COUNTER_ITEMS.map((item, i) => normalizeStatsCounterItem(item, i));
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 */
export function resolveStatsCounterProps(props) {
  const p = props && typeof props === 'object' ? props : {};
  const items = normalizeStatsCounterItems(p.items);
  const animate = p.animate !== false;
  const gapPxRaw = Number(p.gapPx);
  const gapPx = Number.isFinite(gapPxRaw) && gapPxRaw >= 0 ? Math.round(gapPxRaw) : null;
  return { items, animate, gapPx };
}

/**
 * @param {unknown[]} items
 * @param {number} index
 * @param {string} field
 * @param {unknown} value
 */
export function patchStatsCounterItem(items, index, field, value) {
  const list = Array.isArray(items) ? items.map((item, i) => normalizeStatsCounterItem(item, i)) : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
  const key = String(field || '').trim();
  if (!key) return list;
  return list.map((item, i) => (i === index ? { ...item, [key]: value } : item));
}

/** Combined display string for canvas inline edit (prefix + value + suffix). */
export function formatStatDisplayValue(item) {
  const prefix = String(item?.prefix ?? '').trim();
  const suffix = String(item?.suffix ?? '').trim();
  const value = item?.value ?? '';
  return `${prefix}${value}${suffix}`;
}

/**
 * Parse canvas value edit into prefix / numeric value / suffix.
 * @param {unknown} raw
 */
export function parseStatDisplayValue(raw) {
  const s = String(raw ?? '').trim();
  const match = s.match(/^([^\d]*?)([\d.]+)(.*)$/);
  if (match) {
    return {
      prefix: match[1] || '',
      value: match[2],
      suffix: match[3] || '',
    };
  }
  return { prefix: '', value: s, suffix: '' };
}

/**
 * @param {unknown[]} items
 * @param {number} index
 * @param {Record<string, unknown>} patch
 */
export function patchStatsCounterItemFields(items, index, patch) {
  if (!patch || typeof patch !== 'object') return items;
  let list = Array.isArray(items) ? items.map((item, i) => normalizeStatsCounterItem(item, i)) : [];
  for (const [field, value] of Object.entries(patch)) {
    list = patchStatsCounterItem(list, index, field, value);
  }
  return list;
}

/**
 * @param {unknown[]} items
 */
export function appendStatsCounterItem(items) {
  const list = Array.isArray(items) ? items.map((item, i) => normalizeStatsCounterItem(item, i)) : [];
  const nextIndex = list.length + 1;
  return [
    ...list,
    normalizeStatsCounterItem(
      { id: `stat-${nextIndex}`, value: 100, suffix: '+', label: `Stat ${nextIndex}` },
      list.length
    ),
  ];
}

/**
 * @param {unknown[]} items
 * @param {number} index
 */
export function removeStatsCounterItemAt(items, index) {
  const list = Array.isArray(items) ? items.map((item, i) => normalizeStatsCounterItem(item, i)) : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || list.length <= 1) return list;
  return list.filter((_, i) => i !== index);
}
