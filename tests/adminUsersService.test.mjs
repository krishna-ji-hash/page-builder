import assert from 'node:assert/strict';
import {
  canAssignRole,
  canManageTargetUser,
  canManageUsers,
} from '../lib/admin/adminUserPolicy.js';

const superAdmin = { id: 1, role: 'super_admin' };
const admin = { id: 2, role: 'admin' };
const editor = { id: 3, role: 'editor' };

assert.equal(canManageUsers(superAdmin), true);
assert.equal(canManageUsers(admin), true);
assert.equal(canManageUsers(editor), false);

assert.equal(canManageTargetUser(admin, { role: 'editor' }), true);
assert.equal(canManageTargetUser(admin, { role: 'super_admin' }), false);
assert.equal(canManageTargetUser(superAdmin, { role: 'super_admin' }), true);

assert.equal(canAssignRole(superAdmin, 'super_admin'), true);
assert.equal(canAssignRole(admin, 'super_admin'), false);
assert.equal(canAssignRole(admin, 'editor'), true);

console.log('adminUsersService.test.mjs: ok');
