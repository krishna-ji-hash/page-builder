/**
 * Inline data:image URLs bloat bulk saves — upload to media or strip on sync.
 */

/** @param {unknown} value */
export function isDataImageUrl(value) {
  return typeof value === 'string' && /^data:image\//i.test(value.trim());
}

const TAB_IMAGE_KEYS = ['imageSrc', 'image'];

/**
 * Slim tab panel image fields for bulk save (omit base64; server merges URLs from DB).
 * @param {Record<string, unknown>} tab
 */
export function slimFeatureTabPanelForBulkSave(tab) {
  if (!tab || typeof tab !== 'object') return tab;
  const next = { ...tab };
  for (const key of TAB_IMAGE_KEYS) {
    if (isDataImageUrl(next[key])) delete next[key];
  }
  return next;
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 * @param {string} [nodeType]
 */
export function slimNodePropsForBulkSave(props, nodeType) {
  if (!props || typeof props !== 'object') return props;
  if (nodeType === 'tabs' && Array.isArray(props.tabs)) {
    return {
      ...props,
      tabs: props.tabs.map((t) => slimFeatureTabPanelForBulkSave(t)),
    };
  }
  if (nodeType === 'tab_hero' && Array.isArray(props.panels)) {
    return {
      ...props,
      panels: props.panels.map((t) => slimFeatureTabPanelForBulkSave(t)),
    };
  }
  if (nodeType === 'carousel' && Array.isArray(props.slides)) {
    return {
      ...props,
      slides: props.slides.map((slide) => {
        if (!slide || typeof slide !== 'object') return slide;
        const next = { ...slide };
        for (const key of TAB_IMAGE_KEYS) {
          if (isDataImageUrl(next[key])) delete next[key];
        }
        return next;
      }),
    };
  }
  if (nodeType === 'image' && isDataImageUrl(props.src)) {
    const { src: _src, ...rest } = props;
    return rest;
  }
  const serialized = JSON.stringify(props);
  if (serialized.length > 120_000 && /data:image\//i.test(serialized)) {
    return undefined;
  }
  return props;
}

/**
 * Deep-merge feature tabs on bulk persist — keep stored media URLs when client omits base64.
 * @param {Record<string, unknown>} incomingProps
 * @param {Record<string, unknown>} existingProps
 */
export function mergeFeatureTabsPropsForBulkPersist(incomingProps, existingProps) {
  const inc = incomingProps && typeof incomingProps === 'object' ? incomingProps : {};
  const ex = existingProps && typeof existingProps === 'object' ? existingProps : {};
  const incTabs = Array.isArray(inc.tabs) ? inc.tabs : null;
  if (!incTabs) return { ...ex, ...inc };

  const exTabs = Array.isArray(ex.tabs) ? ex.tabs : [];
  const exById = new Map(exTabs.filter((t) => t?.id).map((t) => [String(t.id), t]));

  const mergedTabs = incTabs.map((incTab) => {
    const id = String(incTab?.id || '');
    const exTab = exById.get(id) || {};
    const next = { ...exTab, ...incTab };
    for (const key of TAB_IMAGE_KEYS) {
      const incVal = next[key];
      const exVal = exTab[key];
      if (!incVal || isDataImageUrl(incVal)) {
        if (exVal && !isDataImageUrl(exVal)) next[key] = exVal;
      } else if (isDataImageUrl(incVal) && exVal && !isDataImageUrl(exVal)) {
        next[key] = exVal;
      }
    }
    return next;
  });

  return { ...ex, ...inc, tabs: mergedTabs };
}

/**
 * Deep-merge tab hero panels on bulk persist — keep stored media URLs when client omits base64.
 * @param {Record<string, unknown>} incomingProps
 * @param {Record<string, unknown>} existingProps
 */
export function mergeTabHeroPropsForBulkPersist(incomingProps, existingProps) {
  const inc = incomingProps && typeof incomingProps === 'object' ? incomingProps : {};
  const ex = existingProps && typeof existingProps === 'object' ? existingProps : {};
  const incPanels = Array.isArray(inc.panels) ? inc.panels : null;
  if (!incPanels) return { ...ex, ...inc };

  const exPanels = Array.isArray(ex.panels) ? ex.panels : [];
  const exById = new Map(exPanels.filter((p) => p?.id).map((p) => [String(p.id), p]));

  const mergedPanels = incPanels.map((incPanel) => {
    const id = String(incPanel?.id || '');
    const exPanel = exById.get(id) || {};
    const next = { ...exPanel, ...incPanel };
    for (const key of TAB_IMAGE_KEYS) {
      const incVal = next[key];
      const exVal = exPanel[key];
      if (!incVal || isDataImageUrl(incVal)) {
        if (exVal && !isDataImageUrl(exVal)) next[key] = exVal;
      } else if (isDataImageUrl(incVal) && exVal && !isDataImageUrl(exVal)) {
        next[key] = exVal;
      }
    }
    return next;
  });

  return { ...ex, ...inc, panels: mergedPanels };
}

/**
 * @param {Record<string, unknown>} incomingProps
 * @param {Record<string, unknown>} existingProps
 */
export function mergeCarouselPropsForBulkPersist(incomingProps, existingProps) {
  const inc = incomingProps && typeof incomingProps === 'object' ? incomingProps : {};
  const ex = existingProps && typeof existingProps === 'object' ? existingProps : {};
  const incSlides = Array.isArray(inc.slides) ? inc.slides : null;
  if (!incSlides) return { ...ex, ...inc };

  const exSlides = Array.isArray(ex.slides) ? ex.slides : [];
  const exById = new Map(exSlides.filter((s) => s?.id).map((s) => [String(s.id), s]));

  const mergedSlides = incSlides.map((incSlide) => {
    const id = String(incSlide?.id || '');
    const exSlide = exById.get(id) || {};
    const next = { ...exSlide, ...incSlide };
    for (const key of TAB_IMAGE_KEYS) {
      const incVal = next[key];
      const exVal = exSlide[key];
      if (!incVal || isDataImageUrl(incVal)) {
        if (exVal && !isDataImageUrl(exVal)) next[key] = exVal;
      } else if (isDataImageUrl(incVal) && exVal && !isDataImageUrl(exVal)) {
        next[key] = exVal;
      }
    }
    return next;
  });

  return { ...ex, ...inc, slides: mergedSlides };
}

/**
 * @param {Record<string, unknown>} incomingProps
 * @param {Record<string, unknown>} existingProps
 */
export function mergeImageNodePropsForBulkPersist(incomingProps, existingProps) {
  const inc = incomingProps && typeof incomingProps === 'object' ? incomingProps : {};
  const ex = existingProps && typeof existingProps === 'object' ? existingProps : {};
  const next = { ...ex, ...inc };
  const incSrc = next.src;
  const exSrc = ex.src;
  if (!incSrc || isDataImageUrl(incSrc)) {
    if (exSrc && !isDataImageUrl(exSrc)) next.src = exSrc;
  } else if (isDataImageUrl(incSrc) && exSrc && !isDataImageUrl(exSrc)) {
    next.src = exSrc;
  }
  return next;
}

/**
 * @param {unknown[]} roots
 */
export function prepareTreeForBulkSave(roots) {
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((node) => {
      if (!node || typeof node !== 'object') return node;
      const slimProps = slimNodePropsForBulkSave(node.props, node.nodeType);
      const next = {
        ...node,
        children: walk(node.children || []),
      };
      if (slimProps === undefined) delete next.props;
      else if (slimProps !== node.props) next.props = slimProps;
      return next;
    });
  };
  return walk(roots);
}
