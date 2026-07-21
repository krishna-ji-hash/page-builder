'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  beginClientAuthNavigation,
  fetchAuthMe,
  invalidateClientSessionCache,
} from '@/lib/auth/clientSession';

const AdminAuthContext = createContext(null);

/**
 * Single shared admin session source for the workspace shell.
 * One /api/auth/me fetch per mount (+ short TTL / in-flight dedupe).
 */
export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const result = await fetchAuthMe(options);
      setUser(result.ok ? result.data?.user || null : null);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidate = useCallback(() => {
    invalidateClientSessionCache();
    setUser(null);
  }, []);

  useEffect(() => {
    beginClientAuthNavigation();
    let cancelled = false;
    (async () => {
      const result = await fetchAuthMe();
      if (cancelled) return;
      setUser(result.ok ? result.data?.user || null : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, invalidate }),
    [user, loading, refresh, invalidate]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}

/** Optional hook when provider may be absent (e.g. isolated settings tests). */
export function useAdminAuthOptional() {
  return useContext(AdminAuthContext);
}
