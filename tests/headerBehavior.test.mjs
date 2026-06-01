import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_STARTER_CARDS,
  buildHeaderStarterRoots,
  headerBehaviorDataAttrs,
  normalizeHeaderBehavior,
} from '../lib/headerBehavior.js';
function mockHeaderTree() {
  return {
    nodeType: 'row',
    displayName: 'Header',
    props: { meta: { isHeader: true, role: 'header' } },
    style_json: {
      desktop: {
        layout: { display: 'flex' },
        spacing: { padding: '14px 24px' },
        background: { backgroundColor: 'var(--color-surface)' },
        effects: {},
        size: { minHeight: '72px' },
      },
    },
    children: [],
  };
}

test('HEADER_STARTER_CARDS includes 10 header variants', () => {
  assert.equal(HEADER_STARTER_CARDS.length, 10);
  assert.ok(HEADER_STARTER_CARDS.some((c) => c.id === 'headerSticky'));
  assert.ok(HEADER_STARTER_CARDS.some((c) => c.id === 'headerMainRevealDark'));
});

test('buildHeaderStarterRoots applies headerBehavior meta', () => {
  const roots = buildHeaderStarterRoots('headerFixed', mockHeaderTree);
  assert.equal(roots.length, 1);
  assert.equal(roots[0].props?.meta?.headerBehavior?.type, 'fixed');
  assert.equal(roots[0].props?.meta?.isHeader, true);
});

test('main reveal starter returns single row with mainReveal behavior', () => {
  const roots = buildHeaderStarterRoots('headerMainRevealGlass', mockHeaderTree);
  assert.equal(roots.length, 1);
  assert.equal(roots[0].props?.meta?.headerBehavior?.type, 'mainReveal');
  assert.equal(roots[0].props?.meta?.headerBehavior?.variant, 'glass');
  assert.equal(roots[0].props?.meta?.headerBehavior?.role, undefined);
});

test('normalizeHeaderBehavior defaults to normal', () => {
  const hb = normalizeHeaderBehavior(null);
  assert.equal(hb.type, 'normal');
  assert.equal(hb.variant, 'default');
});

test('headerBehaviorDataAttrs exposes data attributes', () => {
  const attrs = headerBehaviorDataAttrs(
    normalizeHeaderBehavior({ type: 'revealOnScroll', revealAfter: 80 })
  );
  assert.equal(attrs['data-header-behavior-type'], 'revealOnScroll');
  assert.equal(attrs['data-header-reveal-after'], '80');
});
