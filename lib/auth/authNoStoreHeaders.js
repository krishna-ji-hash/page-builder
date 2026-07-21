/** Private auth responses must never be stored by shared caches / proxies. */
export const AUTH_NO_STORE_HEADERS = Object.freeze({
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Pragma: 'no-store',
});
