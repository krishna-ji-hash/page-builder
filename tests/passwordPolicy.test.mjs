import assert from 'node:assert/strict';
import { validateNewPassword } from '../lib/auth/passwordPolicy.js';
import { isProtectedApiPath } from '../lib/auth/publicPaths.js';

assert.equal(validateNewPassword('').ok, false);
assert.equal(validateNewPassword('short').ok, false);
assert.equal(validateNewPassword('changeme').ok, false);
assert.equal(validateNewPassword('samepass', 'samepass').ok, false);
assert.equal(validateNewPassword('NewSecure1!', 'oldpass').ok, true);

assert.equal(isProtectedApiPath('/api/auth/change-password', 'POST'), true);
assert.equal(isProtectedApiPath('/api/auth/login', 'POST'), false);

console.log('passwordPolicy.test.mjs — all assertions passed');
