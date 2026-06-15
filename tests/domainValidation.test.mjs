import assert from 'node:assert/strict';
import { validateDomainInput, normalizeDomain } from '../lib/platform/domainValidation.js';

assert.equal(normalizeDomain('HTTPS://WWW.Example.COM/path'), 'www.example.com');

const bad = validateDomainInput('www.example.com');
assert.equal(bad.ok, false);

const good = validateDomainInput('example.com');
assert.equal(good.ok, true);
assert.equal(good.domain, 'example.com');

const invalid = validateDomainInput('not a domain');
assert.equal(invalid.ok, false);

console.log('domainValidation.test.mjs — all assertions passed');
