import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  getDataSourceDefinition,
  isMethodAllowedForResource,
} from '@/lib/runtime/dataSourceRegistry';
import { validateFormFields } from '@/lib/runtime/formValidation';
import { resolveProjectIdFromRequest } from '@/lib/runtime/projectContext';
import { listEcommerceResourceFromCms } from '@/lib/runtime/ecommerceCmsData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** In-memory sample stores (dev / demo; replace with DB in production). */
const stores = {
  users: [
    { id: 1, name: 'Amit Sharma', email: 'amit@example.com' },
    { id: 2, name: 'Rohit Verma', email: 'rohit@example.com' },
  ],
  leads: [
    { id: 1, name: 'Priya Nair', email: 'priya@example.com', status: 'new' },
    { id: 2, name: 'Karan Iyer', email: 'karan@example.com', status: 'contacted' },
  ],
  orders: [
    { id: 1, orderNo: 'ORD-1001', total: 1200, status: 'paid' },
    { id: 2, orderNo: 'ORD-1002', total: 45.5, status: 'pending' },
  ],
  // Ecommerce resources are CMS-backed (see GET handler); not stored here.
};

let nextId = { users: 3, leads: 3, orders: 3 };

function getStore(resource) {
  return stores[resource] || null;
}

function parseIntParam(v, fallback = null) {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
}

function parseFloatParam(v, fallback = null) {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sortRows(rows, sortBy, sortDir) {
  const key = typeof sortBy === 'string' ? sortBy.trim() : '';
  if (!key) return rows;
  const dir = String(sortDir || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  const out = [...rows];
  out.sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
  return out;
}

function textMatch(row, q, fields) {
  if (!q) return true;
  const needle = String(q).trim().toLowerCase();
  if (!needle) return true;
  const list = Array.isArray(fields) && fields.length ? fields : [];
  for (const f of list) {
    const v = row?.[f];
    if (v == null) continue;
    if (String(v).toLowerCase().includes(needle)) return true;
  }
  return false;
}

function applyFilters(resource, rows, searchParams) {
  if (!Array.isArray(rows)) return [];
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const featured = searchParams.get('featured');
  const minPrice = parseFloatParam(searchParams.get('minPrice'), null);
  const maxPrice = parseFloatParam(searchParams.get('maxPrice'), null);
  const productId = parseIntParam(searchParams.get('productId'), null);

  const out = rows.filter((r) => {
    if (resource === 'products') {
      if (category && String(r.category || '') !== String(category)) return false;
      if (featured != null && featured !== '') {
        const want = featured === '1' || featured === 'true';
        if (Boolean(r.featured) !== want) return false;
      }
      if (minPrice != null && Number(r.price) < minPrice) return false;
      if (maxPrice != null && Number(r.price) > maxPrice) return false;
      return textMatch(r, q, ['title', 'sku', 'slug', 'description']);
    }
    if (resource === 'categories') {
      return textMatch(r, q, ['title', 'slug']);
    }
    if (resource === 'reviews') {
      if (productId != null && Number(r.productId) !== productId) return false;
      return textMatch(r, q, ['title', 'body', 'author']);
    }
    if (resource === 'faqs') {
      const cat = searchParams.get('faqCategory') || searchParams.get('category') || '';
      if (cat && String(r.category || '') !== String(cat)) return false;
      return textMatch(r, q, ['question', 'answer', 'category']);
    }
    return textMatch(r, q, ['name', 'email', 'orderNo', 'status']);
  });
  return out;
}

/**
 * @param {string} resource
 * @param {object} body
 */
function validatePostForResource(resource, body) {
  const def = getDataSourceDefinition(resource);
  if (!def?.postBodyFields?.length) {
    return { ok: false, error: 'POST not supported for this resource' };
  }
  const values = typeof body === 'object' && body && !Array.isArray(body) ? body : {};
  const fieldSpecs = def.postBodyFields.map((f) => ({
    name: f.key,
    label: f.key,
    type: f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : 'string',
    required: Boolean(f.required),
  }));
  const r = validateFormFields(
    Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v == null ? '' : String(v)])),
    fieldSpecs
  );
  if (!r.ok) {
    return { ok: false, error: 'Validation failed', details: r.errors };
  }
  return { ok: true, values: body };
}

export async function GET(_request, { params }) {
  const { resource } = await resolveMaybeAsyncParams(params);
  const def = getDataSourceDefinition(resource);
  if (!def) {
    return fail('Not found', 404);
  }
  if (!isMethodAllowedForResource(resource, 'GET')) {
    return fail('Method not allowed', 405);
  }

  const url = new URL(_request.url);
  const sp = url.searchParams;

  // Ecommerce resources are project CMS-backed.
  if (
    resource === 'products' ||
    resource === 'categories' ||
    resource === 'reviews' ||
    resource === 'faqs' ||
    resource === 'related-products'
  ) {
    const projectId = await resolveProjectIdFromRequest(_request);
    if (!projectId) {
      return ok({ success: true, meta: { total: 0, offset: 0, limit: 0 }, data: [] });
    }
    const out = await listEcommerceResourceFromCms({ resource, projectId, searchParams: sp });
    return ok({ success: true, meta: out.meta || { total: 0, offset: 0, limit: 0 }, data: out.data || [] });
  }

  // Query engine (safe, in-memory demo): q, limit, offset, sortBy, sortDir, plus resource-specific filters.
  const limit = clamp(parseIntParam(sp.get('limit'), 0) || 0, 0, 200);
  const offset = clamp(parseIntParam(sp.get('offset'), 0) || 0, 0, 100000);
  const sortBy = sp.get('sortBy') || '';
  const sortDir = sp.get('sortDir') || 'asc';
  const list = getStore(resource);
  if (!list) {
    return fail('Not found', 404);
  }
  const filtered = applyFilters(resource, list, sp);
  const sorted = sortRows(filtered, sortBy, sortDir);
  const paged = limit > 0 ? sorted.slice(offset, offset + limit) : sorted.slice(offset);
  return ok({
    success: true,
    meta: {
      total: sorted.length,
      offset,
      limit,
    },
    data: paged,
  });
}

export async function POST(request, { params }) {
  const { resource } = await resolveMaybeAsyncParams(params);
  const def = getDataSourceDefinition(resource);
  if (!def) {
    return fail('Not found', 404);
  }
  if (!isMethodAllowedForResource(resource, 'POST')) {
    return fail('Method not allowed', 405);
  }
  if (resource === 'products' || resource === 'categories' || resource === 'faqs') {
    return fail('POST not supported for this resource', 405);
  }
  if (!def.postBodyFields?.length) {
    return fail('POST not allowed for this resource', 405);
  }
  const body = await parseJsonBody(request);
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return fail('Invalid JSON body', 400);
  }
  const check = validatePostForResource(resource, body);
  if (!check.ok) {
    if (check.details) {
      return fail(check.error || 'Validation failed', 400, check.details);
    }
    return fail(check.error || 'Invalid body', 400);
  }
  const list = getStore(resource);
  if (!list) {
    return fail('Not found', 404);
  }
  const id = nextId[resource] ?? 1;
  nextId[resource] = id + 1;
  if (resource === 'users') {
    const row = { id, name: String(body.name || '').trim(), email: String(body.email || '').trim() };
    list.push(row);
    return ok({
      success: true,
      message: 'Created successfully',
      data: row,
    });
  }
  if (resource === 'leads') {
    const row = {
      id,
      name: String(body.name || '').trim(),
      email: String(body.email || '').trim(),
      company: body.company != null ? String(body.company) : '',
      status: 'new',
    };
    list.push(row);
    return ok({
      success: true,
      message: 'Created successfully',
      data: row,
    });
  }
  if (resource === 'orders') {
    const row = {
      id,
      orderNo: String(body.orderNo || '').trim() || `ORD-${1000 + id}`,
      total: Number(body.total || 0),
      status: String(body.status || 'pending'),
    };
    list.push(row);
    return ok({
      success: true,
      message: 'Created successfully',
      data: row,
    });
  }
  return fail('Not implemented', 500);
}

export function PUT() {
  return fail('Method not allowed', 405);
}
export function DELETE() {
  return fail('Method not allowed', 405);
}
export function PATCH() {
  return fail('Method not allowed', 405);
}
