function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function getByPath(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!isPlainObject(cur) && !Array.isArray(cur)) return undefined;
    cur = cur?.[p];
  }
  return cur;
}

function coerceBindingValue(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  // Avoid injecting objects into strings.
  return '';
}

/**
 * Replace `{{field}}` / `{{sys.slug}}` style bindings in a string.
 * Single-pass only to prevent recursive bindings.
 */
export function applyBindingsToString(str, context) {
  if (typeof str !== 'string' || !str.includes('{{')) return str;
  const ctx = isPlainObject(context) ? context : {};
  return str.replace(/\{\{\s*([a-zA-Z0-9_.$-]+)\s*\}\}/g, (_m, rawPath) => {
    const path = String(rawPath || '').trim();
    if (!path) return '';
    const v = getByPath(ctx, path);
    return coerceBindingValue(v);
  });
}

export function applyBindingsToAny(value, context) {
  if (typeof value === 'string') return applyBindingsToString(value, context);
  if (Array.isArray(value)) return value.map((v) => applyBindingsToAny(v, context));
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = applyBindingsToAny(v, context);
    return out;
  }
  return value;
}

/**
 * Traverse node tree and apply bindings to node props (string fields),
 * including rich_text `content`.
 */
export function applyBindingsToTree(nodes, context) {
  const walk = (n) => {
    if (!n || typeof n !== 'object') return n;
    const props = isPlainObject(n.props) ? n.props : {};
    const nextProps = applyBindingsToAny(props, context);
    const kids = Array.isArray(n.children) ? n.children.map(walk) : [];
    return { ...n, props: nextProps, children: kids };
  };
  return Array.isArray(nodes) ? nodes.map(walk) : [];
}

