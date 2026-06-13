import assert from 'node:assert/strict';
import { buildPublishChecklist } from '../lib/audits/publishChecklist.js';

const baseTree = [
  {
    id: 'row-1',
    nodeType: 'row',
    children: [
      {
        id: 'h1',
        nodeType: 'heading',
        props: { text: 'Hello', tag: 'h1' },
      },
    ],
  },
];

const ok = buildPublishChecklist({
  tree: baseTree,
  pageSeo: {
    title: 'A proper SEO title for the page',
    description: 'A long enough meta description for publish checklist validation to pass easily here.',
  },
  projectConfig: {},
  domains: [],
  auditWarnings: [],
});

assert.equal(ok.canPublish, true);
assert.ok(ok.items.some((i) => i.id === 'seo-title' && i.status === 'pass'));

const empty = buildPublishChecklist({ tree: [], pageSeo: {}, projectConfig: {}, domains: [] });
assert.equal(empty.canPublish, false);
assert.ok(empty.items.find((i) => i.id === 'page-content')?.status === 'fail');

const badForm = buildPublishChecklist({
  tree: [{ id: 'f1', nodeType: 'form', props: { fields: [] } }],
  pageSeo: { title: 'Title ok enough', description: 'Description ok enough for tests and validation.' },
  projectConfig: {},
});
assert.equal(badForm.canPublish, false);
assert.ok(badForm.items.find((i) => i.id === 'form-workflow')?.status === 'fail');

const domainWarn = buildPublishChecklist({
  tree: baseTree,
  pageSeo: { title: 'Title ok enough', description: 'Description ok enough for tests and validation.' },
  domains: [{ domain: 'example.com', verified: false, isPrimary: true }],
});
assert.ok(domainWarn.items.find((i) => i.id === 'domain-status')?.status === 'warn');
assert.equal(domainWarn.canPublish, true);

console.log('publishChecklist.test.mjs — all assertions passed');
