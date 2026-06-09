import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearInteractionGroup,
  enableEntranceAnimation,
  mergeInteractionsPatch,
  patchInteractionGroup,
  pruneInteractions,
} from '../lib/interactionInspectorUtils.js';
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
import { sanitizeGradientPaintCss, styleToCss } from '../lib/styleToCss.js';

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
    { hover: { scale: '1.05' }, animation: { preset: 'fade-in', duration: 0.5, trigger: 'on-enter-viewport' } }
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
  assert.equal(normalizeAnimationPreset('slide-up'), 'slide-in-up');
  assert.equal(normalizeAnimationPreset('zoom'), 'zoom-in');
  assert.equal(normalizeAnimationPreset('slide-from-left'), 'slide-in-left');
  assert.equal(animationKeyframeName('zoom'), 'bld-ix-zoom-in');
  assert.equal(animationKeyframeName('slide-from-top'), 'bld-ix-fade-in-down');
});

test('interactionPresentationClass adds ix + animation + trigger class', () => {
  const cls = interactionPresentationClass({
    interactions: { animation: { preset: 'slide-up', trigger: 'on-scroll' } },
  });
  assert.match(cls, /live-node--ix/);
  assert.match(cls, /live-node--ix-anim-slide-in-up/);
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

test('styleToCss strips glass white fill and dark text when gradient preset is merged on buttons', () => {
  const css = styleToCss(
    {
      colors: { textColor: '#0f172a', backgroundColor: 'rgba(255,255,255,0.55)' },
      background: {
        backgroundColor: 'rgba(255,255,255,0.55)',
        backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
      },
      typography: { fontFamily: '"Courier New", Courier, monospace', fontWeight: '700' },
    },
    null,
    { nodeType: 'button' }
  );
  assert.equal(css.backgroundColor, 'transparent');
  assert.match(String(css.color), /token-button-text|#ffffff/i);
  assert.match(String(css['--node-text']), /token-button-text|#ffffff/i);
  assert.match(String(css.backgroundImage), /gradient/i);
});

test('sanitizeGradientPaintCss leaves authored brand text on gradient buttons', () => {
  const css = sanitizeGradientPaintCss(
    {
      color: '#f97316',
      backgroundColor: 'rgba(255,255,255,0.55)',
      backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
    },
    { nodeType: 'button' }
  );
  assert.equal(css.color, '#f97316');
  assert.equal(css.backgroundColor, 'transparent');
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

test('enableEntranceAnimation sets preset trigger and duration atomically', () => {
  const next = enableEntranceAnimation({ hover: { scale: '1.02' } }, 'fade-in-up');
  assert.equal(next.hover.scale, '1.02');
  assert.equal(next.animation.preset, 'fade-in-up');
  assert.equal(next.animation.trigger, 'on-enter-viewport');
  assert.equal(next.animation.duration, 0.6);
});

test('mergeInteractionsPatch applies animation without wiping hover', () => {
  const next = mergeInteractionsPatch(
    { hover: { scale: '1.05' } },
    { animation: { preset: 'slide-in-left', trigger: 'on-scroll', duration: 0.8 } }
  );
  assert.equal(next.hover.scale, '1.05');
  assert.equal(next.animation.preset, 'slide-in-left');
  assert.equal(next.animation.trigger, 'on-scroll');
});

test('mergeInteractionsPatch enables parallax with defaults in one step', () => {
  const next = mergeInteractionsPatch({}, { parallax: { enabled: true } });
  assert.equal(next.parallax.enabled, true);
  assert.equal(next.parallax.speed, 0.35);
  assert.equal(next.parallax.direction, 'vertical-up');
});

test('presetPatchForNodeType returns button primary patch', () => {
  const patch = presetPatchForNodeType('button', 'button', 'primary');
  assert.equal(patch.colors.textColor, '#ffffff');
  assert.ok(patch.spacing.padding);
});
