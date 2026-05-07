/**
 * Client-safe action execution. No arbitrary code — only whitelisted action shapes.
 * Pass a runtime from RuntimeProvider (client) for apiCall, refreshData, showToast.
 */

function isHttpUrlString(value) {
  if (typeof value !== 'string' || !value.length) return false;
  if (value.startsWith('//')) return false;
  return value.startsWith('/');
}

function isInternalApiPath(path) {
  if (typeof path !== 'string' || path.length < 6) return false;
  if (path.startsWith('//') || !path.startsWith('/api/')) return false;
  return true;
}

const SAFE_API_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * @param {object | null | undefined} action
 * @returns {boolean}
 */
export function isSafeNavigateAction(action) {
  if (!action || action.type !== 'navigate' || !isHttpUrlString(action.to)) return false;
  return true;
}

/**
 * @param {object | null | undefined} action
 * @returns {boolean}
 */
export function isSafeApiCallAction(action) {
  if (!action || action.type !== 'apiCall') return false;
  const targetPath = action.path || action.url;
  if (!isInternalApiPath(targetPath)) return false;
  const method = (action.method || 'GET').toUpperCase();
  if (!SAFE_API_METHODS.has(method)) return false;
  if (action.body != null) {
    if (typeof action.body !== 'object' || Array.isArray(action.body)) return false;
  }
  return true;
}

/**
 * @param {object | null | undefined} action
 * @returns {boolean}
 */
export function isSafeRefreshDataAction(action) {
  if (!action || (action.type !== 'refreshData' && action.type !== 'refreshPage')) return false;
  if (action.key != null && typeof action.key !== 'string') return false;
  return true;
}

/**
 * @param {object | null | undefined} action
 * @returns {boolean}
 */
export function isSafeShowToastAction(action) {
  if (!action || action.type !== 'showToast') return false;
  if (typeof action.message !== 'string' || !action.message.trim().length) return false;
  if (action.variant != null) {
    const v = String(action.variant);
    if (v !== 'success' && v !== 'error' && v !== 'info') return false;
  }
  return true;
}

/**
 * @param {object | null | undefined} action
 * @returns {boolean}
 */
export function isActionExecutable(action) {
  if (!action || typeof action !== 'object') return false;
  if (isSafeNavigateAction(action)) return true;
  if (isSafeApiCallAction(action)) return true;
  if (isSafeRefreshDataAction(action)) return true;
  if (isSafeShowToastAction(action)) return true;
  return false;
}

const noop = () => {};

/**
 * @typedef {{ fetchInternal: (path: string, options?: object) => Promise<unknown>; bumpRefresh: (key?: string) => void; showToast: (message: string, variant?: string) => void }} ActionRuntime
 */

/**
 * @param {object} action
 * @param {Partial<ActionRuntime>} [runtime]
 * @returns {Promise<{ ok: boolean; error?: string; data?: unknown }>}
 */
export async function executeAction(action, runtime) {
  const fetchInternal = typeof runtime?.fetchInternal === 'function' ? runtime.fetchInternal : null;
  const bumpRefresh = typeof runtime?.bumpRefresh === 'function' ? runtime.bumpRefresh : noop;
  const showToast = typeof runtime?.showToast === 'function' ? runtime.showToast : noop;

  if (!action || typeof action !== 'object') {
    return { ok: true };
  }
  if (isSafeNavigateAction(action)) {
    if (typeof window === 'undefined') return { ok: true };
    window.location.href = action.to;
    return { ok: true };
  }
  if (isSafeShowToastAction(action)) {
    showToast(action.message, action.variant || 'info');
    return { ok: true };
  }
  if (isSafeRefreshDataAction(action)) {
    if (action.type === 'refreshPage') {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return { ok: true, data: { message: 'Page refreshed' } };
    }
    bumpRefresh(action.key);
    return { ok: true, data: { message: 'Data refresh triggered' } };
  }
  if (isSafeApiCallAction(action) && fetchInternal) {
    const targetPath = action.path || action.url;
    const method = (action.method || 'GET').toUpperCase();
    const fetchOpts = { method };
    if (['POST', 'PUT', 'PATCH'].includes(method) && action.body != null) {
      fetchOpts.headers = { 'Content-Type': 'application/json' };
      fetchOpts.body = JSON.stringify(action.body);
    }
    try {
      const data = await fetchInternal(targetPath, fetchOpts);
      return { ok: true, data };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg, 'error');
      return { ok: false, error: msg };
    }
  }
  return { ok: false, error: 'Unsupported action' };
}
