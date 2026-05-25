'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_SITE_THEME,
  normalizeSiteTheme,
  SITE_THEME_PRESETS,
  siteThemeToCssVariableStyle,
} from '@/lib/siteDesignTheme';

const BuilderThemeContext = createContext(null);

const STORAGE_UI = 'builder-theme';
const STORAGE_SITE_CACHE_BASE = 'builder-site-theme-cache-v1';

function siteThemeCacheKey(projectId) {
  if (projectId == null || projectId === '') return `${STORAGE_SITE_CACHE_BASE}-global`;
  return `${STORAGE_SITE_CACHE_BASE}-p${projectId}`;
}

/** Optional offline / warm cache — never used as source of truth over server config. */
function writeSiteThemeCache(projectId, theme) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(siteThemeCacheKey(projectId), JSON.stringify(theme));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @typedef {object} SiteThemePersistence
 * @property {number} projectId
 * @property {object} [initialSiteTheme] — from `page.projectConfig.siteTheme` (authoritative when present)
 * @property {(normalized: object) => void} [onSiteThemeSaved]
 * @property {(message: string) => void} [onPersistError]
 * @property {() => Promise<void>} [onRevisionConflict] — e.g. reload builder state after 409
 */

/**
 * @param {{ current: (() => Promise<void>) | null }} [persistFlushRef] — optional ref assigned to flush debounced site-theme PATCH (e.g. before publish)
 */
export function BuilderThemeProvider({ children, persistence = null, persistFlushRef = null }) {
  const [theme, setTheme] = useState('dark');
  const [siteTheme, setSiteThemeState] = useState(() => DEFAULT_SITE_THEME);
  const [siteThemePersist, setSiteThemePersist] = useState({ status: 'idle', error: '' });
  const lastHydrateSigRef = useRef(null);
  const lastSavedJsonRef = useRef('');
  const persistenceRef = useRef(persistence);
  persistenceRef.current = persistence;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const siteThemeRef = useRef(siteTheme);
  siteThemeRef.current = siteTheme;
  const persistDebounceTimerRef = useRef(null);
  const persistDebounceAbortRef = useRef(null);
  const persistInFlightRef = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_UI);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_UI, theme);
  }, [theme]);

  const projectId = persistence?.projectId;
  const currentPageSlug = persistence?.pageSlug;

  const runPersistSiteTheme = useCallback(async (payload, signal) => {
    const prev = persistInFlightRef.current;
    if (prev) {
      try {
        await prev;
      } catch {
        // previous failure should not block the next persist attempt
      }
    }
    const pid = persistenceRef.current?.projectId;
    if (!pid) return;
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === lastSavedJsonRef.current) {
      setSiteThemePersist({ status: 'idle', error: '' });
      return;
    }
    const job = (async () => {
      try {
        const response = await fetch(`/api/projects/${pid}/site-theme`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteTheme: payload,
            ifRevision: payload.revision,
          }),
          signal,
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) {
          try {
            await persistenceRef.current?.onRevisionConflict?.();
            setSiteThemePersist({ status: 'idle', error: '' });
          } catch (reloadErr) {
            const msg = reloadErr instanceof Error ? reloadErr.message : String(reloadErr);
            setSiteThemePersist({ status: 'error', error: msg });
            persistenceRef.current?.onPersistError?.(msg);
          }
          return;
        }
        if (!response.ok) {
          const err = data?.error || `Save failed (${response.status})`;
          throw new Error(err);
        }
        const normalized = normalizeSiteTheme(data?.siteTheme ?? payload);
        lastSavedJsonRef.current = JSON.stringify(normalized);
        writeSiteThemeCache(pid, normalized);
        persistenceRef.current?.onSiteThemeSaved?.(normalized);
        setSiteThemePersist({ status: 'saved', error: '' });
      } catch (e) {
        if (e?.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : String(e);
        setSiteThemePersist({ status: 'error', error: message });
        persistenceRef.current?.onPersistError?.(message);
      }
    })();
    persistInFlightRef.current = job;
    try {
      await job;
    } finally {
      if (persistInFlightRef.current === job) {
        persistInFlightRef.current = null;
      }
    }
  }, []);

  const flushPendingSiteThemeSave = useCallback(async () => {
    if (persistDebounceTimerRef.current != null) {
      clearTimeout(persistDebounceTimerRef.current);
      persistDebounceTimerRef.current = null;
    }
    if (persistDebounceAbortRef.current) {
      persistDebounceAbortRef.current.abort();
      persistDebounceAbortRef.current = null;
    }
    const payload = siteThemeRef.current;
    await runPersistSiteTheme(payload, undefined);
  }, [runPersistSiteTheme]);

  useLayoutEffect(() => {
    if (!persistFlushRef) return undefined;
    persistFlushRef.current = flushPendingSiteThemeSave;
    return () => {
      persistFlushRef.current = null;
    };
  }, [persistFlushRef, flushPendingSiteThemeSave]);

  useLayoutEffect(() => {
    if (!projectId) return;
    const fromDb = persistence?.initialSiteTheme;
    const sig = `${projectId}:${JSON.stringify(fromDb ?? null)}`;
    if (lastHydrateSigRef.current === sig) return;
    lastHydrateSigRef.current = sig;
    const next = normalizeSiteTheme(fromDb ?? undefined);
    const json = JSON.stringify(next);
    setSiteThemeState(next);
    lastSavedJsonRef.current = json;
    writeSiteThemeCache(projectId, next);
    setSiteThemePersist({ status: 'idle', error: '' });
  }, [projectId, persistence?.initialSiteTheme]);

  useEffect(() => {
    if (!projectId) return;

    const json = JSON.stringify(siteTheme);
    if (json === lastSavedJsonRef.current) return;

    if (persistDebounceTimerRef.current != null) {
      clearTimeout(persistDebounceTimerRef.current);
      persistDebounceTimerRef.current = null;
    }
    if (persistDebounceAbortRef.current) {
      persistDebounceAbortRef.current.abort();
      persistDebounceAbortRef.current = null;
    }

    const controller = new AbortController();
    persistDebounceAbortRef.current = controller;
    persistDebounceTimerRef.current = setTimeout(() => {
      persistDebounceTimerRef.current = null;
      void runPersistSiteTheme(siteTheme, controller.signal).finally(() => {
        if (persistDebounceAbortRef.current === controller) {
          persistDebounceAbortRef.current = null;
        }
      });
    }, 550);

    return () => {
      if (persistDebounceTimerRef.current != null) {
        clearTimeout(persistDebounceTimerRef.current);
        persistDebounceTimerRef.current = null;
      }
      controller.abort();
      if (persistDebounceAbortRef.current === controller) {
        persistDebounceAbortRef.current = null;
      }
    };
  }, [siteTheme, projectId, runPersistSiteTheme]);

  const setSiteTheme = useCallback((next) => {
    setSiteThemeState((prev) => {
      const raw = typeof next === 'function' ? next(prev) : next;
      return normalizeSiteTheme(raw, {
        defaultRevision: prev.revision,
        defaultSchemaVersion: prev.schemaVersion,
      });
    });
  }, []);

  const applySitePreset = useCallback((presetId) => {
    setSiteThemeState((prev) => {
      const preset = SITE_THEME_PRESETS[presetId];
      if (!preset) return prev;
      return normalizeSiteTheme(
        { ...preset, presetId },
        { defaultRevision: prev.revision, defaultSchemaVersion: prev.schemaVersion }
      );
    });
  }, []);

  /** Builder chrome + published site tokens: live reads `projectConfig.siteTheme`, not local UI storage. */
  const toggleTheme = useCallback(() => {
    const current = themeRef.current;
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applySitePreset(next === 'dark' ? 'dark' : 'light');
  }, [applySitePreset]);

  const tokens = useMemo(
    () => ({
      primary: siteTheme.colors.primary,
      text: siteTheme.colors.text,
      fontFamily: siteTheme.typography.fontFamily,
      spacing: siteTheme.spacing,
    }),
    [siteTheme]
  );

  const setTokens = useCallback((updater) => {
    setSiteThemeState((prev) => {
      const flat = {
        primary: prev.colors.primary,
        text: prev.colors.text,
        fontFamily: prev.typography.fontFamily,
        spacing: { ...prev.spacing },
      };
      const nextFlat = typeof updater === 'function' ? updater(flat) : { ...flat, ...updater };
      return normalizeSiteTheme(
        {
          ...prev,
          colors: {
            ...prev.colors,
            primary: nextFlat.primary ?? prev.colors.primary,
            text: nextFlat.text ?? prev.colors.text,
          },
          typography: {
            ...prev.typography,
            fontFamily: nextFlat.fontFamily ?? prev.typography.fontFamily,
          },
          spacing: { ...prev.spacing, ...(nextFlat.spacing || {}) },
        },
        { defaultRevision: prev.revision, defaultSchemaVersion: prev.schemaVersion }
      );
    });
  }, []);

  const cssVarStyle = useMemo(() => siteThemeToCssVariableStyle(siteTheme), [siteTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      siteTheme,
      setSiteTheme,
      applySitePreset,
      tokens,
      setTokens,
      siteThemePersist,
      currentPageSlug,
      toggleTheme,
    }),
    [theme, siteTheme, setSiteTheme, applySitePreset, toggleTheme, tokens, setTokens, siteThemePersist, currentPageSlug]
  );

  return (
    <BuilderThemeContext.Provider value={value}>
      <div
        className="bld-builder-root"
        data-builder-theme={theme}
        style={{
          ...cssVarStyle,
          fontFamily: siteTheme.typography.fontFamily,
        }}
      >
        {children}
      </div>
    </BuilderThemeContext.Provider>
  );
}

export function useBuilderTheme() {
  const context = useContext(BuilderThemeContext);
  if (!context) {
    throw new Error('useBuilderTheme must be used inside BuilderThemeProvider');
  }
  return context;
}
