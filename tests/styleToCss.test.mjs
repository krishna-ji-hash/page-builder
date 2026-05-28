import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coerceCssGap,
  getDeviceStyle,
  layoutFlexShorthandToParts,
  resolveMarginCssLonghand,
  sanitizeGapShorthandConflict,
  sanitizeInlineMarginCss,
  styleToCss,
} from '../lib/styleToCss.js';

test('coerceCssGap handles numbers and strings', () => {
  assert.equal(coerceCssGap(24), '24px');
  assert.equal(coerceCssGap('16px'), '16px');
  assert.equal(coerceCssGap(null), undefined);
});

test('getDeviceStyle: desktop base + tablet override-only merge for layout/colors/typography', () => {
  const style = {
    desktop: {
      layout: { gap: 24, justifyContent: 'flex-start' },
      colors: { textColor: '#111' },
    },
    tablet: {
      layout: { gap: 16 },
    },
  };
  const tablet = getDeviceStyle(style, 'tablet');
  assert.equal(tablet.layout.gap, 16);
  assert.equal(tablet.layout.justifyContent, 'flex-start');
  assert.equal(tablet.colors.textColor, '#111');
});

test('getDeviceStyle: legacy flat style treated as desktop', () => {
  const flat = { layout: { gap: 8 }, colors: { textColor: '#000' } };
  const d = getDeviceStyle(flat, 'desktop');
  assert.equal(d.layout.gap, 8);
});

test('styleToCss exposes --node-* vars and flex gap from layout.gap', () => {
  const css = styleToCss({
    layout: { gap: 20, display: 'flex', flexDirection: 'column' },
    colors: { text: '#222', background: '#eee' },
    spacing: { padding: '8px 12px' },
    border: { radius: '6px' },
  });
  assert.equal(css['--node-gap'], '20px');
  assert.equal(css.rowGap, '20px');
  assert.equal(css.columnGap, '20px');
  assert.equal(css['--node-text'], '#222');
  assert.equal(css['--node-bg'], '#eee');
  assert.ok(css['--node-pad']);
});

test('layoutFlexShorthandToParts maps flex grow/shrink/basis', () => {
  assert.deepEqual(layoutFlexShorthandToParts({ flex: '0 0 auto' }), { flexGrow: '0', flexShrink: '0', flexBasis: 'auto' });
  assert.deepEqual(layoutFlexShorthandToParts({ flex: '1' }), { flexGrow: '1' });
});

test('styleToCss emits margin longhands only when layout overrides spacing', () => {
  const css = styleToCss({
    spacing: { margin: { top: 8, right: 4, bottom: 8, left: 4 } },
    layout: { marginBottom: '24px' },
  });
  assert.equal(css.margin, undefined);
  assert.equal(css.marginTop, '8px');
  assert.equal(css.marginRight, '4px');
  assert.equal(css.marginBottom, '24px');
  assert.equal(css.marginLeft, '4px');
});

test('sanitizeInlineMarginCss drops shorthand when longhands exist', () => {
  const out = sanitizeInlineMarginCss({
    margin: '0px',
    marginBottom: '12px',
  });
  assert.equal(out.margin, undefined);
  assert.equal(out.marginBottom, '12px');
});

test('sanitizeGapShorthandConflict expands gap to rowGap/columnGap', () => {
  const out = sanitizeGapShorthandConflict({
    display: 'grid',
    gap: '16px',
    columnGap: '10px',
  });
  assert.equal(out.gap, undefined);
  assert.equal(out.rowGap, '16px');
  assert.equal(out.columnGap, '10px');
});

test('sanitizeInlineMarginCss also sanitizes gap vs columnGap', () => {
  const out = sanitizeInlineMarginCss({ gap: '24px', columnGap: '8px' });
  assert.equal(out.gap, undefined);
  assert.equal(out.rowGap, '24px');
  assert.equal(out.columnGap, '8px');
});

test('resolveMarginCssLonghand preserves auto', () => {
  const m = resolveMarginCssLonghand({
    layout: { marginLeft: 'auto', marginRight: 'auto' },
  });
  assert.equal(m.marginLeft, 'auto');
  assert.equal(m.marginRight, 'auto');
});

test('styleToCss applies layout.flex shorthand and whiteSpace', () => {
  const css = styleToCss({
    layout: { display: 'flex', flexDirection: 'row', flex: '0 0 auto' },
    typography: { whiteSpace: 'nowrap' },
  });
  assert.equal(css.flexGrow, '0');
  assert.equal(css.flexShrink, '0');
  assert.equal(css.flexBasis, 'auto');
  assert.equal(css.whiteSpace, 'nowrap');
});
