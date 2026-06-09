import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeTabHeroPanels,
  recoverTabHeroInlineField,
  resolveTabHeroProps,
} from '../lib/tabHeroDefaults.js';

test('resolveTabHeroProps picks valid activePanelId', () => {
  const { panels, activePanelId } = resolveTabHeroProps({
    panels: [{ id: 'a', label: 'A', heading: 'H', subheading: 'S', paragraph: 'P', imageSrc: '/x.svg', imageAlt: 'x' }],
    activePanelId: 'missing',
  });
  assert.equal(panels.length, 1);
  assert.equal(activePanelId, 'a');
});

test('resolveTabHeroProps defaults to first panel when defaultTabExplicit is false', () => {
  const panels = normalizeTabHeroPanels(null);
  const { activePanelId } = resolveTabHeroProps({
    panels,
    activePanelId: 'e-commerce',
  });
  assert.equal(activePanelId, panels[0].id);
});

test('recoverTabHeroInlineField unwraps entity-encoded span soup', () => {
  const corrupted =
    '&lt;span&gt;&amp;lt;span&amp;gt;Real-time serviceability API&amp;lt;/span&amp;gt;&lt;/span&gt;';
  assert.equal(recoverTabHeroInlineField(corrupted), 'Real-time serviceability API');
});

test('normalizeTabHeroPanels recovers corrupted heading on load', () => {
  const panels = normalizeTabHeroPanels([
    {
      id: 'a',
      label: 'Tab',
      heading: '&lt;span&gt;&amp;lt;span&amp;gt;Hello world&amp;lt;/span&amp;gt;&lt;/span&gt;',
      paragraph: 'Plain body',
    },
  ]);
  assert.equal(panels[0].heading, 'Hello world');
  assert.equal(panels[0].paragraph, 'Plain body');
});

test('resolveTabHeroProps honors inspector default when defaultTabExplicit is true', () => {
  const panels = normalizeTabHeroPanels(null);
  const { activePanelId } = resolveTabHeroProps({
    panels,
    activePanelId: 'e-commerce',
    defaultTabExplicit: true,
  });
  assert.equal(activePanelId, 'e-commerce');
});
