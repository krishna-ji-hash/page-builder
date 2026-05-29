import { normalizeProductFromMapped } from '@/lib/runtime/productRuntime.js';

let _defaultListFn = null;

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return Boolean(v);
}

function toStr(v) {
  return v == null ? '' : String(v);
}

function asStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    // comma-separated convenience
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function cmsItemData(item) {
  const d = item?.data;
  return isPlainObject(d) ? d : {};
}

function mapProduct(item) {
  const data = cmsItemData(item);
  const price = toNum(data.price, 0);
  const salePrice = toNum(data.salePrice, 0);
  const effectivePrice = salePrice > 0 ? salePrice : price;
  const mapped = {
    id: item?.id ?? null,
    title: toStr(item?.title || data.title).trim(),
    slug: toStr(item?.slug || data.slug).trim(),
    sku: toStr(data.sku).trim(),
    category: toStr(data.category).trim(),
    featured: toBool(data.featured),
    price,
    salePrice,
    effectivePrice,
    currency: toStr(data.currency || 'INR').trim() || 'INR',
    stock: Math.max(0, Math.floor(toNum(data.stock, 0))),
    image: toStr(data.image).trim(),
    gallery: Array.isArray(data.gallery) ? data.gallery : asStringArray(data.gallery),
    description: toStr(data.description).trim(),
    tags: asStringArray(data.tags),
    variants: Array.isArray(data.variants) ? data.variants : [],
    specifications: data.specifications || data.specs || null,
    deliveryEtaDays: data.deliveryEtaDays ?? data.deliveryDays ?? null,
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
  return normalizeProductFromMapped(mapped);
}

function mapCategory(item) {
  const data = cmsItemData(item);
  return {
    id: item?.id ?? null,
    title: toStr(item?.title || data.title).trim(),
    slug: toStr(item?.slug || data.slug).trim(),
    image: toStr(data.image).trim(),
    description: toStr(data.description).trim(),
    parent: toStr(data.parent).trim(),
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
}

function mapReview(item) {
  const data = cmsItemData(item);
  return {
    id: item?.id ?? null,
    productId: data.productId != null ? toNum(data.productId, null) : null,
    productSlug: toStr(data.productSlug).trim(),
    sku: toStr(data.sku).trim(),
    rating: Math.max(1, Math.min(5, Math.round(toNum(data.rating, 5)))),
    author: toStr(data.author).trim(),
    text: toStr(data.text || data.body).trim(),
    status: toStr(data.status || 'approved').trim(),
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
}

function mapFaq(item) {
  const data = cmsItemData(item);
  return {
    id: item?.id ?? null,
    question: toStr(data.question || item?.title).trim(),
    answer: toStr(data.answer).trim(),
    category: toStr(data.category).trim(),
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
}

function safeInt(n, fallback = 0) {
  const v = Number(n);
  return Number.isInteger(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildCmsQueryFromSearchParams(resource, sp) {
  const limit = clamp(safeInt(sp.get('limit'), 0) || 0, 0, 200);
  const offset = clamp(safeInt(sp.get('offset'), 0) || 0, 0, 100000);
  const sortByRaw = toStr(sp.get('sortBy') || '').trim();
  const sortDir = String(sp.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const q = toStr(sp.get('q') || '').trim();

  // Base query: published only for runtime.
  const query = { status: 'published', limit, offset, sortBy: sortByRaw || 'published_at', sortDir };

  // Quick presets (DB-level where available).
  if (resource === 'products') {
    const category = toStr(sp.get('category') || '').trim();
    const featured = sp.get('featured');
    if (category) query.byCategory = category;
    if (featured != null && featured !== '') query.featuredOnly = featured === '1' || featured === 'true';
  }

  if (resource === 'reviews') {
    // Only return approved by default (DB-level filter)
    query.filterGroup = {
      combinator: 'and',
      rules: [{ field: 'data.status', op: 'eq', value: 'approved' }],
      groups: [],
    };
  }

  // Full-text-ish search: OR on title, slug, sku where possible.
  if (q) {
    const searchGroup = {
      combinator: 'or',
      rules: [
        { field: 'title', op: 'contains', value: q },
        { field: 'slug', op: 'contains', value: q },
      ],
      groups: [],
    };
    // Add sku for products and reviews
    if (resource === 'products' || resource === 'reviews') {
      searchGroup.rules.push({ field: 'data.sku', op: 'contains', value: q });
    }
    // Merge into existing filterGroup if present.
    if (query.filterGroup) {
      query.filterGroup = { combinator: 'and', rules: [], groups: [query.filterGroup, searchGroup] };
    } else {
      query.filterGroup = searchGroup;
    }
  }

  // Price range: DB-level on data.price (salePrice handled in JS after mapping).
  if (resource === 'products') {
    const minPrice = sp.get('minPrice');
    const maxPrice = sp.get('maxPrice');
    const min = minPrice != null && minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice != null && maxPrice !== '' ? Number(maxPrice) : null;
    const rules = [];
    if (Number.isFinite(min)) rules.push({ field: 'data.price', op: 'gte', value: min });
    if (Number.isFinite(max)) rules.push({ field: 'data.price', op: 'lte', value: max });
    if (rules.length) {
      const priceGroup = { combinator: 'and', rules, groups: [] };
      if (query.filterGroup) {
        query.filterGroup = { combinator: 'and', rules: [], groups: [query.filterGroup, priceGroup] };
      } else {
        query.filterGroup = priceGroup;
      }
    }
  }

  return query;
}

function sortInMemory(resource, rows, sortBy, sortDir) {
  const dir = sortDir === 'asc' ? 1 : -1;
  const key = String(sortBy || '').trim();
  if (!key) return rows;
  if (resource === 'products' && key === 'price') {
    return [...rows].sort((a, b) => (Number(a.effectivePrice || 0) - Number(b.effectivePrice || 0)) * dir);
  }
  if (key === 'title') {
    return [...rows].sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')) * dir);
  }
  return rows;
}

async function pickFirstExistingCollection(projectId, slugs, listFn) {
  for (const slug of slugs) {
    const rows = await listFn(projectId, slug, { status: 'published', limit: 1, offset: 0 });
    if (Array.isArray(rows) && rows.length) return slug;
    // If collection exists but empty, listItemsByCollectionSlug returns [] indistinguishable from missing.
    // We accept first slug and let it return empty.
    return slug;
  }
  return '';
}

export async function listEcommerceResourceFromCms({ resource, projectId, searchParams, listFn = null }) {
  const r = String(resource || '').trim();
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) return { data: [], meta: { total: 0, limit: 0, offset: 0 } };

  const sp = searchParams;
  if (!(sp instanceof URLSearchParams)) return { data: [], meta: { total: 0, limit: 0, offset: 0 } };

  // Lazy-load default CMS list fn only when needed (keeps unit tests pure).
  if (!listFn) {
    if (!_defaultListFn) {
      const mod = await import('@/services/builder/cmsService.js');
      _defaultListFn = mod.listItemsByCollectionSlug;
    }
    listFn = _defaultListFn;
  }

  if (r === 'products') {
    const q = buildCmsQueryFromSearchParams(r, sp);
    // For price sort, we need a bigger window to sort accurately (still capped).
    const sortBy = String(sp.get('sortBy') || '').trim();
    const limit = Number(q.limit || 0);
    const offset = Number(q.offset || 0);
    const windowLimit = sortBy === 'price' && limit > 0 ? clamp(offset + limit, 0, 200) : q.limit;
    const collection = await pickFirstExistingCollection(pid, ['products'], listFn);
    if (!collection) return { data: [], meta: { total: 0, limit, offset } };
    const raw = await listFn(pid, collection, { ...q, limit: windowLimit, offset: 0, sortBy: sortBy === 'price' ? 'updated_at' : q.sortBy });
    const mapped = (Array.isArray(raw) ? raw : []).map(mapProduct);
    // salePrice min/max + effective sorting handled here
    const min = sp.get('minPrice') != null && sp.get('minPrice') !== '' ? Number(sp.get('minPrice')) : null;
    const max = sp.get('maxPrice') != null && sp.get('maxPrice') !== '' ? Number(sp.get('maxPrice')) : null;
    const filtered =
      Number.isFinite(min) || Number.isFinite(max)
        ? mapped.filter((p) => {
            if (Number.isFinite(min) && Number(p.effectivePrice || 0) < min) return false;
            if (Number.isFinite(max) && Number(p.effectivePrice || 0) > max) return false;
            return true;
          })
        : mapped;
    const sorted = sortInMemory(r, filtered, sortBy, q.sortDir);
    const page = limit > 0 ? sorted.slice(offset, offset + limit) : sorted.slice(offset);
    const total = sorted.length;
    return { data: page, meta: { total, limit, offset } };
  }

  if (r === 'categories') {
    const q = buildCmsQueryFromSearchParams(r, sp);
    const limit = Number(q.limit || 0);
    const offset = Number(q.offset || 0);
    const collection = await pickFirstExistingCollection(pid, ['product_categories', 'categories'], listFn);
    if (!collection) return { data: [], meta: { total: 0, limit, offset } };
    const all = await listFn(pid, collection, { ...q, limit: 0, offset: 0, sortBy: q.sortBy || 'title' });
    const mapped = (Array.isArray(all) ? all : []).map(mapCategory);
    const sorted = sortInMemory(r, mapped, sp.get('sortBy'), q.sortDir);
    const page = limit > 0 ? sorted.slice(offset, offset + limit) : sorted.slice(offset);
    return { data: page, meta: { total: sorted.length, limit, offset } };
  }

  if (r === 'related-products') {
    const excludeSlug = toStr(sp.get('excludeSlug') || '').trim();
    const category = toStr(sp.get('category') || '').trim();
    const limit = clamp(safeInt(sp.get('limit'), 4) || 4, 1, 24);
    const featured = sp.get('featured');
    const productSp = new URLSearchParams();
    productSp.set('limit', String(limit + 4));
    productSp.set('offset', '0');
    if (category) productSp.set('category', category);
    if (featured != null && featured !== '') productSp.set('featured', featured);
    const { data } = await listEcommerceResourceFromCms({
      resource: 'products',
      projectId: pid,
      searchParams: productSp,
      listFn,
    });
    const filtered = (Array.isArray(data) ? data : []).filter((p) => !excludeSlug || p.slug !== excludeSlug);
    return { data: filtered.slice(0, limit), meta: { total: filtered.length, limit, offset: 0 } };
  }

  if (r === 'reviews') {
    const q = buildCmsQueryFromSearchParams(r, sp);
    const limit = Number(q.limit || 0);
    const offset = Number(q.offset || 0);
    const collection = await pickFirstExistingCollection(pid, ['product_reviews', 'reviews'], listFn);
    if (!collection) return { data: [], meta: { total: 0, limit, offset } };

    // Product filters
    const productSlug = toStr(sp.get('productSlug') || '').trim();
    const sku = toStr(sp.get('sku') || '').trim();
    const productId = sp.get('productId') != null && sp.get('productId') !== '' ? Number(sp.get('productId')) : null;
    const extraRules = [];
    if (productSlug) extraRules.push({ field: 'data.productSlug', op: 'eq', value: productSlug });
    if (sku) extraRules.push({ field: 'data.sku', op: 'eq', value: sku });
    if (Number.isFinite(productId)) extraRules.push({ field: 'data.productId', op: 'eq', value: productId });
    if (extraRules.length) {
      const extraGroup = { combinator: 'and', rules: extraRules, groups: [] };
      if (q.filterGroup) q.filterGroup = { combinator: 'and', rules: [], groups: [q.filterGroup, extraGroup] };
      else q.filterGroup = extraGroup;
    }

    const all = await listFn(pid, collection, { ...q, limit: 0, offset: 0, sortBy: q.sortBy || 'published_at' });
    let mapped = (Array.isArray(all) ? all : []).map(mapReview);
    const sortBy = toStr(sp.get('sortBy') || '').trim();
    const minRating = sp.get('minRating');
    if (minRating != null && minRating !== '') {
      const min = Math.max(1, Math.min(5, Math.round(toNum(minRating, 1))));
      mapped = mapped.filter((r) => r.rating >= min);
    }
    if (sortBy === 'rating') {
      mapped = [...mapped].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating_asc') {
      mapped = [...mapped].sort((a, b) => a.rating - b.rating);
    }
    const page = limit > 0 ? mapped.slice(offset, offset + limit) : mapped.slice(offset);
    return { data: page, meta: { total: mapped.length, limit, offset } };
  }

  if (r === 'faqs') {
    const q = buildCmsQueryFromSearchParams(r, sp);
    const limit = Number(q.limit || 0);
    const offset = Number(q.offset || 0);
    const collection = await pickFirstExistingCollection(pid, ['faqs'], listFn);
    if (!collection) return { data: [], meta: { total: 0, limit, offset } };
    const all = await listFn(pid, collection, { ...q, limit: 0, offset: 0, sortBy: q.sortBy || 'title' });
    const mapped = (Array.isArray(all) ? all : []).map(mapFaq);
    const cat = toStr(sp.get('category') || sp.get('faqCategory') || '').trim();
    const filtered = cat ? mapped.filter((f) => String(f.category || '') === cat) : mapped;
    const page = limit > 0 ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
    return { data: page, meta: { total: filtered.length, limit, offset } };
  }

  return { data: [], meta: { total: 0, limit: 0, offset: 0 } };
}

