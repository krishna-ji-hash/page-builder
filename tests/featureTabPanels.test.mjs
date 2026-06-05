import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findFeatureTabPanelStack,
  getFeatureTabPanelId,
  isFeatureTabsElementPanelMode,
  resolveActiveFeatureTabPanelIdFromDom,
} from '../lib/featureTabPanels.js';
import { resolveEditableInsertTarget } from '../lib/resolveEditableInsertTarget.js';

test('isFeatureTabsElementPanelMode', () => {
  assert.equal(isFeatureTabsElementPanelMode({ panelMode: 'elements' }), true);
  assert.equal(isFeatureTabsElementPanelMode({ panelMode: 'fields' }), false);
  assert.equal(isFeatureTabsElementPanelMode({}), false);
});

test('findFeatureTabPanelStack matches tab id on stack meta', () => {
  const tabsNode = {
    id: 10,
    nodeType: 'tabs',
    props: { panelMode: 'elements', activeTabId: 'a', tabs: [{ id: 'a' }] },
    children: [
      { id: 11, nodeType: 'stack', props: { meta: { featureTabPanelId: 'a' } } },
      { id: 12, nodeType: 'stack', props: { meta: { featureTabPanelId: 'b' } } },
    ],
  };
  assert.equal(getFeatureTabPanelId(tabsNode.children[0]), 'a');
  assert.equal(findFeatureTabPanelStack(tabsNode, 'a')?.id, 11);
  assert.equal(findFeatureTabPanelStack(tabsNode, 'b')?.id, 12);
});

test('resolveEditableInsertTarget for tabs elements mode uses panel stack', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      children: [
        {
          id: 2,
          nodeType: 'column',
          children: [
            {
              id: 3,
              nodeType: 'stack',
              children: [
                {
                  id: 5,
                  nodeType: 'tabs',
                  props: { panelMode: 'elements', activeTabId: 't1', tabs: [{ id: 't1' }] },
                  children: [
                    {
                      id: 6,
                      nodeType: 'stack',
                      props: { meta: { featureTabPanelId: 't1' } },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  const r = resolveEditableInsertTarget(tree, 5);
  assert.equal(r.ok, true);
  assert.equal(r.parentId, 6);
});

test('resolveActiveFeatureTabPanelIdFromDom reads active tabpanel id', () => {
  const shell = {
    querySelector(sel) {
      if (sel.includes('is-active')) {
        return { id: 'ft-nav-panel-b' };
      }
      return null;
    },
  };
  const id = resolveActiveFeatureTabPanelIdFromDom(shell, {
    activeTabId: 'a',
    tabs: [{ id: 'a' }, { id: 'b' }],
  });
  assert.equal(id, 'b');
});

test('resolveEditableInsertTarget creates panel stack when missing', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      children: [
        {
          id: 2,
          nodeType: 'column',
          children: [
            {
              id: 3,
              nodeType: 'stack',
              children: [
                {
                  id: 5,
                  nodeType: 'tabs',
                  props: { panelMode: 'elements', activeTabId: 't1', tabs: [{ id: 't1' }] },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  const r = resolveEditableInsertTarget(tree, 5);
  assert.equal(r.ok, true);
  assert.equal(r.createFeatureTabPanelStack, true);
  assert.equal(r.tabsNodeId, 5);
  assert.equal(r.tabId, 't1');
});
