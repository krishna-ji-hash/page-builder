import assert from 'node:assert/strict';
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_LOGIN_PATH,
  resolveAdminLoginRedirectTarget,
} from '../lib/admin/adminRoutes.js';
import {
  readAdminSessionTokenFromCookieHeader,
  readAdminSessionTokenFromRequest,
  requestHasAdminSessionCookie,
} from '../lib/auth/sessionCookie.js';

assert.equal(resolveAdminLoginRedirectTarget(null), ADMIN_DASHBOARD_PATH);
assert.equal(resolveAdminLoginRedirectTarget(''), ADMIN_DASHBOARD_PATH);
assert.equal(
  resolveAdminLoginRedirectTarget(encodeURIComponent('/admin/projects/d/pages')),
  '/admin/projects/d/pages'
);
assert.equal(resolveAdminLoginRedirectTarget(ADMIN_LOGIN_PATH), ADMIN_DASHBOARD_PATH);
assert.equal(resolveAdminLoginRedirectTarget('https://evil.test'), ADMIN_DASHBOARD_PATH);

const cookieHeader = 'foo=bar; bld_admin_session=abc123; baz=qux';
assert.equal(readAdminSessionTokenFromCookieHeader(cookieHeader), 'abc123');
assert.equal(readAdminSessionTokenFromCookieHeader('foo=bar'), null);

const request = {
  cookies: {
    get(name) {
      return name === 'bld_admin_session' ? { value: 'from-jar' } : undefined;
    },
  },
  headers: {
    get(name) {
      return name === 'cookie' ? cookieHeader : null;
    },
  },
};
assert.equal(readAdminSessionTokenFromRequest(request), 'from-jar');
assert.equal(requestHasAdminSessionCookie(request), true);

const headerOnlyRequest = {
  cookies: { get: () => undefined },
  headers: { get: () => cookieHeader },
};
assert.equal(readAdminSessionTokenFromRequest(headerOnlyRequest), 'abc123');

console.log('adminSessionCookie.test.mjs — all assertions passed');
