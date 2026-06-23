import { NextResponse } from 'next/server';
import {
  isAuthDisabled,
  isProtectedAdminPath,
  isProtectedApiPath,
} from './lib/auth/publicPaths.js';
import { requestHasAdminSessionCookie } from './lib/auth/sessionCookie.js';

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

function isLocalDevHost(host) {
  const h = normalizeHost(host);
  if (!h || h === 'localhost' || h === '127.0.0.1') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function forwardAdminPathname(request, pathname) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-pathname', pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * Custom domain + platform host routing.
 * Rewrites to /{projectSlug}/{pageSlug} preserving renderTree live pipeline.
 */
export async function middleware(request) {
  const host = normalizeHost(request.headers.get('host'));
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/preview')
  ) {
    try {
      const origin = request.nextUrl.origin;
      const res = await fetch(
        `${origin}/api/public/resolve-redirect?path=${encodeURIComponent(pathname)}&host=${encodeURIComponent(host)}`,
        { headers: { 'x-middleware-resolve': '1' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.redirect?.destination) {
          const dest = String(data.redirect.destination);
          const target = dest.startsWith('http') ? dest : new URL(dest, request.url).toString();
          return NextResponse.redirect(target, data.redirect.status || 301);
        }
      }
    } catch {
      /* continue */
    }
  }

  if (!isAuthDisabled()) {
    if (isProtectedAdminPath(pathname)) {
      if (!requestHasAdminSessionCookie(request)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return forwardAdminPathname(request, pathname);
    }

    if (isProtectedApiPath(pathname, request.method)) {
      if (!requestHasAdminSessionCookie(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  if (
    !host ||
    isLocalDevHost(host) ||
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
