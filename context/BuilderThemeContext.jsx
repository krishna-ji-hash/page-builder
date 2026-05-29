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
import {
  alignThemeTokensWithSiteTheme,
  createModePalettesFromFlat,
  DEFAULT_THEME_TOKENS,
  hasModePalettes,
  normalizeThemeTokens,
  themeTokensToCssVariableStyle,
} from '@/lib/themeTokens';
import { DEFAULT_STYLE_PRESETS, normalizeStylePresets } from '@/lib/stylePresetsStore';
import { DEFAULT_ANIMATION_PRESETS, normalizeAnimationPresets } from '@/lib/animationPresetsStore';

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
  const [themeTokens, setThemeTokensState] = useState(() => DEFAULT_THEME_TOKENS);
  const [themeTokensPersist, setThemeTokensPersist] = useState({ status: 'idle', error: '' });
  const [stylePresets, setStylePresetsState] = useState(() => DEFAULT_STYLE_PRESETS);
  const [stylePresetsPersist, setStylePresetsPersist] = useState({ status: 'idle', error: '' });
  const [animationPresets, setAnimationPresetsState] = useState(() => DEFAULT_ANIMATION_PRESETS);
  const [animationPresetsPersist, setAnimationPresetsPersist] = useState({ status: 'idle', error: '' });
  const lastHydrateSigRef = useRef(null);
  const lastSavedJsonRef = useRef('');
  const lastSavedTokensJsonRef = useRef('');
  const lastSavedPresetsJsonRef = useRef('');
  const persistenceRef = useRef(persistence);
  persistenceRef.current = persistence;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const siteThemeRef = useRef(siteTheme);
  siteThemeRef.current = siteTheme;
  const themeTokensRef = useRef(themeTokens);
  themeTokensRef.current = themeTokens;
  const persistDebounceTimerRef = useRef(null);
  const persistDebounceAbortRef = useRef(null);
  const persistInFlightRef = useRef(null);
  const persistTokensDebounceTimerRef = useRef(null);
  const persistTokensDebounceAbortRef = useRef(null);
  const persistTokensInFlightRef = useRef(null);
  const persistPresetsDebounceTimerRef = useRef(null);
  const persistPresetsDebounceAbortRef = useRef(null);
  const persistPresetsInFlightRef = useRef(null);
  const persistAnimPresetsDebounceTimerRef = useRef(null);
  const persistAnimPresetsDebounceAbortRef = useRef(null);
  const persistAnimPresetsInFlightRef = useRef(null);
  const lastSavedAnimPresetsJsonRef = useRef('');

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

  const runPersistThemeTokens = useCallback(async (payload, signal) => {
    const prev = persistTokensInFlightRef.current;
    if (prev) {
      try {
        await prev;
      } catch {
        // ignore
      }
    }
    const pid = persistenceRef.current?.projectId;
    if (!pid) return;
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === lastSavedTokensJsonRef.current) {
      setThemeTokensPersist({ status: 'idle', error: '' });
      return;
    }
    const job = (async () => {
      try {
        const response = await fetch(`/api/projects/${pid}/theme-tokens`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            themeTokens: payload,
            ifRevision: payload.revision,
          }),
          signal,
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) {
          try {
            await persistenceRef.current?.onRevisionConflict?.();
            setThemeTokensPersist({ status: 'idle', error: '' });
          } catch (reloadErr) {
            const msg = reloadErr instanceof Error ? reloadErr.message : String(reloadErr);
            setThemeTokensPersist({ status: 'error', error: msg });
            persistenceRef.current?.onPersistError?.(msg);
          }
          return;
        }
        if (!response.ok) {
          const err = data?.error || `Save failed (${response.status})`;
          throw new Error(err);
        }
        const normalized = normalizeThemeTokens(data?.themeTokens ?? payload);
        lastSavedTokensJsonRef.current = JSON.stringify(normalized);
        setThemeTokensPersist({ status: 'saved', error: '' });
      } catch (e) {
        if (e?.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : String(e);
        setThemeTokensPersist({ status: 'error', error: message });
        persistenceRef.current?.onPersistError?.(message);
      }
    })();
    persistTokensInFlightRef.current = job;
    try {
      await job;
    } finally {
      if (persistTokensInFlightRef.current === job) {
        persistTokensInFlightRef.current = null;
      }
    }
  }, []);

  const runPersistStylePresets = useCallback(async (payload, signal) => {
    const prev = persistPresetsInFlightRef.current;
    if (prev) {
      try {
        await prev;
      } catch {
        // ignore
      }
    }
    const pid = persistenceRef.current?.projectId;
    if (!pid) return;
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === lastSavedPresetsJsonRef.current) {
      setStylePresetsPersist({ status: 'idle', error: '' });
      return;
    }
    const job = (async () => {
      try {
        const response = await fetch(`/api/projects/${pid}/style-presets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stylePresets: payload,
            ifRevision: payload.revision,
          }),
          signal,
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) {
          try {
            await persistenceRef.current?.onRevisionConflict?.();
            setStylePresetsPersist({ status: 'idle', error: '' });
          } catch (reloadErr) {
            const msg = reloadErr instanceof Error ? reloadErr.message : String(reloadErr);
            setStylePresetsPersist({ status: 'error', error: msg });
            persistenceRef.current?.onPersistError?.(msg);
          }
          return;
        }
        if (!response.ok) {
          const err = data?.error || `Save failed (${response.status})`;
          throw new Error(err);
        }
        const normalized = normalizeStylePresets(data?.stylePresets ?? payload);
        lastSavedPresetsJsonRef.current = JSON.stringify(normalized);
        setStylePresetsPersist({ status: 'saved', error: '' });
      } catch (e) {
        if (e?.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : String(e);
        setStylePresetsPersist({ status: 'error', error: message });
        persistenceRef.current?.onPersistError?.(message);
      }
    })();
    persistPresetsInFlightRef.current = job;
    try {
      await job;
    } finally {
      if (persistPresetsInFlightRef.current === job) {
        persistPresetsInFlightRef.current = null;
      }
    }
  }, []);

  const runPersistAnimationPresets = useCallback(async (payload, signal) => {
    const prev = persistAnimPresetsInFlightRef.current;
    if (prev) {
      try {
        await prev;
      } catch {
        // ignore
      }
    }
    const pid = persistenceRef.current?.projectId;
    if (!pid) return;
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === lastSavedAnimPresetsJsonRef.current) {
      setAnimationPresetsPersist({ status: 'idle', error: '' });
      return;
    }
    const job = (async () => {
      try {
        const response = await fetch(`/api/projects/${pid}/animation-presets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animationPresets: payload,
            ifRevision: payload.revision,
          }),
          signal,
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) {
          try {
            await persistenceRef.current?.onRevisionConflict?.();
            setAnimationPresetsPersist({ status: 'idle', error: '' });
          } catch (reloadErr) {
            const msg = reloadErr instanceof Error ? reloadErr.message : String(reloadErr);
            setAnimationPresetsPersist({ status: 'error', error: msg });
            persistenceRef.current?.onPersistError?.(msg);
          }
          return;
        }
        if (!response.ok) {
          const err = data?.error || `Save failed (${response.status})`;
          throw new Error(err);
        }
        const normalized = normalizeAnimationPresets(data?.animationPresets ?? payload);
        lastSavedAnimPresetsJsonRef.current = JSON.stringify(normalized);
        setAnimationPresetsPersist({ status: 'saved', error: '' });
      } catch (e) {
        if (e?.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : String(e);
        setAnimationPresetsPersist({ status: 'error', error: message });
        persistenceRef.current?.onPersistError?.(message);
      }
    })();
    persistAnimPresetsInFlightRef.current = job;
    try {
      await job;
    } finally {
      if (persistAnimPresetsInFlightRef.current === job) {
        persistAnimPresetsInFlightRef.current = null;
      }
    }
  }, []);

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
    const fromDbTokens = persistence?.initialThemeTokens;
    const fromDbPresets = persistence?.initialStylePresets;
    const fromDbAnimPresets = persistence?.initialAnimationPresets;
    const sig = `${projectId}:${JSON.stringify(fromDb ?? null)}:${JSON.stringify(fromDbTokens ?? null)}:${JSON.stringify(fromDbPresets ?? null)}:${JSON.stringify(fromDbAnimPresets ?? null)}`;
    if (lastHydrateSigRef.current === sig) return;
    lastHydrateSigRef.current = sig;
    let next = normalizeSiteTheme(fromDb ?? undefined);
    const nextTokensRaw = normalizeThemeTokens(fromDbTokens ?? undefined);

    if (typeof window !== 'undefined') {
      const uiTheme = window.localStorage.getItem(STORAGE_UI);
      if ((uiTheme === 'dark' || uiTheme === 'light') && next.presetId !== uiTheme) {
        const preset = SITE_THEME_PRESETS[uiTheme];
        if (preset) {
          next = normalizeSiteTheme(
            { ...preset, presetId: uiTheme },
            { defaultRevision: next.revision, defaultSchemaVersion: next.schemaVersion }
          );
        }
      }
    }

    const json = JSON.stringify(next);
    setSiteThemeState(next);
    lastSavedJsonRef.current = json;
    writeSiteThemeCache(projectId, next);
    setSiteThemePersist({ status: 'idle', error: '' });

    let nextTokens = alignThemeTokensWithSiteTheme(next, nextTokensRaw);
    if (typeof window !== 'undefined') {
      const uiTheme = window.localStorage.getItem(STORAGE_UI);
      if (uiTheme === 'dark' || uiTheme === 'light') {
        if (hasModePalettes(nextTokens)) {
          if (nextTokens.mode !== uiTheme) nextTokens = normalizeThemeTokens({ ...nextTokens, mode: uiTheme });
        } else {
          const { light, dark } = createModePalettesFromFlat(nextTokens);
          nextTokens = normalizeThemeTokens({ ...nextTokens, mode: uiTheme, light, dark });
        }
      }
    }
    setThemeTokensState(nextTokens);
    lastSavedTokensJsonRef.current = JSON.stringify(nextTokens);
    setThemeTokensPersist({ status: 'idle', error: '' });

    const nextPresets = normalizeStylePresets(fromDbPresets ?? undefined);
    setStylePresetsState(nextPresets);
    lastSavedPresetsJsonRef.current = JSON.stringify(nextPresets);
    setStylePresetsPersist({ status: 'idle', error: '' });

    const nextAnimPresets = normalizeAnimationPresets(fromDbAnimPresets ?? undefined);
    setAnimationPresetsState(nextAnimPresets);
    lastSavedAnimPresetsJsonRef.current = JSON.stringify(nextAnimPresets);
    setAnimationPresetsPersist({ status: 'idle', error: '' });
  }, [
    projectId,
    persistence?.initialSiteTheme,
    persistence?.initialThemeTokens,
    persistence?.initialStylePresets,
    persistence?.initialAnimationPresets,
  ]);

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

  useEffect(() => {
    if (!projectId) return;
    const json = JSON.stringify(themeTokens);
    if (json === lastSavedTokensJsonRef.current) return;

    if (persistTokensDebounceTimerRef.current != null) {
      clearTimeout(persistTokensDebounceTimerRef.current);
      persistTokensDebounceTimerRef.current = null;
    }
    if (persistTokensDebounceAbortRef.current) {
      persistTokensDebounceAbortRef.current.abort();
      persistTokensDebounceAbortRef.current = null;
    }

    const controller = new AbortController();
    persistTokensDebounceAbortRef.current = controller;
    persistTokensDebounceTimerRef.current = setTimeout(() => {
      persistTokensDebounceTimerRef.current = null;
      void runPersistThemeTokens(themeTokens, controller.signal).finally(() => {
        if (persistTokensDebounceAbortRef.current === controller) {
          persistTokensDebounceAbortRef.current = null;
        }
      });
    }, 550);

    return () => {
      if (persistTokensDebounceTimerRef.current != null) {
        clearTimeout(persistTokensDebounceTimerRef.current);
        persistTokensDebounceTimerRef.current = null;
      }
      controller.abort();
      if (persistTokensDebounceAbortRef.current === controller) {
        persistTokensDebounceAbortRef.current = null;
      }
    };
  }, [themeTokens, projectId, runPersistThemeTokens]);

  useEffect(() => {
    if (!projectId) return;
    const json = JSON.stringify(stylePresets);
    if (json === lastSavedPresetsJsonRef.current) return;

    if (persistPresetsDebounceTimerRef.current != null) {
      clearTimeout(persistPresetsDebounceTimerRef.current);
      persistPresetsDebounceTimerRef.current = null;
    }
    if (persistPresetsDebounceAbortRef.current) {
      persistPresetsDebounceAbortRef.current.abort();
      persistPresetsDebounceAbortRef.current = null;
    }

    const controller = new AbortController();
    persistPresetsDebounceAbortRef.current = controller;
    persistPresetsDebounceTimerRef.current = setTimeout(() => {
      persistPresetsDebounceTimerRef.current = null;
      void runPersistStylePresets(stylePresets, controller.signal).finally(() => {
        if (persistPresetsDebounceAbortRef.current === controller) {
          persistPresetsDebounceAbortRef.current = null;
        }
      });
    }, 550);

    return () => {
      if (persistPresetsDebounceTimerRef.current != null) {
        clearTimeout(persistPresetsDebounceTimerRef.current);
        persistPresetsDebounceTimerRef.current = null;
      }
      controller.abort();
      if (persistPresetsDebounceAbortRef.current === controller) {
        persistPresetsDebounceAbortRef.current = null;
      }
    };
  }, [stylePresets, projectId, runPersistStylePresets]);

  useEffect(() => {
    if (!projectId) return;
    const json = JSON.stringify(animationPresets);
    if (json === lastSavedAnimPresetsJsonRef.current) return;

    if (persistAnimPresetsDebounceTimerRef.current != null) {
      clearTimeout(persistAnimPresetsDebounceTimerRef.current);
      persistAnimPresetsDebounceTimerRef.current = null;
    }
    if (persistAnimPresetsDebounceAbortRef.current) {
      persistAnimPresetsDebounceAbortRef.current.abort();
      persistAnimPresetsDebounceAbortRef.current = null;
    }

    const controller = new AbortController();
    persistAnimPresetsDebounceAbortRef.current = controller;
    persistAnimPresetsDebounceTimerRef.current = setTimeout(() => {
      persistAnimPresetsDebounceTimerRef.current = null;
      void runPersistAnimationPresets(animationPresets, controller.signal).finally(() => {
        if (persistAnimPresetsDebounceAbortRef.current === controller) {
          persistAnimPresetsDebounceAbortRef.current = null;
        }
      });
    }, 550);

    return () => {
      if (persistAnimPresetsDebounceTimerRef.current != null) {
        clearTimeout(persistAnimPresetsDebounceTimerRef.current);
        persistAnimPresetsDebounceTimerRef.current = null;
      }
      controller.abort();
      if (persistAnimPresetsDebounceAbortRef.current === controller) {
        persistAnimPresetsDebounceAbortRef.current = null;
      }
    };
  }, [animationPresets, projectId, runPersistAnimationPresets]);

  const setSiteTheme = useCallback((next) => {
    setSiteThemeState((prev) => {
      const raw = typeof next === 'function' ? next(prev) : next;
      return normalizeSiteTheme(raw, {
        defaultRevision: prev.revision,
        defaultSchemaVersion: prev.schemaVersion,
      });
    });
  }, []);

  const setThemeTokens = useCallback((next) => {
    setThemeTokensState((prev) => {
      const raw = typeof next === 'function' ? next(prev) : next;
      return normalizeThemeTokens(raw, {
        defaultRevision: prev.revision,
        defaultSchemaVersion: prev.schemaVersion,
      });
    });
  }, []);

  const setStylePresets = useCallback((next) => {
    setStylePresetsState((prev) => {
      const raw = typeof next === 'function' ? next(prev) : next;
      return normalizeStylePresets(raw, {
        defaultRevision: prev.revision,
        defaultSchemaVersion: prev.schemaVersion,
      });
    });
  }, []);

  const setAnimationPresets = useCallback((next) => {
    setAnimationPresetsState((prev) => {
      const raw = typeof next === 'function' ? next(prev) : next;
      return normalizeAnimationPresets(raw, {
        defaultRevision: prev.revision,
        defaultSchemaVersion: prev.schemaVersion,
      });
    });
  }, []);

  const applySitePreset = useCallback((presetId) => {
    const mode = presetId === 'dark' ? 'dark' : 'light';
    setSiteThemeState((prev) => {
      const preset = SITE_THEME_PRESETS[presetId];
      if (!preset) return prev;
      return normalizeSiteTheme(
        { ...preset, presetId },
        { defaultRevision: prev.revision, defaultSchemaVersion: prev.schemaVersion }
      );
    });
    setThemeTokensState((prev) => {
      if (prev.mode === mode && hasModePalettes(prev)) return prev;
      if (hasModePalettes(prev)) return { ...prev, mode };
      const { light, dark } = createModePalettesFromFlat(prev);
      return { ...prev, mode, light, dark };
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
  const tokenVarStyle = useMemo(
    () => themeTokensToCssVariableStyle(alignThemeTokensWithSiteTheme(siteTheme, themeTokens)),
    [siteTheme, themeTokens]
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      siteTheme,
      setSiteTheme,
      themeTokens,
      setThemeTokens,
      stylePresets,
      setStylePresets,
      animationPresets,
      setAnimationPresets,
      applySitePreset,
      tokens,
      setTokens,
      siteThemePersist,
      themeTokensPersist,
      stylePresetsPersist,
      animationPresetsPersist,
      currentPageSlug,
      toggleTheme,
    }),
    [
      theme,
      siteTheme,
      setSiteTheme,
      themeTokens,
      setThemeTokens,
      stylePresets,
      setStylePresets,
      animationPresets,
      setAnimationPresets,
      applySitePreset,
      toggleTheme,
      tokens,
      setTokens,
      siteThemePersist,
      themeTokensPersist,
      stylePresetsPersist,
      animationPresetsPersist,
      currentPageSlug,
    ]
  );

  return (
    <BuilderThemeContext.Provider value={value}>
      <div
        className="bld-builder-root"
        data-builder-theme={theme}
        style={{
          ...cssVarStyle,
          ...tokenVarStyle,
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
