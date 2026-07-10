import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCourierPartnerCardParts,
  isCourierPartnerCardStack,
} from '../lib/courierPartnerCard.js';

test('isCourierPartnerCardStack detects template partner cards', () => {
  assert.equal(
    isCourierPartnerCardStack({
      nodeType: 'stack',
      props: { meta: { tplRole: 'courier-partner-card' } },
    }),
    true
  );
  assert.equal(isCourierPartnerCardStack({ nodeType: 'stack', props: {} }), false);
});

test('getCourierPartnerCardParts returns image and label children', () => {
  const stack = {
    nodeType: 'stack',
    props: { meta: { tplRole: 'courier-partner-card' } },
    children: [
      { id: 1, nodeType: 'image', props: { src: '/a.webp' } },
      { id: 2, nodeType: 'text', props: { text: 'Delhivery' } },
    ],
  };
  const parts = getCourierPartnerCardParts(stack);
  assert.equal(parts.image.id, 1);
  assert.equal(parts.label.id, 2);
});
