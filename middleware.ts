import { NextResponse, type NextRequest } from 'next/server';
import {
  isBuilderHost,
  isClientDomain,
  readRequestHost,
} from '@/lib/site/hostUtils';

function isAdminOrDPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/d' ||
    pathname.startsWith('/d/')
  );
}

function isAdminApiPath(pathname: string): boolean {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/');
}

function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1';
}

const PUBLIC_API_PREFIXES = [
  '/api/forms/submit',
  '/api/runtime/',
  '/api/platform/resolve-host',
  '/api/public/resolve-redirect',
  '/api/auth/login',
  '/api/auth/session-check',
];

function isPublicApiPath(pathname: string, method = 'GET'): boolean {
  const verb = String(method || 'GET').toUpperCase();
  if (pathname === '/api/forms/analytics' && verb === 'POST') return true;
  if (pathname.startsWith('/api/forms/analytics')) return false;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function isProtectedAdminPath(pathname: string): boolean {
  return (pathname === '/admin' || pathname.startsWith('/admin/')) && pathname !== '/admin/login';
}

function isProtectedDPath(pathname: string): boolean {
  return pathname === '/d' || pathname.startsWith('/d/');
}

function isProtectedApiPath(pathname: string, method = 'GET'): boolean {
  if (!pathname.startsWith('/api/')) return false;
  if (isPublicApiPath(pathname, method)) return false;
  if (pathname.startsWith('/api/auth/')) {
    return (
      pathname === '/api/auth/logout' ||
      pathname === '/api/auth/me' ||
      pathname === '/api/auth/change-password'
    );
  }
  return true;
}

function redirectToHome(request: NextRequest): NextResponse {
  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = '/';
  homeUrl.search = '';
  return NextResponse.redirect(homeUrl);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const origin = request.nextUrl.origin;
  try {
    const res = await fetch(`${origin}/api/auth/session-check`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * SEO redirects, builder-host admin guard, and session protection.
 * Public pages on client custom domains are never blocked here.
 */
export async function middleware(request: NextRequest) {
  const host = readRequestHost(
    request.headers.get('x-forwarded-host'),
    request.headers.get('host')
  );
  const { pathname } = request.nextUrl;
  const onBuilderHost = isBuilderHost(host);

  if (isAdminOrDPath(pathname) && isClientDomain(host)) {
    return redirectToHome(request);
  }

  if (isAdminApiPath(pathname) && !onBuilderHost) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/d') &&
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
    if (isProtectedAdminPath(pathname) || isProtectedDPath(pathname)) {
      const valid = await hasValidSession(request);
      if (!valid) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    if (isProtectedApiPath(pathname, request.method)) {
      const valid = await hasValidSession(request);
      if (!valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/d/:path*',
  ],
};
