/**
 * Cross-island PDP state (variant, qty, gallery index) without a single React parent.
 * Syncs multiple client PDP blocks on the same product page via useSyncExternalStore.
 */

import {
  defaultSelectedOptions,
  findVariantByOptions,
  resolveActiveSku,
  resolveProductGallery,
  resolveProductPricing,
  resolveProductStock,
} from '@/lib/runtime/productRuntime';

const stores = new Map();

function storeKey(projectId, slug) {
  return `pdp:${projectId || 0}:${slug || 'unknown'}`;
}

function createState(product, overrides = {}) {
  const variant =
    findVariantByOptions(product, overrides.selectedOptions) || product?.variants?.[0] || null;
  const selectedOptions = overrides.selectedOptions ?? defaultSelectedOptions(product, variant);
  const gallery = resolveProductGallery(product, variant);
  return {
    product,
    selectedOptions,
    selectedVariant: variant,
    quantity: Math.max(1, Math.min(99, Number(overrides.quantity) || 1)),
    activeImageIndex: 0,
    gallery,
    pricing: resolveProductPricing(product, variant),
    stock: resolveProductStock(product, variant),
    activeSku: resolveActiveSku(product, variant),
  };
}

function emit(store) {
  for (const fn of store.listeners) fn();
}

function getOrCreateStore(key, initialProduct) {
  if (!stores.has(key)) {
    const state = createState(initialProduct);
    stores.set(key, {
      key,
      state,
      listeners: new Set(),
      relatedCache: new Map(),
      reviewsCache: null,
    });
  }
  return stores.get(key);
}

export function ensureProductRuntimeStore({ projectId, slug, product }) {
  const key = storeKey(projectId, slug);
  const store = getOrCreateStore(key, product);
  if (product && store.state.product?.slug !== product.slug) {
    store.state = createState(product);
    emit(store);
  }
  return key;
}

export function getProductRuntimeSnapshot(key) {
  return stores.get(key)?.state ?? null;
}

export function subscribeProductRuntime(key, listener) {
  const store = stores.get(key);
  if (!store) return () => {};
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

export function selectVariantOptions(key, partialOptions) {
  const store = stores.get(key);
  if (!store?.state?.product) return;
  const nextOptions = { ...store.state.selectedOptions, ...partialOptions };
  const variant = findVariantByOptions(store.state.product, nextOptions);
  const gallery = resolveProductGallery(store.state.product, variant);
  store.state = {
    ...store.state,
    selectedOptions: nextOptions,
    selectedVariant: variant,
    gallery,
    activeImageIndex: 0,
    pricing: resolveProductPricing(store.state.product, variant),
    stock: resolveProductStock(store.state.product, variant),
    activeSku: resolveActiveSku(store.state.product, variant),
  };
  emit(store);
}

export function setProductQuantity(key, quantity) {
  const store = stores.get(key);
  if (!store) return;
  const qty = Math.max(1, Math.min(99, Math.floor(Number(quantity) || 1)));
  store.state = { ...store.state, quantity: qty };
  emit(store);
}

export function setActiveGalleryIndex(key, index) {
  const store = stores.get(key);
  if (!store) return;
  const max = Math.max(0, (store.state.gallery?.length || 1) - 1);
  const idx = Math.max(0, Math.min(max, Math.floor(Number(index) || 0)));
  store.state = { ...store.state, activeImageIndex: idx };
  emit(store);
}

export function setRelatedCache(key, cacheKey, data) {
  const store = stores.get(key);
  if (!store) return;
  store.relatedCache.set(cacheKey, { data, at: Date.now() });
}

export function getRelatedCache(key, cacheKey, maxAgeMs = 60_000) {
  const store = stores.get(key);
  if (!store) return null;
  const hit = store.relatedCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.data;
}

