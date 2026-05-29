'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  ensureProductRuntimeStore,
  getProductRuntimeSnapshot,
  selectVariantOptions,
  setActiveGalleryIndex,
  setProductQuantity,
  subscribeProductRuntime,
} from '@/lib/runtime/productRuntimeStore';

/**
 * @param {string} runtimeKey
 * @param {object|null} initialProduct
 */
export function useProductRuntime(runtimeKey, initialProduct = null) {
  const subscribe = useCallback((cb) => subscribeProductRuntime(runtimeKey, cb), [runtimeKey]);
  const getSnapshot = useCallback(() => {
    if (initialProduct && runtimeKey) {
      ensureProductRuntimeStore({
        projectId: initialProduct._projectId,
        slug: initialProduct.slug,
        product: initialProduct,
      });
    }
    return getProductRuntimeSnapshot(runtimeKey);
  }, [runtimeKey, initialProduct]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const selectOptions = useCallback(
    (partial) => selectVariantOptions(runtimeKey, partial),
    [runtimeKey]
  );
  const setQuantity = useCallback((q) => setProductQuantity(runtimeKey, q), [runtimeKey]);
  const setGalleryIndex = useCallback((i) => setActiveGalleryIndex(runtimeKey, i), [runtimeKey]);

  return {
    state,
    selectOptions,
    setQuantity,
    setGalleryIndex,
    runtimeKey,
  };
}
