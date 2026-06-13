import assert from 'node:assert/strict';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTION_LABELS,
  activityActionLabel,
} from '../lib/admin/activityActions.js';
import { buildFormSubmissionsCsv } from '../lib/admin/formSubmissionsCsv.js';

assert.equal(activityActionLabel(ACTIVITY_ACTIONS.LOGIN), ACTIVITY_ACTION_LABELS[ACTIVITY_ACTIONS.LOGIN]);
assert.equal(activityActionLabel(ACTIVITY_ACTIONS.PAGE_PUBLISHED), 'Page published');
assert.equal(activityActionLabel('unknown.action'), 'unknown.action');

assert.equal(ACTIVITY_ACTIONS.PROJECT_CREATED, 'project.created');
assert.equal(ACTIVITY_ACTIONS.FORM_EXPORTED, 'form.exported');
assert.equal(ACTIVITY_ACTIONS.VERSION_RESTORED, 'version.restored');

const csv = buildFormSubmissionsCsv([
  { id: 1, createdAt: '2026-01-01', pageId: 2, formNodeId: 'f1', values: { email: 'a@b.com', name: 'Ada' } },
]);
assert.match(csv, /email,name/);
assert.match(csv, /a@b.com/);

console.log('activityLog.test.mjs: ok');
