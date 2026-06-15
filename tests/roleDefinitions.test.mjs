import assert from 'node:assert/strict';
import {
  getRoleDefinition,
  PERMISSION_MODULES,
  ROLE_DEFINITIONS,
} from '../lib/admin/roleDefinitions.js';
import { ROLES } from '../lib/auth/constants.js';

assert.equal(ROLE_DEFINITIONS.length, 4);
assert.ok(getRoleDefinition(ROLES.EDITOR));
assert.equal(getRoleDefinition('invalid'), null);

for (const role of ROLE_DEFINITIONS) {
  for (const mod of PERMISSION_MODULES) {
    assert.ok(role.permissions[mod.id], `${role.id} missing ${mod.id}`);
  }
}

console.log('roleDefinitions.test.mjs: ok');
