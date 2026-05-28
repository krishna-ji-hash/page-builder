import { cookies } from 'next/headers';
import { fail, ok, parseJsonBody } from '@/lib/api';
import { computeCartTotals } from '@/lib/runtime/cartMath';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Dev/demo in-memory carts keyed by cookie cartId. */
const CARTS = new Map();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function readCartId() {
  const c = cookies();
  const v = c.get('bld_cart')?.value || '';
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

function ensureCartId() {
  const c = cookies();
  let id = readCartId();
  if (!id) {
    id = `cart_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    c.set('bld_cart', id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 14 });
  }
  return id;
}

function getCart(id) {
  if (!id) return null;
  return CARTS.get(id) || null;
}

function putCart(id, cart) {
  CARTS.set(id, cart);
}

function normalizeQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return clamp(Math.round(n), 0, 99);
}

function normalizeLine(input) {
  const sku = typeof input?.sku === 'string' ? input.sku.trim() : '';
  if (!sku) return null;
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const price = Number(input?.price);
  const qty = normalizeQty(input?.qty ?? 1);
  if (!Number.isFinite(price) || price < 0) return null;
  return {
    sku,
    title,
    price,
    qty,
    image: typeof input?.image === 'string' ? input.image : '',
    variant: typeof input?.variant === 'string' ? input.variant : '',
    productId: Number.isFinite(Number(input?.productId)) ? Number(input.productId) : null,
  };
}

function buildCartResponse(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const pricing = cart?.pricing && typeof cart.pricing === 'object' ? cart.pricing : {};
  const totals = computeCartTotals(items, pricing);
  return { ...cart, items, pricing, totals };
}

export async function GET() {
  const id = ensureCartId();
  const cart = getCart(id) || { id, items: [], pricing: { taxRate: 0, shipping: 0, discount: 0 }, coupon: '' };
  putCart(id, cart);
  return ok({ cart: buildCartResponse(cart) });
}

export async function POST(request) {
  const id = ensureCartId();
  const cart = getCart(id) || { id, items: [], pricing: { taxRate: 0, shipping: 0, discount: 0 }, coupon: '' };
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid JSON body', 400);
  const line = normalizeLine(body?.item);
  if (!line) return fail('Invalid item', 400);

  const next = [...(cart.items || [])];
  const idx = next.findIndex((it) => it?.sku === line.sku);
  if (idx >= 0) {
    next[idx] = { ...next[idx], qty: clamp(Number(next[idx].qty || 0) + line.qty, 0, 99) };
  } else {
    next.push(line);
  }
  const updated = { ...cart, items: next };
  putCart(id, updated);
  return ok({ cart: buildCartResponse(updated) });
}

export async function PATCH(request) {
  const id = ensureCartId();
  const cart = getCart(id) || { id, items: [], pricing: { taxRate: 0, shipping: 0, discount: 0 }, coupon: '' };
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid JSON body', 400);

  const op = String(body.op || '').trim();
  if (op === 'setQty') {
    const sku = typeof body.sku === 'string' ? body.sku.trim() : '';
    if (!sku) return fail('Invalid sku', 400);
    const qty = normalizeQty(body.qty);
    const next = [...(cart.items || [])].map((it) => (it?.sku === sku ? { ...it, qty } : it)).filter((it) => Number(it.qty || 0) > 0);
    const updated = { ...cart, items: next };
    putCart(id, updated);
    return ok({ cart: buildCartResponse(updated) });
  }
  if (op === 'applyCoupon') {
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    // Placeholder: accept any code but do not change discount automatically yet.
    const updated = { ...cart, coupon: code };
    putCart(id, updated);
    return ok({ cart: buildCartResponse(updated) });
  }
  if (op === 'setPricing') {
    const p = body.pricing && typeof body.pricing === 'object' ? body.pricing : {};
    const nextPricing = {
      taxRate: clamp(Number(p.taxRate || 0), 0, 1),
      shipping: Math.max(0, Number(p.shipping || 0)),
      discount: Math.max(0, Number(p.discount || 0)),
    };
    const updated = { ...cart, pricing: nextPricing };
    putCart(id, updated);
    return ok({ cart: buildCartResponse(updated) });
  }
  return fail('Unsupported op', 400);
}

export async function DELETE(request) {
  const id = ensureCartId();
  const cart = getCart(id) || { id, items: [], pricing: { taxRate: 0, shipping: 0, discount: 0 }, coupon: '' };
  const url = new URL(request.url);
  const sku = url.searchParams.get('sku');
  if (sku) {
    const next = [...(cart.items || [])].filter((it) => it?.sku !== sku);
    const updated = { ...cart, items: next };
    putCart(id, updated);
    return ok({ cart: buildCartResponse(updated) });
  }
  // Clear cart
  const cleared = { ...cart, items: [], coupon: '', pricing: { taxRate: 0, shipping: 0, discount: 0 } };
  putCart(id, cleared);
  return ok({ cart: buildCartResponse(cleared) });
}

