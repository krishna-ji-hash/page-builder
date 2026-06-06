import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanParallax,
  computeParallaxTranslate,
  nodeSupportsParallax,
  parallaxPresentationClass,
  parallaxInlineStyleVars,
} from '../lib/interactionParallax.js';
import { interactionPresentationClass } from '../lib/nodeInteractionCss.js';
import { pruneInteractions, patchInteractionGroup } from '../lib/interactionInspectorUtils.js';
import { getDeviceStyle } from '../lib/styleToCss.js';

test('nodeSupportsParallax gates structural + image nodes only', () => {
  assert.equal(nodeSupportsParallax('row'), true);
  assert.equal(nodeSupportsParallax('image'), true);
  assert.equal(nodeSupportsParallax('heading'), false);
  assert.equal(nodeSupportsParallax('button'), false);
});

test('cleanParallax normalizes speed and direction', () => {
  const cfg = cleanParallax({ enabled: true, speed: 2, direction: 'horizontal-right' });
  assert.equal(cfg.speed, 1);
  assert.equal(cfg.direction, 'horizontal-right');
});

test('parallax presentation class and CSS vars', () => {
  const ix = { parallax: { enabled: true, speed: 0.4, direction: 'vertical-up' } };
  assert.match(parallaxPresentationClass(ix.parallax), /live-node--ix-parallax-vertical-up/);
  assert.equal(parallaxInlineStyleVars(ix.parallax)['--node-parallax-speed'], '0.4');
  const cls = interactionPresentationClass({ interactions: ix });
  assert.match(cls, /live-node--ix-parallax/);
});

test('computeParallaxTranslate is transform-only offsets', () => {
  const rect = { top: 100, height: 200 };
  const up = computeParallaxTranslate(rect, 800, { speed: 0.5, direction: 'vertical-up' });
  assert.ok(typeof up.y === 'number');
  assert.equal(up.x, 0);
  const right = computeParallaxTranslate(rect, 800, { speed: 0.5, direction: 'horizontal-right' });
  assert.ok(typeof right.x === 'number');
  assert.equal(right.y, 0);
});

test('responsive parallax override-only merge', () => {
  const style = {
    desktop: {
      interactions: {
        parallax: { enabled: true, speed: 0.35, direction: 'vertical-up' },
      },
    },
    mobile: {
      interactions: {
        parallax: { speed: 0.15 },
      },
    },
  };
  const mobile = getDeviceStyle(style, 'mobile');
  assert.equal(mobile.interactions.parallax.enabled, true);
  assert.equal(mobile.interactions.parallax.speed, 0.15);
  assert.equal(mobile.interactions.parallax.direction, 'vertical-up');
});

test('patchInteractionGroup enables parallax with defaults', () => {
  const next = patchInteractionGroup({}, 'parallax', 'enabled', true);
  assert.equal(next.parallax.enabled, true);
  assert.equal(next.parallax.speed, 0.35);
  assert.equal(next.parallax.direction, 'vertical-up');
  const cleared = pruneInteractions(patchInteractionGroup(next, 'parallax', 'enabled', false));
  assert.equal(cleared.parallax, undefined);
});
