import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyButtonStylePresetToStyleJson,
  replaceButtonVisualStyle,
  stripButtonVisualStyle,
  listButtonPresetIds,
} from '../lib/buttonStylePresets.js';
import { BUTTON_STYLE_PRESETS } from '../lib/stylePresets.js';
import { styleToCss } from '../lib/styleToCss.js';

test('listButtonPresetIds includes new button presets', () => {
  const ids = listButtonPresetIds();
  assert.ok(ids.includes('primary'));
  assert.ok(ids.includes('neon'));
  assert.ok(ids.includes('secondary'));
  assert.equal(ids.length, Object.keys(BUTTON_STYLE_PRESETS).length);
});

test('replaceButtonVisualStyle clears gradient when switching to primary', () => {
  const glassThenGradient = replaceButtonVisualStyle(
    {},
    BUTTON_STYLE_PRESETS.glass
  );
  const primary = replaceButtonVisualStyle(glassThenGradient, BUTTON_STYLE_PRESETS.primary);
  assert.equal(primary.background?.backgroundImage, undefined);
  assert.equal(primary.background?.backgroundColor, '#4f46e5');
  assert.equal(primary.effects?.backdropFilter, undefined);
});

test('stripButtonVisualStyle removes preset paint so theme defaults apply', () => {
  const styled = replaceButtonVisualStyle({}, BUTTON_STYLE_PRESETS.gradient);
  const reset = stripButtonVisualStyle(styled);
  assert.equal(reset.background, undefined);
  assert.equal(reset.colors, undefined);
  assert.equal(reset.effects, undefined);
});

test('applyButtonStylePresetToStyleJson replaces desktop button style cleanly', () => {
  const style_json = applyButtonStylePresetToStyleJson(
    {
      desktop: {
        colors: { textColor: '#0f172a', backgroundColor: 'rgba(255,255,255,0.55)' },
        background: {
          backgroundColor: 'rgba(255,255,255,0.55)',
          backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        },
        typography: { fontFamily: 'Courier New', fontWeight: '700' },
        effects: { backdropFilter: 'blur(12px)' },
      },
    },
    'desktop',
    BUTTON_STYLE_PRESETS.primary,
    null
  );
  assert.equal(style_json.desktop.background.backgroundColor, '#4f46e5');
  assert.equal(style_json.desktop.background.backgroundImage, undefined);
  assert.equal(style_json.desktop.effects.backdropFilter, undefined);
  assert.equal(style_json.desktop.colors.textColor, '#ffffff');
});

test('applyButtonStylePresetToStyleJson reset clears visual groups on desktop', () => {
  const style_json = applyButtonStylePresetToStyleJson(
    { desktop: { ...BUTTON_STYLE_PRESETS.neon, layout: { display: 'inline-flex' } } },
    'desktop',
    null,
    null,
    { reset: true }
  );
  assert.equal(style_json.desktop.colors, undefined);
  assert.equal(style_json.desktop.background, undefined);
  assert.equal(style_json.desktop.layout.display, 'inline-flex');
});

test('gradient preset renders without glass white fill via styleToCss', () => {
  const css = styleToCss(BUTTON_STYLE_PRESETS.gradient, null, { nodeType: 'button' });
  assert.equal(css.backgroundColor, 'transparent');
  assert.match(String(css.backgroundImage), /gradient/i);
  assert.match(String(css['--btn-bg-image']), /gradient/i);
  assert.match(String(css.color), /token-button-text|#ffffff/i);
});
