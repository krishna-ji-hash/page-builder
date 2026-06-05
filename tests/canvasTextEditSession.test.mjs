import test from 'node:test';
import assert from 'node:assert/strict';
import { WHOLE_BLOCK_WHEN_COLLAPSED } from '../lib/canvasTextEditSession.js';

test('whole-block commands include bold and italic', () => {
  assert.equal(WHOLE_BLOCK_WHEN_COLLAPSED.has('bold'), true);
  assert.equal(WHOLE_BLOCK_WHEN_COLLAPSED.has('italic'), true);
});
