import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyProjectDomainHost } from '../lib/admin/projectDomainVerification.js';

test('.local domains auto-verify in local development', async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const result = await verifyProjectDomainHost('dispatch.local', 'localhost:3000');
    assert.equal(result.status, 'VERIFIED');
    assert.equal(result.method, 'local-dev');
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('matching request host verifies domain', async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = await verifyProjectDomainHost('example.com', 'example.com');
    assert.equal(result.status, 'VERIFIED');
    assert.equal(result.method, 'host-match');
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('missing domain fails verification', async () => {
  const result = await verifyProjectDomainHost(null, 'localhost:3000');
  assert.equal(result.status, 'FAILED');
  assert.equal(result.verified, false);
});

test('production DNS stub keeps status pending', async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = await verifyProjectDomainHost('client.example.com', 'builder.example.com');
    assert.equal(result.status, 'PENDING');
    assert.equal(result.method, 'dns-stub');
  } finally {
    process.env.NODE_ENV = prev;
  }
});
