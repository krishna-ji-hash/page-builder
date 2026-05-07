import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  getDataSourceDefinition,
  isMethodAllowedForResource,
} from '@/lib/runtime/dataSourceRegistry';
import { validateFormFields } from '@/lib/runtime/formValidation';

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
};

let nextId = { users: 3, leads: 3, orders: 3 };

function getStore(resource) {
  return stores[resource] || null;
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
  const list = getStore(resource);
  if (!list) {
    return fail('Not found', 404);
  }
  return ok({
    success: true,
    data: [...list],
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
