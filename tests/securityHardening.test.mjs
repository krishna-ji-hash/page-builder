import assert from 'node:assert/strict';
import { verifyAdminMutationOrigin, isMutationMethod } from '../lib/auth/csrf.js';
import { checkFormSubmitRateLimit, checkFormAnalyticsRateLimit } from '../lib/auth/formRateLimit.js';
import { isPublicApiPath, isProtectedApiPath } from '../lib/auth/publicPaths.js';
import { validateEnv } from '../lib/envValidation.js';

assert.equal(isMutationMethod('POST'), true);
assert.equal(isMutationMethod('get'), false);

const badOrigin = { method: 'POST', headers: { get: (k) => (k === 'origin' ? 'https://evil.example' : null) } };
const bad = verifyAdminMutationOrigin(badOrigin);
assert.equal(bad.ok, false);

const goodOrigin = { method: 'POST', headers: { get: (k) => (k === 'origin' ? 'http://localhost:3000' : null) } };
const good = verifyAdminMutationOrigin(goodOrigin);
assert.equal(good.ok, true);

const getReq = { method: 'GET', headers: { get: () => null } };
assert.equal(verifyAdminMutationOrigin(getReq).ok, true);

assert.equal(isPublicApiPath('/api/forms/submit'), true);
assert.equal(isPublicApiPath('/api/forms/analytics', 'POST'), true);
assert.equal(isPublicApiPath('/api/forms/analytics', 'GET'), false);
assert.equal(isProtectedApiPath('/api/forms/analytics', 'GET'), true);
assert.equal(isProtectedApiPath('/api/forms/analytics', 'POST'), false);

const fsKey = `sec-form-${Date.now()}`;
let blocked = false;
for (let i = 0; i < 12; i += 1) {
  const r = checkFormSubmitRateLimit('127.0.0.1', fsKey);
  if (!r.allowed) blocked = true;
}
assert.equal(blocked, true);

const faKey = `sec-analytics-${Date.now()}`;
let faBlocked = false;
for (let i = 0; i < 45; i += 1) {
  const r = checkFormAnalyticsRateLimit('127.0.0.1', faKey);
  if (!r.allowed) faBlocked = true;
}
assert.equal(faBlocked, true);

const prev = { ...process.env };
try {
  process.env.NODE_ENV = 'production';
  process.env.MYSQL_HOST = '127.0.0.1';
  process.env.MYSQL_USER = 'root';
  process.env.MYSQL_DATABASE = 'documents';
  process.env.AUTH_SECRET = 'short';
  assert.throws(() => validateEnv(), /AUTH_SECRET must be at least 32/);

  process.env.AUTH_SECRET = 'x'.repeat(32);
  process.env.BUILDER_APP_HOST = 'builder.yourdomain.com';
  process.env.ADMIN_BOOTSTRAP_PASSWORD = 'changeme';
  validateEnv();

  process.env.BUILDER_APP_HOST = 'builder.production.example';
  assert.throws(() => validateEnv(), /too weak/);

  process.env.ADMIN_BOOTSTRAP_PASSWORD = 'StrongP@ssw0rd-Phase9';
  process.env.BUILDER_APP_HOST = 'builder.production.example';
  validateEnv();
} finally {
  process.env.NODE_ENV = prev.NODE_ENV;
  process.env.MYSQL_HOST = prev.MYSQL_HOST;
  process.env.MYSQL_USER = prev.MYSQL_USER;
  process.env.MYSQL_DATABASE = prev.MYSQL_DATABASE;
  process.env.AUTH_SECRET = prev.AUTH_SECRET;
  process.env.ADMIN_BOOTSTRAP_PASSWORD = prev.ADMIN_BOOTSTRAP_PASSWORD;
  process.env.BUILDER_APP_HOST = prev.BUILDER_APP_HOST;
}

console.log('securityHardening.test.mjs: ok');
