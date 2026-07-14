/**
 * Sync category tabs, search, and filters across split blog hub sections on one page.
 * Full-page blog widget uses local React state only; split sections use this bus.
 */

export const BLOG_HUB_CATEGORY_EVENT = 'bloghub:category-change';
export const BLOG_HUB_SEARCH_EVENT = 'bloghub:search-change';

/** @type {Map<string, { categoryId: string, searchQuery: string }>} */
const hubState = new Map();

function normalizeGroupId(groupId) {
  const id = String(groupId || 'default').trim();
  return id || 'default';
}

export function getBlogHubState(groupId = 'default') {
  const key = normalizeGroupId(groupId);
  return hubState.get(key) || { categoryId: 'all', searchQuery: '' };
}

/**
 * @param {string} categoryId
 * @param {string} [groupId]
 */
export function publishBlogHubCategory(categoryId, groupId = 'default') {
  const key = normalizeGroupId(groupId);
  const nextCategory = String(categoryId || 'all').trim() || 'all';
  const prev = getBlogHubState(key);
  hubState.set(key, { ...prev, categoryId: nextCategory });
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(BLOG_HUB_CATEGORY_EVENT, {
      detail: { groupId: key, categoryId: nextCategory },
    })
  );
}

/**
 * @param {string} searchQuery
 * @param {string} [groupId]
 */
export function publishBlogHubSearch(searchQuery, groupId = 'default') {
  const key = normalizeGroupId(groupId);
  const nextQuery = String(searchQuery ?? '');
  const prev = getBlogHubState(key);
  hubState.set(key, { ...prev, searchQuery: nextQuery });
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(BLOG_HUB_SEARCH_EVENT, {
      detail: { groupId: key, searchQuery: nextQuery },
    })
  );
}

/**
 * @param {(categoryId: string) => void} callback
 * @param {string} [groupId]
 * @returns {() => void}
 */
export function subscribeBlogHubCategory(callback, groupId = 'default') {
  if (typeof window === 'undefined') return () => {};
  const key = normalizeGroupId(groupId);
  const handler = (event) => {
    const detail = event?.detail;
    if (!detail || detail.groupId !== key) return;
    callback(String(detail.categoryId || 'all'));
  };
  window.addEventListener(BLOG_HUB_CATEGORY_EVENT, handler);
  return () => window.removeEventListener(BLOG_HUB_CATEGORY_EVENT, handler);
}

/**
 * @param {(searchQuery: string) => void} callback
 * @param {string} [groupId]
 * @returns {() => void}
 */
export function subscribeBlogHubSearch(callback, groupId = 'default') {
  if (typeof window === 'undefined') return () => {};
  const key = normalizeGroupId(groupId);
  const handler = (event) => {
    const detail = event?.detail;
    if (!detail || detail.groupId !== key) return;
    callback(String(detail.searchQuery ?? ''));
  };
  window.addEventListener(BLOG_HUB_SEARCH_EVENT, handler);
  return () => window.removeEventListener(BLOG_HUB_SEARCH_EVENT, handler);
}
