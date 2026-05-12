import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSectionLockedFlagValue,
  isLayoutLockedRow,
  metaRepresentsExplicitSectionUnlock,
  isNodeEditsDisabledBySectionLock,
} from '../lib/rowLayoutMeta.js';

test('isSectionLockedFlagValue handles common shapes', () => {
  assert.equal(isSectionLockedFlagValue(true), true);
  assert.equal(isSectionLockedFlagValue(1), true);
  assert.equal(isSectionLockedFlagValue('true'), true);
  assert.equal(isSectionLockedFlagValue('  YES '), true);
  assert.equal(isSectionLockedFlagValue(false), false);
  assert.equal(isSectionLockedFlagValue(0), false);
  assert.equal(isSectionLockedFlagValue('false'), false);
  assert.equal(isSectionLockedFlagValue(undefined), false);
});

test('metaRepresentsExplicitSectionUnlock only when key present and false-like', () => {
  assert.equal(metaRepresentsExplicitSectionUnlock({}), false);
  assert.equal(metaRepresentsExplicitSectionUnlock({ other: 1 }), false);
  assert.equal(metaRepresentsExplicitSectionUnlock({ sectionLocked: true }), false);
  assert.equal(metaRepresentsExplicitSectionUnlock({ sectionLocked: false }), true);
  assert.equal(metaRepresentsExplicitSectionUnlock({ sectionLocked: 0 }), true);
  assert.equal(metaRepresentsExplicitSectionUnlock({ sectionLocked: 'false' }), true);
  assert.equal(metaRepresentsExplicitSectionUnlock({ sectionLocked: '0' }), true);
});

test('isLayoutLockedRow does not treat string "false" as locked', () => {
  const row = { nodeType: 'row', props: { meta: { layoutLocked: 'false' } } };
  assert.equal(isLayoutLockedRow(row), false);
  const locked = { nodeType: 'row', props: { meta: { layoutLocked: true } } };
  assert.equal(isLayoutLockedRow(locked), true);
});

test('isNodeEditsDisabledBySectionLock respects ancestor row lock', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      props: { meta: { sectionLocked: true } },
      children: [
        {
          id: 2,
          nodeType: 'column',
          props: {},
          children: [{ id: 3, nodeType: 'text', props: { text: 'Hi' }, children: [] }],
        },
      ],
    },
  ];
  assert.equal(isNodeEditsDisabledBySectionLock(tree, 3), true);
  assert.equal(isNodeEditsDisabledBySectionLock(tree, 1), true);
});

test('isNodeEditsDisabledBySectionLock allows edits when section unlocked', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      props: { meta: { sectionLocked: false } },
      children: [
        {
          id: 2,
          nodeType: 'column',
          props: {},
          children: [{ id: 3, nodeType: 'text', props: { text: 'Hi' }, children: [] }],
        },
      ],
    },
  ];
  assert.equal(isNodeEditsDisabledBySectionLock(tree, 3), false);
});
