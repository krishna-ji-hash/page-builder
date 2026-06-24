import assert from 'node:assert/strict';
import test from 'node:test';
import { buildServerDomainMap, collectProjectDomains } from '../lib/admin/buildServerDomainMap.js';

const origin = 'http://localhost:3000';

test('buildServerDomainMap lists localhost default and each project domain', () => {
  const projects = [
    {
      id: 1,
      name: 'Site A',
      slug: 'a',
      status: 'ACTIVE',
      domain: 'housethat.com',
      domainStatus: 'PENDING',
      connectedDomains: [],
    },
    {
      id: 2,
      name: 'Site B',
      slug: 'b',
      status: 'ACTIVE',
      domain: 'dispatch.local',
      domainStatus: 'PENDING',
      connectedDomains: [{ domain: 'www.dispatch.local', verified: false, isPrimary: false }],
    },
  ];

  const rows = buildServerDomainMap(projects, 1, origin);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].kind, 'localhost-default');
  assert.equal(rows[0].projectSlug, 'a');
  assert.ok(rows.some((r) => r.host === 'housethat.com' && r.projectSlug === 'a'));
  assert.ok(rows.some((r) => r.host === 'dispatch.local' && r.projectSlug === 'b'));
  assert.ok(rows.some((r) => r.host === 'www.dispatch.local' && r.projectSlug === 'b'));
});

test('collectProjectDomains dedupes primary and connected rows', () => {
  const project = {
    domain: 'example.com',
    domainStatus: 'VERIFIED',
    connectedDomains: [
      { domain: 'example.com', verified: true, isPrimary: true },
      { domain: 'www.example.com', verified: false, isPrimary: false },
    ],
  };
  const domains = collectProjectDomains(project);
  assert.equal(domains.length, 2);
  assert.ok(domains.some((d) => d.domain === 'www.example.com'));
});
