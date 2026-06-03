import assert from 'node:assert/strict';
import test from 'node:test';
import { getNodeCapabilities } from '../lib/nodeCapabilities.js';
import { getCompoundWidgetMeta, isCompoundWidgetType } from '../lib/compoundWidgetRegistry.js';
import { carouselChromeToCssVars } from '../lib/carouselChrome.js';
import { faqAccordionChromeToCssVars } from '../lib/faqAccordionChrome.js';
import { cardChromeToCssVars } from '../lib/cardChrome.js';
import { patchCompoundChromeFromKey } from '../lib/compoundChromeInspector.js';

test('compound widget types disable generic style caps', () => {
  const caps = getNodeCapabilities('tabs');
  assert.equal(caps.supportsTypography, false);
  assert.equal(caps.supportsCompoundChrome, true);
  assert.equal(isCompoundWidgetType('carousel'), true);
  assert.equal(getCompoundWidgetMeta('pricing_card')?.kind, 'card');
});

test('carousel and faq chrome vars', () => {
  const c = carouselChromeToCssVars({ cardRadiusPx: 12, arrowColor: '#fff', dotColor: '#ccc', dotActiveColor: '#000' });
  assert.equal(c['--carousel-card-radius'], '12px');
  assert.equal(c['--carousel-arrow-color'], '#fff');
  const f = faqAccordionChromeToCssVars({ headerBackgroundColor: '#f8fafc', borderRadiusPx: 8 });
  assert.equal(f['--faq-item-bg'], '#f8fafc');
  assert.equal(f['--faq-item-radius'], '8px');
});

test('card chrome and patch bridge', () => {
  const vars = cardChromeToCssVars({ backgroundColor: '#fff', paddingPx: 20, shadow: '0 4px 8px #0001' });
  assert.equal(vars['--card-bg'], '#fff');
  assert.equal(vars['--card-padding'], '20px');
  const next = patchCompoundChromeFromKey('cardChromeRadiusPx', 10, {}, 'pricing_card');
  assert.equal(next.borderRadiusPx, 10);
});
