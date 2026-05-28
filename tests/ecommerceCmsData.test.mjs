import test from 'node:test';
import assert from 'node:assert/strict';

import { listEcommerceResourceFromCms } from '../lib/runtime/ecommerceCmsData.js';

function makeSearchParams(obj) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  return sp;
}

test('missing projectId returns empty', async () => {
  const out = await listEcommerceResourceFromCms({ resource: 'products', projectId: null, searchParams: makeSearchParams({ limit: 10 }) });
  assert.deepEqual(out.data, []);
  assert.equal(out.meta.total, 0);
});

test('products: category + featured + price range + q search', async () => {
  const listFn = async (_pid, _slug, query) => {
    // existence probe
    if (query && query.limit === 1 && query.offset === 0 && query.status === 'published' && !query.byCategory) {
      return [{ id: 999, slug: 'probe', title: 'probe', data: {} }];
    }
    // Ensure query contains DB-level constraints
    assert.equal(query.status, 'published');
    assert.equal(query.byCategory, 'lighting');
    assert.equal(Boolean(query.featuredOnly), true);
    assert.ok(query.filterGroup, 'expected filterGroup for q/min/max');
    return [
      { id: 1, slug: 'a', title: 'Desk Lamp', data: { sku: 'SKU1', price: 100, salePrice: 80, category: 'lighting', featured: true } },
      { id: 2, slug: 'b', title: 'Lamp X', data: { sku: 'SKU2', price: 50, category: 'lighting', featured: true } },
    ];
  };
    const out = await listEcommerceResourceFromCms({
      resource: 'products',
      projectId: 1,
      searchParams: makeSearchParams({
        q: 'lamp',
        category: 'lighting',
        featured: 'true',
        minPrice: 70,
        maxPrice: 90,
        sortBy: 'price',
        sortDir: 'asc',
        limit: 10,
        offset: 0,
      }),
      listFn,
    });
    // only first product passes effectivePrice (80)
    assert.equal(out.data.length, 1);
    assert.equal(out.data[0].slug, 'a');
    assert.equal(out.data[0].effectivePrice, 80);
});

test('reviews: only approved via filterGroup (DB-level)', async () => {
  const listFn = async (_pid, _slug, query) => {
    // existence probe
    if (query && query.limit === 1 && query.offset === 0 && query.status === 'published' && !query.filterGroup) {
      return [{ id: 999, slug: 'probe', title: 'probe', data: {} }];
    }
    const fg = query.filterGroup;
    const txt = JSON.stringify(fg);
    assert.match(txt, /data\.status/);
    assert.match(txt, /approved/);
    return [
      { id: 1, slug: 'r1', title: 'Nice', data: { rating: 5, author: 'A', text: 'x', status: 'approved', productSlug: 'desk-lamp' } },
    ];
  };
    const out = await listEcommerceResourceFromCms({
      resource: 'reviews',
      projectId: 2,
      searchParams: makeSearchParams({ productSlug: 'desk-lamp', limit: 50 }),
      listFn,
    });
    assert.equal(out.data.length, 1);
    assert.equal(out.data[0].productSlug, 'desk-lamp');
});

