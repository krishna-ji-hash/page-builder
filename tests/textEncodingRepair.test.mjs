import test from 'node:test';
import assert from 'node:assert/strict';
import { repairMojibakeText } from '../lib/textEncodingRepair.js';

test('repairMojibakeText fixes punctuation and emoji corruption', () => {
  assert.equal(repairMojibakeText('Read article ΓåÆ'), 'Read article →');
  assert.equal(repairMojibakeText('Logistics ┬╖ Mar 12, 2026'), 'Logistics · Mar 12, 2026');
  assert.equal(repairMojibakeText('feesΓÇöeverything'), 'fees—everything');
  assert.equal(repairMojibakeText('Corporate Office ΓÇô'), 'Corporate Office –');
  assert.equal(repairMojibakeText('≡ƒôª'), '📦');
  assert.equal(repairMojibakeText('≡ƒÅ╖∩╕Å'), '🏷️');
  assert.equal(repairMojibakeText('ΓÜû∩╕Å'), '⚖️');
});

test('repairMojibakeText leaves clean strings unchanged', () => {
  const clean = 'Dispatch — verified partners · 27+';
  assert.equal(repairMojibakeText(clean), clean);
});
