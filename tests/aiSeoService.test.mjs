import test from 'node:test';
import assert from 'node:assert/strict';
import {
  heuristicGenerateTitle,
  heuristicGenerateDescription,
  heuristicGenerateKeywords,
  heuristicGenerateFaqSchema,
  heuristicGenerateSchema,
  buildPageContext,
} from '../lib/seo/aiSeoHeuristics.js';
import { DISPATCH_PRESET_IDS, getDispatchPreset } from '../lib/seo/aiSeoPresets.js';
import { isGeminiConfigured } from '../lib/ai/gemini.js';

const sampleTree = [
  {
    id: 1,
    nodeType: 'heading',
    props: { text: 'Multi-carrier shipping for ecommerce', level: 1 },
    children: [],
  },
  {
    id: 2,
    nodeType: 'paragraph',
    props: {
      text: 'Dispatch helps brands ship faster with courier aggregation, NDR management, and COD verification across India.',
    },
    children: [],
  },
];

test('dispatch presets cover logistics verticals', () => {
  assert.ok(DISPATCH_PRESET_IDS.includes('shipping'));
  assert.ok(DISPATCH_PRESET_IDS.includes('ndr'));
  const preset = getDispatchPreset('fulfillment');
  assert.ok(preset.focusKeywords.length >= 1);
});

test('heuristic title and description respect length targets', () => {
  const title = heuristicGenerateTitle({
    pageName: 'Shipping API',
    pageSlug: 'shipping-api',
    siteName: 'Dispatch',
    tree: sampleTree,
    presetId: 'shipping',
  });
  assert.ok(title.length >= 10 && title.length <= 70);

  const desc = heuristicGenerateDescription({
    pageName: 'Shipping API',
    pageSlug: 'shipping-api',
    tree: sampleTree,
    presetId: 'shipping',
  });
  assert.ok(desc.length >= 80 && desc.length <= 165);
});

test('heuristic keywords return focus, secondary, and long-tail', () => {
  const kw = heuristicGenerateKeywords({
    pageName: 'NDR automation',
    pageSlug: 'ndr-automation',
    tree: sampleTree,
    presetId: 'ndr',
  });
  assert.ok(kw.focusKeyword);
  assert.ok(Array.isArray(kw.secondaryKeywords) && kw.secondaryKeywords.length >= 1);
  assert.ok(Array.isArray(kw.longTailKeywords) && kw.longTailKeywords.length >= 1);
});

test('heuristic FAQ and schema generators return schema.org objects', () => {
  const faq = heuristicGenerateFaqSchema({ pageName: 'Shipping FAQ', tree: sampleTree });
  assert.equal(faq['@type'], 'FAQPage');
  assert.ok(Array.isArray(faq.mainEntity));

  const schema = heuristicGenerateSchema({ schemaType: 'Service', pageName: 'Courier API' });
  assert.equal(schema['@type'], 'Service');
  assert.ok(schema.name);
});

test('buildPageContext extracts H1 and body excerpt', () => {
  const ctx = buildPageContext({
    pageName: 'Home',
    pageSlug: 'home',
    siteName: 'Dispatch',
    tree: sampleTree,
    projectSeo: {},
    pageSeo: {},
  });
  assert.match(ctx.h1, /shipping/i);
  assert.ok(ctx.bodyExcerpt.length > 20);
  assert.equal(ctx.tree.length, sampleTree.length);
});

test('isGeminiConfigured is false without GEMINI_API_KEY', () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  assert.equal(isGeminiConfigured(), false);
  if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
});
