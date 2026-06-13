import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/auth/password.js';
import {
  canAccessProject,
  canManageProject,
  canWrite,
  isSuperAdmin,
} from '../lib/auth/permissions.js';
import { isPublicApiPath, isProtectedAdminPath, isProtectedApiPath } from '../lib/auth/publicPaths.js';
import { checkRateLimit } from '../lib/auth/rateLimit.js';

assert.equal(await verifyPassword('secret', await hashPassword('secret')), true);
assert.equal(await verifyPassword('wrong', await hashPassword('secret')), false);

const superAdmin = { role: 'super_admin', projectIds: [] };
const editor = { role: 'editor', projectIds: [5] };
const viewer = { role: 'viewer', projectIds: [5] };

assert.equal(isSuperAdmin(superAdmin), true);
assert.equal(canWrite(editor), true);
assert.equal(canWrite(viewer), false);
assert.equal(canAccessProject(editor, 5, 'write'), true);
assert.equal(canAccessProject(editor, 9, 'write'), false);
assert.equal(canAccessProject(superAdmin, 9, 'manage'), true);
assert.equal(canManageProject(editor), false);

assert.equal(isPublicApiPath('/api/forms/submit'), true);
assert.equal(isPublicApiPath('/api/forms/analytics', 'POST'), true);
assert.equal(isPublicApiPath('/api/forms/analytics', 'GET'), false);
assert.equal(isPublicApiPath('/api/runtime/cart'), true);
assert.equal(isPublicApiPath('/api/platform/resolve-host'), true);
assert.equal(isPublicApiPath('/api/projects'), false);

assert.equal(isProtectedAdminPath('/admin/builder'), true);
assert.equal(isProtectedAdminPath('/admin/login'), false);
assert.equal(isProtectedApiPath('/api/pages/1/publish'), true);
assert.equal(isProtectedApiPath('/api/forms/submit'), false);

const rl = checkRateLimit('test-key', { max: 2, windowMs: 60_000 });
assert.equal(rl.allowed, true);
const rl2 = checkRateLimit('test-key', { max: 2, windowMs: 60_000 });
assert.equal(rl2.allowed, true);
const rl3 = checkRateLimit('test-key', { max: 2, windowMs: 60_000 });
assert.equal(rl3.allowed, false);

console.log('adminAuth.test.mjs — all assertions passed');
