import test from 'node:test';
import assert from 'node:assert/strict';
import { clearInteractionGroup, patchInteractionGroup, pruneInteractions } from '../lib/interactionInspectorUtils.js';
import { normalizeResponsiveStyle } from '../lib/styleNormalizer.js';
import {
  animationCssFromInteractions,
  hasNodeInteractions,
  interactionInlineStyleVars,
  interactionPresentationClass,
  resolveAnimationTrigger,
  resolveLeafInteractionShell,
} from '../lib/nodeInteractionCss.js';
import {
  animationKeyframeName,
  normalizeAnimationPreset,
} from '../lib/interactionAnimations.js';
import { presetPatchForNodeType } from '../lib/stylePresets.js';
import { styleToCss } from '../lib/styleToCss.js';

test('normalizeResponsiveStyle preserves interactions through normalize pipeline', () => {
  const json = {
    desktop: {
      interactions: {
        hover: { background: '#ff0000', scale: '1.05' },
        animation: { preset: 'fade', trigger: 'on-load' },
      },
      layout: { display: 'block' },
    },
  };
  const normalized = normalizeResponsiveStyle(json, { nodeType: 'button' });
  assert.equal(normalized.desktop.interactions.hover.background, '#ff0000');
  assert.equal(normalized.desktop.interactions.hover.scale, '1.05');
  assert.equal(normalized.desktop.interactions.animation.preset, 'fade');
});

test('interactionPresentationClass is non-empty when hover is saved', () => {
  const cls = interactionPresentationClass({
    interactions: { hover: { textColor: '#2563eb' } },
  });
  assert.match(cls, /live-node--ix/);
});

test('resolveLeafInteractionShell uses preview vars before save', () => {
  const { ixStyle, ixClass } = resolveLeafInteractionShell({
    deviceStyle: {},
    previewCss: { '--node-hover-text': '#ff0000', color: '#111' },
  });
  assert.equal(ixStyle['--node-hover-text'], '#ff0000');
  assert.match(ixClass, /live-node--ix/);
});

test('clearInteractionGroup removes one group in a single patch', () => {
  const next = clearInteractionGroup(
    { hover: { scale: '1.1' }, active: { scale: '0.9' } },
    'hover'
  );
  assert.deepEqual(next, { active: { scale: '0.9' } });
});

test('patchInteractionGroup merges onto existing hover without losing fields', () => {
  const first = patchInteractionGroup({ hover: { background: '#111111' } }, 'hover', 'scale', '1.08');
  assert.equal(first.hover.background, '#111111');
  assert.equal(first.hover.scale, '1.08');
});

test('pruneInteractions drops empty animation and keeps valid presets', () => {
  assert.deepEqual(pruneInteractions({ animation: { preset: 'none', trigger: 'on-load' } }), {});
  assert.deepEqual(
    pruneInteractions({ hover: { scale: '1.05' }, animation: { preset: 'fade', duration: 0.5 } }),
    { hover: { scale: '1.05' }, animation: { preset: 'fade-in', duration: 0.5, trigger: 'on-load' } }
  );
});

test('patchInteractionGroup does not add animation when editing hover only', () => {
  const next = patchInteractionGroup({}, 'hover', 'scale', '1.03');
  assert.deepEqual(next, { hover: { scale: '1.03' } });
  assert.equal(next.animation, undefined);
});

test('patchInteractionGroup removes animation when preset set to none', () => {
  const next = patchInteractionGroup(
    { animation: { preset: 'fade', trigger: 'on-load', duration: 0.6 } },
    'animation',
    'preset',
    'none'
  );
  assert.deepEqual(next, {});
});

test('interactionInlineStyleVars maps hover + animation tokens', () => {
  const vars = interactionInlineStyleVars({
    interactions: {
      hover: { background: '#6366f1', scale: '1.03' },
      animation: { preset: 'fade-in', duration: 0.5, easing: 'ease-out' },
    },
  });
  assert.equal(vars['--node-hover-bg'], '#6366f1');
  assert.equal(vars['--btn-bg-hover'], '#6366f1');
  assert.equal(vars['--node-hover-scale'], '1.03');
  assert.equal(vars['--node-anim-duration'], '0.5s');
  assert.equal(vars['--node-anim-easing'], 'ease-out');
});

test('normalizeAnimationPreset maps legacy ids to canonical presets', () => {
  assert.equal(normalizeAnimationPreset('slide-up'), 'fade-up');
  assert.equal(normalizeAnimationPreset('zoom'), 'zoom-in');
  assert.equal(normalizeAnimationPreset('slide-from-left'), 'slide-left');
  assert.equal(animationKeyframeName('zoom'), 'bld-ix-zoom-in');
  assert.equal(animationKeyframeName('slide-from-top'), 'bld-ix-fade-down');
});

test('interactionPresentationClass adds ix + animation + trigger class', () => {
  const cls = interactionPresentationClass({
    interactions: { animation: { preset: 'slide-up', trigger: 'on-scroll' } },
  });
  assert.match(cls, /live-node--ix/);
  assert.match(cls, /live-node--ix-anim-fade-up/);
  assert.match(cls, /live-node--ix-trigger-on-scroll/);
});

test('pruneInteractions normalizes legacy animation preset on save', () => {
  const out = pruneInteractions({
    animation: { preset: 'zoom', trigger: 'on-load', duration: 0.5 },
  });
  assert.equal(out.animation.preset, 'zoom-in');
});

test('pruneInteractions drops invalid animation duration and opacity', () => {
  const out = pruneInteractions({
    hover: { opacity: 'bad', scale: '1.05' },
    animation: { preset: 'fade-in', duration: 'x', delay: NaN, trigger: 'on-load' },
  });
  assert.equal(out.hover.opacity, undefined);
  assert.equal(out.hover.scale, '1.05');
  assert.equal(out.animation.duration, undefined);
  assert.equal(out.animation.delay, undefined);
});

test('interactionInlineStyleVars skips non-finite animation timing', () => {
  const vars = interactionInlineStyleVars({
    interactions: { animation: { preset: 'fade-in', duration: NaN, delay: 'nope' } },
  });
  assert.equal(vars['--node-anim-duration'], undefined);
  assert.equal(vars['--node-anim-delay'], undefined);
});

test('animationCssFromInteractions only inlines animation for on-load', () => {
  const onLoad = animationCssFromInteractions({
    interactions: { animation: { preset: 'fade-in', trigger: 'on-load' } },
  });
  assert.equal(onLoad.animationName, 'bld-ix-fade-in');

  const onHover = animationCssFromInteractions({
    interactions: { animation: { preset: 'fade', trigger: 'on-hover' } },
  });
  assert.equal(onHover.animationName, undefined);

  assert.equal(resolveAnimationTrigger({ trigger: 'bogus' }), 'on-load');
});

test('hasNodeInteractions detects hover overrides', () => {
  assert.equal(hasNodeInteractions({ interactions: { hover: { textColor: '#fff' } } }), true);
  assert.equal(hasNodeInteractions({}), false);
});

test('styleToCss merges interaction vars and transform', () => {
  const css = styleToCss({
    transform: { transform: 'rotate(5deg) scale(1.02)' },
    interactions: { hover: { background: '#000' } },
    effects: { blur: '4px' },
  });
  assert.equal(css['--node-hover-bg'], '#000');
  assert.equal(css.transform, 'rotate(5deg) scale(1.02)');
  assert.equal(css.filter, 'blur(4px)');
});

test('presetPatchForNodeType returns button primary patch', () => {
  const patch = presetPatchForNodeType('button', 'button', 'primary');
  assert.equal(patch.colors.textColor, '#ffffff');
  assert.ok(patch.spacing.padding);
});
