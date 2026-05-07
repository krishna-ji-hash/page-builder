'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RuntimeDataContext = createContext({
  fetchInternal: async () => {
    throw new Error('RuntimeProvider missing');
  },
  dataRefreshKey: 0,
  bumpRefresh: () => {},
  showToast: () => {},
  dismissToast: () => {},
  toast: null,
});

export function useRuntimeData() {
  return useContext(RuntimeDataContext);
}

function RuntimeToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast?.message) return undefined;
    const t = setTimeout(() => onDismiss(), 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast?.message) return null;
  const variant = toast.variant || 'info';
  return (
    <div
      className={`live-toast live-toast--${variant}`}
      role="status"
    >
      <span className="live-toast__text">{toast.message}</span>
      <button type="button" className="live-toast__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export function RuntimeProvider({ children }) {
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const bumpRefresh = useCallback((key) => {
    void key; /* future: per-source refresh if multiple listeners */
    setDataRefreshKey((k) => k + 1);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message, variant = 'info') => {
    if (typeof message !== 'string' || !message.trim()) return;
    setToast({ message: message.trim(), variant, id: Date.now() });
  }, []);

  const fetchInternal = useCallback(async (path, options = {}) => {
    if (typeof path !== 'string' || !path.startsWith('/api/')) {
      throw new Error('Only internal /api/ paths are allowed');
    }
    const method = options.method || 'GET';
    const res = await fetch(path, { method, headers: options.headers, body: options.body });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    const json = await res.json();
    if (json && typeof json === 'object' && 'success' in json) {
      if (!json.success) {
        throw new Error(json.message || 'Request failed');
      }
      return json.data;
    }
    return json;
  }, []);

  const value = useMemo(
    () => ({
      fetchInternal,
      dataRefreshKey,
      bumpRefresh,
      showToast,
      dismissToast,
      toast,
    }),
    [fetchInternal, dataRefreshKey, bumpRefresh, showToast, dismissToast, toast]
  );

  return (
    <RuntimeDataContext.Provider value={value}>
      <>
        {children}
        <div className="live-toast-host">
          <RuntimeToast toast={toast} onDismiss={dismissToast} />
        </div>
      </>
    </RuntimeDataContext.Provider>
  );
}
