/**
 * Best-effort client IP for rate limiting (respects common proxy headers).
 */
export function getClientIp(request) {
  const xff = request?.headers?.get?.('x-forwarded-for');
  if (xff && typeof xff === 'string') return xff.split(',')[0].trim();
  const xr = request?.headers?.get?.('x-real-ip');
  if (xr && typeof xr === 'string') return xr.trim();
  return 'unknown';
}
