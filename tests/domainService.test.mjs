import assert from 'node:assert/strict';
import { buildDnsInstructions } from '../lib/platform/domainDns.js';

const dns = buildDnsInstructions('example.com', 'abc123token');

assert.equal(dns.apexARecord.host, '@');
assert.equal(dns.apexARecord.type, 'A');
assert.ok(dns.apexARecord.value);
assert.equal(dns.wwwCnameRecord.host, 'www');
assert.equal(dns.wwwCnameRecord.type, 'CNAME');
assert.equal(dns.wwwCnameRecord.value, 'example.com');
assert.equal(dns.txtRecord.type, 'TXT');
assert.ok(dns.txtRecord.value.includes('abc123token'));
assert.ok(dns.note);

console.log('domainService.test.mjs — all assertions passed');
