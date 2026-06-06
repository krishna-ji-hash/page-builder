import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countRootPageSections,
  interactionTemplateFromSourceInteractions,
  mergeInteractionTemplateIntoExisting,
  planPageSectionInteractionUpdates,
} from '../lib/applyPageSectionInteractions.js';

test('interactionTemplateFromSourceInteractions extracts animation preset', () => {
  const template = interactionTemplateFromSourceInteractions({
    animation: { preset: 'fade-in-up', trigger: 'on-enter-viewport', duration: 0.6 },
    hover: { scale: '1.02' },
  });
  assert.equal(template.animation.preset, 'fade-in-up');
  assert.equal(template.hover, undefined);
});

test('planPageSectionInteractionUpdates targets all root rows', () => {
  const tree = [
    { id: 1, nodeType: 'row', style_json: {} },
    { id: 2, nodeType: 'row', style_json: {} },
    {
      id: 3,
      nodeType: 'row',
      style_json: {},
      children: [{ id: 4, nodeType: 'row', style_json: {} }],
    },
  ];
  assert.equal(countRootPageSections(tree), 3);
  const template = interactionTemplateFromSourceInteractions({
    animation: { preset: 'fade-in', trigger: 'on-enter-viewport', duration: 0.5 },
  });
  const planned = planPageSectionInteractionUpdates(tree, template);
  assert.equal(planned.length, 3);
  assert.deepEqual(
    planned.map((p) => p.nodeId),
    [1, 2, 3]
  );
});

test('mergeInteractionTemplateIntoExisting keeps hover styles', () => {
  const merged = mergeInteractionTemplateIntoExisting(
    { hover: { scale: '1.05' } },
    { animation: { preset: 'slide-in-up', trigger: 'on-enter-viewport', duration: 0.7 } }
  );
  assert.equal(merged.hover.scale, '1.05');
  assert.equal(merged.animation.preset, 'slide-in-up');
});
