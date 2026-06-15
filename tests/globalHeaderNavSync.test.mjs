import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyHomeHeaderNavToGlobal,
  extractHeaderNavMap,
  isPlaceholderNavTo,
  syncPageTreeHeaderNavFromHome,
} from '../lib/globalHeaderNavSync.js';

test('isPlaceholderNavTo treats empty and hash as placeholders', () => {
  assert.equal(isPlaceholderNavTo(''), true);
  assert.equal(isPlaceholderNavTo('#'), true);
  assert.equal(isPlaceholderNavTo('/about'), false);
});

test('applyHomeHeaderNavToGlobal copies menu links by label path', () => {
  const homeHeader = {
    nodeType: 'row',
    children: [
      {
        nodeType: 'menu',
        props: {
          items: [
            {
              id: 'a',
              label: 'Services',
              to: '#',
              children: [
                { id: 'b', label: 'Domestic Shipping', to: '/domestic-shipping' },
                { id: 'c', label: 'Bulk Shipping', to: '/bulk-shipping' },
              ],
            },
          ],
        },
      },
    ],
  };
  const globalHeader = {
    nodeType: 'row',
    children: [
      {
        nodeType: 'menu',
        props: {
          items: [
            {
              id: 'x',
              label: 'Services',
              to: '#',
              children: [
                { id: 'y', label: 'Domestic Shipping', to: '#' },
                { id: 'z', label: 'Bulk Shipping', to: '#' },
              ],
            },
          ],
        },
      },
    ],
  };

  const out = applyHomeHeaderNavToGlobal(globalHeader, homeHeader);
  const menu = out.children[0];
  assert.equal(menu.props.items[0].children[0].to, '/domestic-shipping');
  assert.equal(menu.props.items[0].children[1].to, '/bulk-shipping');
});

test('syncPageTreeHeaderNavFromHome updates page-owned headers on inner routes', () => {
  const homeHeader = {
    nodeType: 'row',
    children: [
      {
        nodeType: 'menu',
        props: { items: [{ id: '1', label: 'Features', to: '#features' }] },
      },
    ],
  };
  const pageRoots = [
    {
      nodeType: 'row',
      props: { meta: { isHeader: true } },
      children: [
        {
          nodeType: 'menu',
          props: { items: [{ id: '9', label: 'Features', to: '#' }] },
        },
      ],
    },
    { nodeType: 'row', displayName: 'Body' },
  ];

  const synced = syncPageTreeHeaderNavFromHome(pageRoots, homeHeader, 'domestic-shipping');
  assert.equal(synced[0].children[0].props.items[0].to, '#features');
  assert.equal(synced[1].displayName, 'Body');
});

test('extractHeaderNavMap includes logo link', () => {
  const header = {
    nodeType: 'row',
    children: [
      {
        nodeType: 'image',
        props: { logoLink: '/home', src: '/logo.png' },
      },
    ],
  };
  const map = extractHeaderNavMap(header);
  assert.equal(map.get('__logo__')?.to, '/home');
});
