/**
 * Copy navigation links from the site home page header onto the global header snapshot.
 * Home page header is the source of truth — inner pages merge the frozen global shell with home URLs.
 */

function normalizeLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isPlaceholderNavTo(value) {
  const s = String(value ?? '').trim();
  return !s || s === '#';
}

function deepClone(value) {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function menuPathKey(path, label) {
  const seg = normalizeLabel(label);
  if (!seg) return path;
  return path ? `${path}>${seg}` : seg;
}

/**
 * @param {unknown[]} items
 * @param {Map<string, { to: string, target?: string }>} out
 * @param {string} [path]
 */
function collectMenuNavMap(items, out, path = '') {
  for (const item of items || []) {
    if (!item || typeof item !== 'object') continue;
    const key = menuPathKey(path, item.label);
    const to = item.to ?? item.href;
    if (!isPlaceholderNavTo(to)) {
      out.set(key, { to: String(to).trim(), target: item.target || '' });
    }
    if (Array.isArray(item.children) && item.children.length) {
      collectMenuNavMap(item.children, out, key);
    }
    const featuredTo = item.mega?.featured?.to;
    if (!isPlaceholderNavTo(featuredTo)) {
      out.set(`${key}>__featured__`, { to: String(featuredTo).trim() });
    }
  }
}

/**
 * @param {unknown} headerRow
 * @returns {Map<string, { to: string, target?: string }>}
 */
export function extractHeaderNavMap(headerRow) {
  const map = new Map();
  if (!headerRow) return map;

  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (!node || typeof node !== 'object') continue;
      const type = node.nodeType || node.node_type;
      if (type === 'menu') {
        collectMenuNavMap(node.props?.items, map);
      }
      if (type === 'button') {
        const label = normalizeLabel(node.props?.text || node.displayName || node.display_name);
        const href = node.props?.href;
        if (label && !isPlaceholderNavTo(href)) {
          map.set(`button:${label}`, { to: String(href).trim() });
        }
      }
      if (type === 'image' || type === 'logo_block') {
        const props = node.props && typeof node.props === 'object' ? node.props : {};
        const link = props.logoLink || props.href || props.logo?.link;
        if (!isPlaceholderNavTo(link)) {
          map.set('__logo__', { to: String(link).trim() });
        }
      }
      if (Array.isArray(node.children) && node.children.length) walk(node.children);
    }
  };

  walk([headerRow]);
  return map;
}

function applyMenuNavMap(items, navMap, path = '') {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const key = menuPathKey(path, item.label);
    const patch = navMap.get(key);
    const next = { ...item };
    if (patch?.to) {
      next.to = patch.to;
      if ('href' in next) next.href = patch.to;
      if (patch.target === '_blank') next.target = '_blank';
      else if (patch.target === '') delete next.target;
    }
    if (Array.isArray(item.children) && item.children.length) {
      next.children = applyMenuNavMap(item.children, navMap, key);
    }
    const featuredPatch = navMap.get(`${key}>__featured__`);
    if (featuredPatch?.to && next.mega?.featured) {
      next.mega = {
        ...next.mega,
        featured: { ...next.mega.featured, to: featuredPatch.to },
      };
    }
    return next;
  });
}

function applyNavMapToTree(nodes, navMap) {
  if (!Array.isArray(nodes) || !navMap.size) return nodes;
  return nodes.map((node) => {
    if (!node || typeof node !== 'object') return node;
    const type = node.nodeType || node.node_type;
    let next = node;
    if (type === 'menu') {
      const items = applyMenuNavMap(node.props?.items, navMap);
      next = { ...node, props: { ...(node.props || {}), items } };
    }
    if (type === 'button') {
      const label = normalizeLabel(node.props?.text || node.displayName || node.display_name);
      const patch = navMap.get(`button:${label}`);
      if (patch?.to) {
        next = { ...node, props: { ...(node.props || {}), href: patch.to } };
      }
    }
    if (type === 'image' || type === 'logo_block') {
      const logoPatch = navMap.get('__logo__');
      if (logoPatch?.to) {
        const props = { ...(node.props || {}) };
        props.logoLink = logoPatch.to;
        props.href = logoPatch.to;
        if (props.logo && typeof props.logo === 'object') {
          props.logo = { ...props.logo, link: logoPatch.to };
        }
        next = { ...node, props };
      }
    }
    if (Array.isArray(node.children) && node.children.length) {
      next = { ...next, children: applyNavMapToTree(node.children, navMap) };
    }
    return next;
  });
}

/**
 * @param {unknown} globalHeaderRow
 * @param {unknown} homeHeaderRow
 * @returns {unknown|null}
 */
export function applyHomeHeaderNavToGlobal(globalHeaderRow, homeHeaderRow) {
  if (!globalHeaderRow || !homeHeaderRow) return globalHeaderRow ?? null;
  const navMap = extractHeaderNavMap(homeHeaderRow);
  if (!navMap.size) return globalHeaderRow;
  const cloned = deepClone(globalHeaderRow);
  return applyNavMapToTree([cloned], navMap)[0] ?? globalHeaderRow;
}

/**
 * @param {unknown[]} pageRootNodes
 * @param {unknown} homeHeaderRow
 * @param {string} pageSlug
 */
export function syncPageTreeHeaderNavFromHome(pageRootNodes, homeHeaderRow, pageSlug) {
  if (!homeHeaderRow || pageSlug === 'home' || !Array.isArray(pageRootNodes)) return pageRootNodes;
  return pageRootNodes.map((node) => {
    if (
      node &&
      (node.nodeType === 'row' || node.node_type === 'row') &&
      (node.meta?.isHeader === true ||
        node.props?.meta?.isHeader === true ||
        String(node.props?.meta?.role || node.meta?.role || '').toLowerCase() === 'header')
    ) {
      return applyHomeHeaderNavToGlobal(node, homeHeaderRow);
    }
    return node;
  });
}

/**
 * @param {unknown[]} pageRootNodes
 */
export function findPageHeaderRow(pageRootNodes) {
  const roots = Array.isArray(pageRootNodes) ? pageRootNodes : [];
  return (
    roots.find(
      (node) =>
        node &&
        (node.nodeType === 'row' || node.node_type === 'row') &&
        (node.meta?.isHeader === true ||
          node.props?.meta?.isHeader === true ||
          String(node.props?.meta?.role || node.meta?.role || '').toLowerCase() === 'header')
    ) || null
  );
}
