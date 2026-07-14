import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRenderNodesWithGlobals,
  orderPageRootsHeaderContentFooter,
} from '../lib/globalSectionMerge.js';

test('orderPageRootsHeaderContentFooter moves header above blog content', () => {
  const blog = { id: 'blog', nodeType: 'blog_detail_page' };
  const header = { id: 'hdr', nodeType: 'row', props: { meta: { isHeader: true } } };
  const footer = { id: 'ftr', nodeType: 'row', props: { meta: { isFooter: true } } };
  const ordered = orderPageRootsHeaderContentFooter([blog, header, footer]);
  assert.deepEqual(
    ordered.map((n) => n.id),
    ['hdr', 'blog', 'ftr']
  );
});

test('buildRenderNodesWithGlobals uses page header first and skips global header', () => {
  const blog = { id: 'blog', nodeType: 'row', props: { meta: {} } };
  const header = { id: 'hdr', nodeType: 'row', props: { meta: { isHeader: true } } };
  const nodes = buildRenderNodesWithGlobals(
    [blog, header],
    { id: 'global', nodeType: 'row', props: { meta: { isHeader: true } } },
    null,
    (n, prefix) => ({ ...n, id: `${prefix}-${n.id}` })
  );
  assert.equal(nodes[0].id, 'hdr');
  assert.equal(nodes[1].id, 'blog');
  assert.equal(nodes.length, 2);
});
