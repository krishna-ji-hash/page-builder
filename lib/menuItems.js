/**
 * Advanced menu item normalization/safety (used by runtime + builder).
 *
 * Schema (props.items):
 * {
 *   id, label, to, target, children: [], icon, description,
 *   kind?: 'link'|'group',
 *   dropdown?: boolean,
 *   mega?: { enabled?: boolean, columns?: number, featured?: { label, description, to } }
 * }
 */

const MAX_DEPTH = 4;
const MAX_ITEMS = 200;

function safeId(v, fallback) {
  const s = typeof v === 'string' ? v : v == null ? '' : String(v);
  const cleaned = s.trim().slice(0, 64).replace(/[^A-Za-z0-9_-]/g, '');
  return cleaned || fallback;
}

function safeText(v, fallback = '') {
  if (typeof v !== 'string') return fallback;
  return v.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function safeDescription(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function safeTarget(v) {
  const t = typeof v === 'string' ? v.trim() : '';
  return t === '_blank' ? '_blank' : '';
}

function safeTo(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return '#';
  // allow in-page anchors, relative paths, and http(s)
  if (s.startsWith('#')) return s.slice(0, 200);
  if (s.startsWith('/')) return s.slice(0, 200);
  if (s.startsWith('http://') || s.startsWith('https://')) return s.slice(0, 300);
  return '#';
}

function safeIcon(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return '';
  // icon is just a token/name; no svg/html allowed
  return s.slice(0, 40).replace(/[^A-Za-z0-9_-]/g, '');
}

function safeItemTextStyle(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const colorRaw = typeof v.color === 'string' ? v.color.trim() : '';
  const color =
    colorRaw && colorRaw.length <= 40 && !/[<>;]/.test(colorRaw) ? colorRaw : '';
  const underline = Boolean(v.underline);
  const noWrap = Boolean(v.noWrap);
  const italic = Boolean(v.italic);
  const fwRaw = Number(v.fontWeight);
  const fontWeight = Number.isFinite(fwRaw) ? Math.max(100, Math.min(900, Math.round(fwRaw / 100) * 100)) : 0;
  if (!color && !underline && !noWrap && !italic && !fontWeight) return null;
  return { color, underline, noWrap, italic, fontWeight };
}

function safeMega(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const enabled = Boolean(v.enabled);
  const columnsRaw = Number(v.columns);
  const columns = Number.isFinite(columnsRaw) ? Math.max(1, Math.min(6, Math.round(columnsRaw))) : 2;
  const featured = v.featured && typeof v.featured === 'object' && !Array.isArray(v.featured) ? v.featured : null;
  const safeFeatured = featured
    ? {
        label: safeText(featured.label, ''),
        description: safeDescription(featured.description),
        to: safeTo(featured.to),
      }
    : null;
  return { enabled, columns, featured: safeFeatured };
}

function normalizeItem(raw, depth, pathIds, index) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = safeId(raw.id, `item-${depth}-${index}`);
  if (pathIds.has(id)) {
    // prevent recursion by cutting children
    return {
      id,
      label: safeText(raw.label, `Item ${index + 1}`),
      to: safeTo(raw.to ?? raw.href),
      target: safeTarget(raw.target),
      icon: safeIcon(raw.icon),
      description: safeDescription(raw.description),
      children: [],
      dropdown: false,
      mega: null,
      kind: 'link',
    };
  }

  const label = safeText(raw.label, `Item ${index + 1}`);
  const to = safeTo(raw.to ?? raw.href);
  const target = safeTarget(raw.target);
  const icon = safeIcon(raw.icon);
  const description = safeDescription(raw.description);
  const textStyle = safeItemTextStyle(raw.textStyle);
  const dropdown = Boolean(raw.dropdown) || (Array.isArray(raw.children) && raw.children.length > 0);
  const mega = safeMega(raw.mega);
  const kind = raw.kind === 'group' ? 'group' : 'link';

  const childrenRaw = Array.isArray(raw.children) ? raw.children : [];
  const children =
    depth >= MAX_DEPTH
      ? []
      : childrenRaw
          .slice(0, MAX_ITEMS)
          .map((c, i) => normalizeItem(c, depth + 1, new Set([...pathIds, id]), i))
          .filter(Boolean);

  return {
    id,
    label,
    to,
    target,
    icon,
    description,
    textStyle,
    children,
    dropdown,
    mega,
    kind,
  };
}

/**
 * @param {unknown} rawItems
 * @returns {{ items: any[], warnings: string[] }}
 */
export function normalizeMenuItems(rawItems) {
  const warnings = [];
  if (!Array.isArray(rawItems)) return { items: [], warnings: ['items_not_array'] };
  const items = rawItems
    .slice(0, MAX_ITEMS)
    .map((it, i) => normalizeItem(it, 1, new Set(), i))
    .filter(Boolean);
  if (rawItems.length > MAX_ITEMS) warnings.push('items_truncated');
  return { items, warnings };
}

export function isActiveMenuTo(to, currentPath) {
  if (typeof to !== 'string' || typeof currentPath !== 'string') return false;
  if (!to || to === '#') return false;
  if (to.startsWith('http://') || to.startsWith('https://')) return false;
  if (to.startsWith('#')) return false;
  const norm = (s) => (s || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return norm(to) === norm(currentPath);
}

