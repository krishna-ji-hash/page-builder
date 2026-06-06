import test from 'node:test';
import assert from 'node:assert/strict';
import { isInteractionsOnlyStyleJsonUpdate } from '../lib/interactionsStyleJsonUpdate.js';
import { mergeInteractionsPatch } from '../lib/interactionInspectorUtils.js';

test('isInteractionsOnlyStyleJsonUpdate allows parallax-only style_json changes on rows', () => {
  const base = {
    desktop: {
      layout: { display: 'flex', flexDirection: 'row', width: '100%' },
      spacing: { padding: '24px' },
    },
  };
  const nextIx = mergeInteractionsPatch({}, {
    parallax: { enabled: true, speed: 0.35, direction: 'vertical-up' },
  });
  const next = {
    ...base,
    desktop: {
      ...base.desktop,
      interactions: nextIx,
    },
  };
  assert.equal(isInteractionsOnlyStyleJsonUpdate(base, next, 'row'), true);
});

test('isInteractionsOnlyStyleJsonUpdate rejects layout changes mixed with interactions', () => {
  const base = {
    desktop: {
      layout: { display: 'flex', flexDirection: 'row', width: '100%' },
    },
  };
  const next = {
    desktop: {
      layout: { display: 'flex', flexDirection: 'column', width: '100%' },
      interactions: { animation: { preset: 'fade-in-up', trigger: 'on-enter-viewport', duration: 0.6 } },
    },
  };
  assert.equal(isInteractionsOnlyStyleJsonUpdate(base, next, 'row'), false);
});
