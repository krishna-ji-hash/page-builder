import { NextResponse } from 'next/server';

const RESERVED = new Set([
  'admin',
  'api',
  'preview',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

function normalizeHost(host) {
  return String(host || '')
    .trim()
    .toLowerCase()
    .split(':')[0];
}

/**
 * Custom domain + platform host routing.
 * Rewrites to /{projectSlug}/{pageSlug} preserving renderTree live pipeline.
 */
export async function middleware(request) {
  const host = normalizeHost(request.headers.get('host'));
  const { pathname } = request.nextUrl;

  if (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/preview')
  ) {
    return NextResponse.next();
  }

  let projectSlug = null;
  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/platform/resolve-host?host=${encodeURIComponent(host)}`, {
      headers: { 'x-middleware-resolve': '1' },
    });
    if (res.ok) {
      const data = await res.json();
      projectSlug = data?.projectSlug || null;
    }
  } catch {
    return NextResponse.next();
  }

  if (!projectSlug) return NextResponse.next();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0] === projectSlug) {
    return NextResponse.next();
  }

  const pageSlug =
    segments.length === 0
      ? 'home'
      : segments.length === 1 && !RESERVED.has(segments[0].toLowerCase())
        ? segments[0]
        : segments.length === 1
          ? 'home'
          : null;

  if (!pageSlug) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${projectSlug}/${pageSlug}`;
  const response = NextResponse.rewrite(url);
  response.headers.set('x-resolved-project-slug', projectSlug);
  response.headers.set('x-resolved-host', host);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
