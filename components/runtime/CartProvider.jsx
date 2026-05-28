'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRuntimeData } from './RuntimeProvider';

const CartContext = createContext(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('CartProvider missing');
  return ctx;
}

export function CartProvider({ children }) {
  const { fetchInternal } = useRuntimeData();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchInternal('/api/runtime/cart');
      setCart(res?.cart || res);
    } catch (e) {
      setError(e?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [fetchInternal]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchInternal('/api/runtime/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item }),
        });
        setCart(res?.cart || res);
      } catch (e) {
        setError(e?.message || 'Failed to add item');
      } finally {
        setLoading(false);
      }
    },
    [fetchInternal]
  );

  const setQty = useCallback(
    async (sku, qty) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchInternal('/api/runtime/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'setQty', sku, qty }),
        });
        setCart(res?.cart || res);
      } catch (e) {
        setError(e?.message || 'Failed to update quantity');
      } finally {
        setLoading(false);
      }
    },
    [fetchInternal]
  );

  const removeItem = useCallback(
    async (sku) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchInternal(`/api/runtime/cart?sku=${encodeURIComponent(String(sku || ''))}`, {
          method: 'DELETE',
        });
        setCart(res?.cart || res);
      } catch (e) {
        setError(e?.message || 'Failed to remove item');
      } finally {
        setLoading(false);
      }
    },
    [fetchInternal]
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchInternal('/api/runtime/cart', { method: 'DELETE' });
      setCart(res?.cart || res);
    } catch (e) {
      setError(e?.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, [fetchInternal]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      refresh,
      addItem,
      setQty,
      removeItem,
      clearCart,
      count: Array.isArray(cart?.items) ? cart.items.reduce((n, it) => n + (Number(it.qty) || 0), 0) : 0,
    }),
    [cart, loading, error, refresh, addItem, setQty, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

