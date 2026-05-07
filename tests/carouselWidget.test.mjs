import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getWidgetDefinition } from '../lib/builder/widgetRegistry.js';

test('widget registry includes carousel with default props shape', () => {
  const def = getWidgetDefinition('website', 'carousel');
  assert.ok(def);
  assert.equal(def.type, 'carousel');
  assert.ok(Array.isArray(def.defaultProps.slides));
  assert.ok(def.defaultProps.slides.length >= 1);
  const s = def.defaultProps.slides[0];
  assert.equal(typeof s.title, 'string');
  assert.equal(typeof s.subtitle, 'string');
  assert.ok('image' in s);
  assert.ok('buttonText' in s);
  assert.ok('buttonUrl' in s);
  assert.equal(def.defaultProps.variant, 'hero');
  assert.equal(typeof def.defaultProps.autoplay, 'boolean');
  assert.ok(def.defaultProps.slidesPerView && typeof def.defaultProps.slidesPerView === 'object');
});

test('liveRenderer includes carousel render branch', () => {
  const filePath = path.resolve(process.cwd(), 'lib', 'liveRenderer.js');
  const src = fs.readFileSync(filePath, 'utf8');
  assert.ok(src.includes("if (node.nodeType === 'carousel')"));
  assert.ok(src.includes("import Carousel from '@/components/runtime/Carousel'"));
});

test('runtime Carousel guards invalid slides input', () => {
  const filePath = path.resolve(process.cwd(), 'components', 'runtime', 'Carousel.jsx');
  const src = fs.readFileSync(filePath, 'utf8');
  // Guard: `Array.isArray(slides)` before mapping.
  assert.ok(src.includes('Array.isArray(slides)'));
});

