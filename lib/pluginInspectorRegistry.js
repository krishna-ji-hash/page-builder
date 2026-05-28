/**
 * Lightweight plugin registry for inspector extensions.
 *
 * - No runtime DOM mutations
 * - No coupling to renderTree
 * - Safe in both builder + server environments
 */

const REGISTRY = {
  capabilityExtensions: [],
  inspectorPanels: [],
};

export function registerCapabilityExtension(fn) {
  if (typeof fn !== 'function') return () => {};
  REGISTRY.capabilityExtensions.push(fn);
  return () => {
    const idx = REGISTRY.capabilityExtensions.indexOf(fn);
    if (idx >= 0) REGISTRY.capabilityExtensions.splice(idx, 1);
  };
}

/**
 * Register a custom inspector panel.
 * @param {{id:string, tabId:string, shouldRender?:(node,ctx)=>boolean, render:(props)=>any}} panel
 */
export function registerInspectorPanel(panel) {
  if (!panel || typeof panel !== 'object') return () => {};
  if (!panel.id || !panel.tabId || typeof panel.render !== 'function') return () => {};
  REGISTRY.inspectorPanels.push(panel);
  return () => {
    const idx = REGISTRY.inspectorPanels.indexOf(panel);
    if (idx >= 0) REGISTRY.inspectorPanels.splice(idx, 1);
  };
}

export function getInspectorExtensions() {
  return REGISTRY;
}

