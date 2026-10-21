import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResponsivePublicCss,
  isSafeResponsiveCssValue,
  responsiveNodeKey,
} from '../lib/responsivePublicCss.js';

test('desktop-only node emits no responsive rule', () => {
  const css = buildResponsivePublicCss([
    {
      id: 1,
      nodeType: 'heading',
      style_json: { desktop: { typography: { fontSize: '44px' } } },
    },
  ]);
  assert.equal(css, '');
});

test('empty responsive bucket emits no CSS', () => {
  const css = buildResponsivePublicCss([
    {
      id: 2,
      nodeType: 'heading',
      style_json: {
        desktop: { typography: { fontSize: '32px' } },
        tablet: {},
        mobile: {},
      },
    },
  ]);
  assert.equal(css, '');
});

test('mobile font size emits a max-width 767 rule only', () => {
  const css = buildResponsivePublicCss([
    {
      id: 37287,
      nodeType: 'heading',
      style_json: {
        desktop: { typography: { fontSize: '32px' } },
        mobile: { typography: { fontSize: '23px' } },
      },
    },
  ]);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\[data-live-node="37287"\]/);
  assert.match(css, /font-size:23px !important/);
  assert.doesNotMatch(css, /max-width: 1024px/);
  assert.doesNotMatch(css, /font-size:32px/);
});

test('tablet override emits the 768-1024 band', () => {
  const css = buildResponsivePublicCss([
    {
      id: 9,
      nodeType: 'column',
      style_json: {
        desktop: { spacing: { padding: '80px' } },
        tablet: { spacing: { padding: '40px' } },
      },
    },
  ]);
  assert.match(css, /@media \(max-width: 1024px\) and \(min-width: 768px\)/);
  assert.match(css, /padding:40px !important/);
  assert.doesNotMatch(css, /max-width: 767px/);
});

test('tablet and mobile follow getDeviceStyle inheritance', () => {
  const css = buildResponsivePublicCss([
    {
      id: 11,
      nodeType: 'heading',
      style_json: {
        desktop: {
          typography: { fontSize: '32px' },
          spacing: { padding: '80px' },
        },
        tablet: { spacing: { padding: '40px' } },
        mobile: { typography: { fontSize: '16px' } },
      },
    },
  ]);
  const tablet = css.split('@media (max-width: 767px)')[0];
  const mobile = css.split('@media (max-width: 767px)')[1];
  assert.match(tablet, /padding:40px !important/);
  assert.doesNotMatch(tablet, /font-size:/);
  assert.match(mobile, /font-size:16px !important/);
  assert.doesNotMatch(mobile, /padding:/);
});

test('mobile visible false emits display none', () => {
  const css = buildResponsivePublicCss([
    {
      id: 15,
      nodeType: 'text',
      style_json: {
        desktop: { typography: { fontSize: '18px' } },
        mobile: { layout: { visible: false } },
      },
    },
  ]);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\[data-live-node="15"\]/);
  assert.match(css, /display:none !important/);
});

test('unsafe values and unsafe ids are not emitted', () => {
  assert.equal(isSafeResponsiveCssValue('16px; color: red'), false);
  assert.equal(isSafeResponsiveCssValue('expression(alert(1))'), false);
  assert.equal(responsiveNodeKey('1; } body { color: red'), '');
  const css = buildResponsivePublicCss([
    {
      id: '1; } body { color: red',
      nodeType: 'heading',
      style_json: {
        desktop: { typography: { fontSize: '32px' } },
        mobile: { typography: { fontSize: '16px; } body { color: red' } },
      },
    },
    {
      id: 4,
      nodeType: 'heading',
      style_json: {
        desktop: { typography: { fontSize: '32px' } },
        mobile: { typography: { fontSize: '16px; } .x { color: red' } },
      },
    },
  ]);
  assert.equal(css, '');
});

test('multiple nodes get stable unique selectors', () => {
  const css = buildResponsivePublicCss([
    {
      id: 21,
      nodeType: 'heading',
      style_json: {
        desktop: { typography: { fontSize: '44px' } },
        mobile: { typography: { fontSize: '16px' } },
      },
      children: [
        {
          id: 22,
          nodeType: 'heading',
          style_json: {
            desktop: { typography: { fontSize: '32px' } },
            mobile: { typography: { fontSize: '23px' } },
          },
        },
      ],
    },
  ]);
  assert.match(css, /\[data-live-node="21"\]/);
  assert.match(css, /\[data-live-node="22"\]/);
  assert.match(css, /font-size:16px !important/);
  assert.match(css, /font-size:23px !important/);
  assert.doesNotMatch(css, /flex-direction/);
});

test('explicit mobile flex-direction is emitted and scoped off the builder canvas', () => {
  const css = buildResponsivePublicCss([
    {
      id: 30,
      nodeType: 'stack',
      style_json: {
        desktop: { layout: { flexDirection: 'row', flexWrap: 'nowrap' } },
        mobile: { layout: { flexDirection: 'column' } },
      },
    },
  ]);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\.live-doc:not\(\[data-bld-device\]\) \[data-live-node="30"\]\[data-live-node="30"\]/);
  assert.match(css, /flex-direction:column !important/);
  assert.doesNotMatch(css, /flex-wrap/);
  assert.doesNotMatch(css, /\[data-bld-device\] \[data-live-node/);
});

test('missing flex-direction does not generate a flex rule', () => {
  const css = buildResponsivePublicCss([
    {
      id: 31,
      nodeType: 'stack',
      style_json: {
        desktop: { layout: { flexDirection: 'row', gap: 48 } },
        mobile: { layout: { gap: 16 } },
      },
    },
  ]);
  assert.match(css, /row-gap:16px !important/);
  assert.match(css, /column-gap:16px !important/);
  assert.doesNotMatch(css, /flex-direction/);
  assert.doesNotMatch(css, /48px/);
});

test('tablet and mobile gap stay in their own bands', () => {
  const css = buildResponsivePublicCss([
    {
      id: 32,
      nodeType: 'stack',
      style_json: {
        desktop: { layout: { gap: 48 } },
        tablet: { layout: { gap: 32 } },
        mobile: { layout: { gap: 16 } },
      },
    },
  ]);
  const tabletAt = css.indexOf('@media (max-width: 1024px) and (min-width: 768px)');
  const mobileAt = css.indexOf('@media (max-width: 767px)');
  assert.ok(tabletAt >= 0 && mobileAt > tabletAt);
  assert.match(css.slice(tabletAt, mobileAt), /row-gap:32px !important/);
  assert.doesNotMatch(css.slice(tabletAt, mobileAt), /16px/);
  assert.match(css.slice(mobileAt), /row-gap:16px !important/);
  assert.doesNotMatch(css.slice(mobileAt), /32px/);
});

test('explicit justify-content and align-items are emitted', () => {
  const css = buildResponsivePublicCss([
    {
      id: 33,
      nodeType: 'row',
      style_json: {
        desktop: { layout: { justifyContent: 'flex-start', alignItems: 'stretch' } },
        mobile: { layout: { justifyContent: 'center', alignItems: 'flex-end' } },
      },
    },
  ]);
  assert.match(css, /justify-content:center !important/);
  assert.match(css, /align-items:flex-end !important/);
});

test('header and footer subtrees keep structural layout css', () => {
  const css = buildResponsivePublicCss([
    {
      id: 'header-row',
      nodeType: 'row',
      props: { meta: { isHeader: true } },
      style_json: {
        desktop: { layout: { flexDirection: 'column', gap: 40 } },
        mobile: { layout: { flexDirection: 'row', gap: 10 } },
      },
      children: [
        {
          id: 34,
          nodeType: 'column',
          style_json: {
            desktop: { layout: { justifyContent: 'flex-start' } },
            mobile: { layout: { justifyContent: 'flex-end' }, typography: { fontSize: '18px' } },
          },
        },
      ],
    },
  ]);
  assert.doesNotMatch(css, /flex-direction/);
  assert.doesNotMatch(css, /justify-content/);
  assert.doesNotMatch(css, /row-gap/);
  assert.match(css, /\[data-live-node="34"\]/);
  assert.match(css, /font-size:18px !important/);
});

test('image width targets the shell and radius targets the figure', () => {
  const css = buildResponsivePublicCss([
    {
      id: 37154,
      nodeType: 'image',
      style_json: {
        desktop: { size: { width: '452px' }, border: { radius: '0px' } },
        mobile: { size: { width: '100%' }, border: { radius: '16px' } },
      },
    },
  ]);
  assert.match(css, /\[data-live-node="37154"\] \{[^}]*width:100% !important/);
  assert.match(css, /\[data-live-node-visual="37154"\] \{[^}]*border-radius:16px !important/);
  assert.doesNotMatch(css, /\[data-live-node="37154"\] \{[^}]*border-radius/);
  assert.doesNotMatch(css, /\[data-live-node-visual="37154"\] \{[^}]*width:/);
});

test('tablet and mobile visibility emit display none only in that band', () => {
  const css = buildResponsivePublicCss([
    {
      id: 40,
      nodeType: 'stack',
      style_json: {
        desktop: { layout: { display: 'flex' } },
        tablet: { layout: { visible: false } },
      },
    },
    {
      id: 41,
      nodeType: 'stack',
      style_json: {
        desktop: { layout: { display: 'flex' } },
        mobile: { layout: { hidden: true } },
      },
    },
  ]);
  const tabletAt = css.indexOf('@media (max-width: 1024px) and (min-width: 768px)');
  const mobileAt = css.indexOf('@media (max-width: 767px)');
  assert.match(css.slice(tabletAt, mobileAt), /\[data-live-node="40"\]/);
  assert.match(css.slice(tabletAt, mobileAt), /display:none !important/);
  assert.doesNotMatch(css.slice(tabletAt, mobileAt), /data-live-node="41"/);
  assert.match(css.slice(mobileAt), /\[data-live-node="41"\]/);
  assert.match(css.slice(mobileAt), /display:none !important/);
  assert.doesNotMatch(css.slice(mobileAt), /data-live-node="40"/);
});

test('background, padding, and border overrides are emitted', () => {
  const css = buildResponsivePublicCss([
    {
      id: 42,
      nodeType: 'column',
      style_json: {
        desktop: {
          spacing: { padding: '24px' },
          colors: { background: '#ffffff' },
          border: { width: '1px', color: '#cccccc' },
        },
        mobile: {
          spacing: { padding: '8px' },
          colors: { background: '#112233' },
          border: { width: '3px', color: '#ff00aa' },
        },
      },
    },
  ]);
  assert.match(css, /padding:8px !important/);
  assert.match(css, /background-color:#112233 !important/);
  assert.match(css, /border-width:3px !important/);
  assert.match(css, /border-color:#ff00aa !important/);
  assert.doesNotMatch(css, /padding:24px/);
});

test('flex grow and unsafe flex values are not emitted', () => {
  const css = buildResponsivePublicCss([
    {
      id: 43,
      nodeType: 'column',
      style_json: {
        desktop: { layout: { flexGrow: 0, flexDirection: 'row' } },
        mobile: { layout: { flexGrow: 1, flexDirection: 'column;color:red' } },
      },
    },
  ]);
  assert.equal(css, '');
});

test('queries represent the tablet and mobile boundaries only', () => {
  const css = buildResponsivePublicCss([
    {
      id: 44,
      nodeType: 'stack',
      style_json: {
        desktop: { layout: { gap: 10 } },
        tablet: { layout: { gap: 8 } },
        mobile: { layout: { gap: 4 } },
      },
    },
  ]);
  assert.match(css, /@media \(max-width: 1024px\) and \(min-width: 768px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.doesNotMatch(css, /min-width: 1025/);
  assert.doesNotMatch(css, /max-width: 390/);
});
