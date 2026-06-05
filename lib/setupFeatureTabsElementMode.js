import { findNodeInTree } from './builderTree.js';
import { resolveFeatureTabsProps } from './featureTabsDefaults.js';
import {
  featureTabPanelStackProps,
  featureTabIdsMissingPanelStacks,
  findFeatureTabPanelStack,
  listFeatureTabPanelStacks,
} from './featureTabPanels.js';
import {
  buildFeatureTabTwoColumnStarterRoots,
  materializeTemplateUnderParent,
} from './featureTabPanelStarter.js';

/**
 * Enable elements mode: panel stacks per tab + optional 2-column starter on active tab.
 * @param {object[]} tree
 * @param {number|string} tabsNodeId
 * @param {{
 *   createNodeRequest: (p: object) => Promise<{ id?: number }>,
 *   updateTabsProps: (changes: Record<string, unknown>) => Promise<void>,
 *   seedStarter?: boolean,
 * }} ctx
 */
export async function setupFeatureTabsElementMode(tree, tabsNodeId, ctx) {
  const { createNodeRequest, updateTabsProps, seedStarter = true } = ctx;
  const tabsNode = findNodeInTree(tree, tabsNodeId);
  if (!tabsNode || tabsNode.nodeType !== 'tabs') {
    throw new Error('Feature tabs widget not found.');
  }

  const { tabs, activeTabId } = resolveFeatureTabsProps(tabsNode.props);
  await updateTabsProps({ panelMode: 'elements' });

  const missing = featureTabIdsMissingPanelStacks(tabsNode, tabs.map((t) => t.id));
  let position = listFeatureTabPanelStacks(tabsNode).length;
  const createdStackByTab = {};

  for (const tabId of missing) {
    const created = await createNodeRequest({
      nodeType: 'stack',
      parentNodeId: tabsNode.id,
      displayName: 'Tab panel',
      props: featureTabPanelStackProps(tabId),
      positionIndex: position,
    });
    position += 1;
    if (created?.id) createdStackByTab[tabId] = created.id;
  }

  if (!seedStarter) return { tabsNodeId, activeTabId };

  let seededCount = 0;
  for (const tab of tabs) {
    const existingStack = findFeatureTabPanelStack(tabsNode, tab.id);
    const stackId = createdStackByTab[tab.id] || existingStack?.id;
    if (!stackId) continue;
    const stackChildren = existingStack?.children || [];
    if (stackChildren.length > 0) continue;
    await materializeTemplateUnderParent(
      buildFeatureTabTwoColumnStarterRoots(tab),
      stackId,
      createNodeRequest
    );
    seededCount += 1;
  }

  return { tabsNodeId, activeTabId, seeded: seededCount > 0, seededTabCount: seededCount };
}
