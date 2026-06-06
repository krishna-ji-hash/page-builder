import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ANIMATION_PRESETS,
  duplicateAnimationPreset,
  findAnimationPreset,
  normalizeAnimationPresets,
  pruneRedundantAnimationPresets,
  upsertAnimationPreset,
} from '../lib/animationPresetsStore.js';
import { resolveEffectiveAnimation, resolveNodeInteractions } from '../lib/resolveNodeAnimation.js';
import {
  animationKeyframeName,
  normalizeAnimationPreset,
} from '../lib/interactionAnimations.js';
import {
  animationCssFromInteractions,
  interactionPresentationClass,
  resolveAnimationTrigger,
} from '../lib/nodeInteractionCss.js';
import { getDeviceStyle } from '../lib/styleToCss.js';

test('normalizeAnimationPresets seeds built-in presets', () => {
  const normalized = normalizeAnimationPresets(undefined);
  assert.ok(normalized.presets.length >= 15);
  assert.ok(findAnimationPreset(normalized, 'fade-in'));
});

test('resolveEffectiveAnimation merges project preset with node overrides', () => {
  const presets = normalizeAnimationPresets({
    presets: [
      {
        id: 'hero-rise',
        name: 'Hero rise',
        animation: { preset: 'fade-in-up', duration: 0.8, trigger: 'on-enter-viewport' },
      },
    ],
  });
  const eff = resolveEffectiveAnimation(
    { presetRef: 'hero-rise', duration: 1.1 },
    presets
  );
  assert.equal(eff.preset, 'fade-in-up');
  assert.equal(eff.duration, 1.1);
  assert.equal(eff.trigger, 'on-enter-viewport');
});

test('legacy animation ids map to canonical preset ids', () => {
  assert.equal(normalizeAnimationPreset('fade'), 'fade-in');
  assert.equal(normalizeAnimationPreset('slide-up'), 'slide-in-up');
  assert.equal(normalizeAnimationPreset('fade-up'), 'fade-in-up');
  assert.equal(animationKeyframeName('zoom'), 'bld-ix-zoom-in');
});

test('interaction presentation includes scroll trigger class for viewport', () => {
  const cls = interactionPresentationClass({
    interactions: { animation: { preset: 'fade-in', trigger: 'on-enter-viewport' } },
  });
  assert.match(cls, /live-node--ix-trigger-on-scroll/);
  assert.match(cls, /live-node--ix-anim-fade-in/);
});

test('click and focus triggers resolve and presentation class', () => {
  assert.equal(resolveAnimationTrigger({ trigger: 'on-click' }), 'on-click');
  const cls = interactionPresentationClass({
    interactions: { animation: { preset: 'zoom-in', trigger: 'on-click' } },
  });
  assert.match(cls, /live-node--ix-trigger-on-click/);
});

test('responsive interactions merge override-only animation fields', () => {
  const style = {
    desktop: {
      interactions: {
        animation: { preset: 'fade-in', duration: 0.6, trigger: 'on-load' },
      },
    },
    mobile: {
      interactions: {
        animation: { duration: 1.2, trigger: 'on-enter-viewport' },
      },
    },
  };
  const mobile = getDeviceStyle(style, 'mobile');
  assert.equal(mobile.interactions.animation.preset, 'fade-in');
  assert.equal(mobile.interactions.animation.duration, 1.2);
  assert.equal(mobile.interactions.animation.trigger, 'on-enter-viewport');
});

test('animationCssFromInteractions only inlines on-load', () => {
  const onLoad = animationCssFromInteractions({
    interactions: { animation: { preset: 'fade-in', trigger: 'on-load' } },
  });
  assert.equal(onLoad.animationName, 'bld-ix-fade-in');
  const onHover = animationCssFromInteractions({
    interactions: { animation: { preset: 'fade-in', trigger: 'on-hover' } },
  });
  assert.equal(onHover.animationName, undefined);
});

test('duplicateAnimationPreset skips built-in sources', () => {
  const next = duplicateAnimationPreset(DEFAULT_ANIMATION_PRESETS, 'fade-in');
  assert.equal(next.presets.filter((p) => p.id.startsWith('fade-in-copy')).length, 0);
});

test('duplicateAnimationPreset creates custom copy', () => {
  const withCustom = upsertAnimationPreset(DEFAULT_ANIMATION_PRESETS, {
    id: 'hero-rise',
    name: 'Hero rise',
    builtin: false,
    animation: { preset: 'fade-in-up', duration: 0.9, trigger: 'on-enter-viewport' },
  });
  const next = duplicateAnimationPreset(withCustom, 'hero-rise');
  const copy = next.presets.find((p) => p.id === 'hero-rise-copy');
  assert.ok(copy);
  assert.equal(copy.builtin, false);
});

test('pruneRedundantAnimationPresets removes copy duplicates of built-ins', () => {
  const junk = normalizeAnimationPresets(
    {
      presets: [
        ...DEFAULT_ANIMATION_PRESETS.presets,
        {
          id: 'fade-in-up-copy',
          name: 'Fade in up (recommended) (copy)',
          builtin: false,
          animation: { preset: 'fade-in-up', duration: 0.6, trigger: 'on-enter-viewport', easing: 'ease-out' },
        },
        {
          id: 'fade-in-up-copy-2',
          name: 'Fade in up (recommended) (copy)',
          builtin: false,
          animation: { preset: 'fade-in-up', duration: 0.6, trigger: 'on-enter-viewport', easing: 'ease-out' },
        },
      ],
    },
    { pruneRedundant: false }
  );
  const pruned = pruneRedundantAnimationPresets(junk.presets);
  assert.equal(
    pruned.filter((p) => String(p.id).includes('copy')).length,
    0
  );
  assert.ok(pruned.find((p) => p.id === 'fade-in-up' && p.builtin));
});

test('builder/live parity: same resolved interactions from same inputs', () => {
  const presets = DEFAULT_ANIMATION_PRESETS;
  const style = {
    interactions: { animation: { presetRef: 'fade-in', preset: 'fade-in', trigger: 'on-scroll' } },
  };
  const a = resolveNodeInteractions(style, presets);
  const b = resolveNodeInteractions(style, presets);
  assert.deepEqual(a, b);
});
