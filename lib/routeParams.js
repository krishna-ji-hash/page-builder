export async function resolveMaybeAsyncParams(params) {
  if (params && typeof params.then === 'function') {
    return await params;
  }
  return params;
}

/** URL segment guard for project and page slugs */
export function isPublicSlug(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 180 &&
    !value.includes('/') &&
    !value.includes('\\')
  );
}
