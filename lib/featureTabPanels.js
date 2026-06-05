/**
 * Feature tabs — per-tab panel stacks (section-wise layout built from elements).
 */

import { resolveFeatureTabsProps } from './featureTabsDefaults.js';

export const FEATURE_TAB_PANEL_META_KEY = 'featureTabPanelId';

/** @param {object | null | undefined} node */
export function getFeatureTabPanelId(node) {
  const meta = node?.props?.meta;
  if (!meta || typeof meta !== 'object') return '';
  return String(meta[FEATURE_TAB_PANEL_META_KEY] || meta.featureTabPanelId || '').trim();
}

/** @param {Record<string, unknown> | null | undefined} props */
export function isFeatureTabsElementPanelMode(props) {
  return String(props?.panelMode || 'fields').trim() === 'elements';
}

/** @param {object | null | undefined} tabsNode */
export function listFeatureTabPanelStacks(tabsNode) {
  return (tabsNode?.children || []).filter((c) => c?.nodeType === 'stack');
}

/**
 * @param {object | null | undefined} tabsNode
 * @param {string} tabId
 */
export function findFeatureTabPanelStack(tabsNode, tabId) {
  const id = String(tabId || '').trim();
  if (!id) return null;
  return listFeatureTabPanelStacks(tabsNode).find((s) => getFeatureTabPanelId(s) === id) || null;
}

/** @param {string} tabId */
export function featureTabPanelStackProps(tabId) {
  return {
    meta: { [FEATURE_TAB_PANEL_META_KEY]: String(tabId || '').trim() },
  };
}

/**
 * @param {object | null | undefined} tabsNode
 * @param {string[]} tabIds
 * @returns {string[]} tab ids still missing a panel stack
 */
export function featureTabIdsMissingPanelStacks(tabsNode, tabIds) {
  const stacks = listFeatureTabPanelStacks(tabsNode);
  const have = new Set(stacks.map((s) => getFeatureTabPanelId(s)).filter(Boolean));
  return (Array.isArray(tabIds) ? tabIds : []).filter((id) => id && !have.has(id));
}

/**
 * Active tab panel id from the visible tabpanel (builder canvas may lead saved props).
 * @param {ParentNode | null | undefined} shell
 * @param {Record<string, unknown> | null | undefined} tabsProps
 */
export function resolveActiveFeatureTabPanelIdFromDom(shell, tabsProps) {
  const { tabs, activeTabId } = resolveFeatureTabsProps(tabsProps);
  const fallback = String(activeTabId || tabs[0]?.id || '').trim();
  if (!shell || typeof shell.querySelector !== 'function') return fallback;
  const panelEl = shell.querySelector('.live-feature-tabs__panel.is-active[role="tabpanel"]');
  const panelId = String(panelEl?.id || '');
  const suffix = panelId.includes('-panel-') ? panelId.split('-panel-').pop() : '';
  const id = String(suffix || '').trim();
  if (id && tabs.some((t) => t.id === id)) return id;
  return fallback;
}
