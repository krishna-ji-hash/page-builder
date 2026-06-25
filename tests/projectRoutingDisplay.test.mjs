import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeDomainRouting,
  describeLocalhostRouting,
  summarizeProjectRouting,
} from '../lib/admin/projectRoutingDisplay.js';

const origin = 'http://localhost:3000';

test('default project is described for localhost only', () => {
  const project = { slug: 'main', homeSlug: 'home', status: 'ACTIVE', domain: null };
  const localhost = describeLocalhostRouting(project, { isDefault: true, origin });
  assert.equal(localhost.kind, 'default');
  assert.equal(localhost.url, 'http://localhost:3000/');

  const domain = describeDomainRouting(project, { origin });
  assert.equal(domain.kind, 'none');
});

test('non-default project without domain has no public urls', () => {
  const project = { slug: 'other', homeSlug: 'home', status: 'ACTIVE', domain: null };
  const localhost = describeLocalhostRouting(project, { isDefault: false, origin });
  assert.equal(localhost.kind, 'not-default');
  assert.equal(localhost.url, null);
});

test('domain project routes by host regardless of localhost default', () => {
  const project = {
    slug: 'dispatch',
    homeSlug: 'home',
    status: 'ACTIVE',
    domain: 'dispatch.local',
    domainStatus: 'PENDING',
  };
  const localhost = describeLocalhostRouting(project, { isDefault: false, origin });
  assert.equal(localhost.kind, 'not-default');

  const domain = describeDomainRouting(project, { origin });
  assert.equal(domain.kind, 'pending');
  assert.equal(domain.title, 'dispatch.local');
  assert.equal(domain.url, 'http://dispatch.local:3000/');
});

test('summarize combines localhost default and custom domain', () => {
  const project = {
    slug: 'x',
    status: 'ACTIVE',
    domain: 'client.com',
    domainStatus: 'VERIFIED',
  };
  const summary = summarizeProjectRouting(project, { isDefault: true, origin });
  assert.equal(summary, 'localhost default · client.com');
});
