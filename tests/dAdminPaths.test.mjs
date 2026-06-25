import assert from 'node:assert/strict';
import test from 'node:test';
import { isDAdminPath } from '../lib/site/dAdminPaths.js';

test('isDAdminPath: legacy admin routes only', () => {
  assert.equal(isDAdminPath('/d'), true);
  assert.equal(isDAdminPath('/d/projects'), true);
  assert.equal(isDAdminPath('/d/projects/14/pages'), true);
  assert.equal(isDAdminPath('/d/builder/42'), true);
  assert.equal(isDAdminPath('/d/preview/42'), true);
});

test('isDAdminPath: public site pages under project slug d are not admin', () => {
  assert.equal(isDAdminPath('/d/home'), false);
  assert.equal(isDAdminPath('/d/cross-border-shipping'), false);
  assert.equal(isDAdminPath('/home'), false);
});

console.log('dAdminPaths.test.mjs — ok');
