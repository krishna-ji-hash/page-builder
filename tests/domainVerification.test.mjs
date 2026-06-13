import assert from 'node:assert/strict';
import {
  allowManualDomainVerify,
  expectedTxtRecordValue,
  flattenTxtRecords,
  txtRecordsMatch,
  verificationTxtHost,
  checkTxtVerification,
} from '../lib/platform/domainVerification.js';

assert.equal(expectedTxtRecordValue('tok123'), 'builder-verify=tok123');
assert.equal(verificationTxtHost('Example.COM'), '_builder-verify.example.com');
assert.deepEqual(flattenTxtRecords([['a'], ['b', 'c']]), ['a', 'b', 'c']);
assert.equal(txtRecordsMatch([['builder-verify=abc']], 'builder-verify=abc'), true);
assert.equal(txtRecordsMatch([['other']], 'builder-verify=abc'), false);

const originalEnv = { ...process.env };
process.env.NODE_ENV = 'development';
delete process.env.DOMAIN_VERIFY_STRICT;
delete process.env.DOMAIN_VERIFY_MANUAL;
assert.equal(allowManualDomainVerify(), true);

process.env.NODE_ENV = 'production';
assert.equal(allowManualDomainVerify(), false);

process.env.DOMAIN_VERIFY_MANUAL = 'true';
assert.equal(allowManualDomainVerify(), true);

process.env = originalEnv;

const dnsOk = await checkTxtVerification('example.com', 'tok', {
  resolveTxtFn: async () => [['builder-verify=tok']],
});
assert.equal(dnsOk.ok, true);

const dnsFail = await checkTxtVerification('example.com', 'tok', {
  resolveTxtFn: async () => [['wrong']],
});
assert.equal(dnsFail.ok, false);
assert.ok(dnsFail.error);

const dnsMissing = await checkTxtVerification('example.com', 'tok', {
  resolveTxtFn: async () => {
    const err = new Error('queryTxt ENOTFOUND');
    err.code = 'ENOTFOUND';
    throw err;
  },
});
assert.equal(dnsMissing.ok, false);

console.log('domainVerification.test.mjs — all assertions passed');
