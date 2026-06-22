import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditHardcodedColors,
  auditSectionContrastBannedProps,
  scoreSectionContrastAudit,
} from '../scripts/audit-hardcoded-colors.mjs';
import { scorePerformanceFromLighthouseRuns } from '../lib/lighthouseHistory.js';

test('scoreSectionContrastAudit ignores decorative hard-coded colors', () => {
  const findings = auditHardcodedColors();
  const banned = auditSectionContrastBannedProps();
  const score = scoreSectionContrastAudit(banned, findings);
  assert.equal(banned.length, 0, 'banned neutral props should be zero in audited CSS');
  assert.ok(score >= 95, `expected section contrast >= 95, got ${score}`);
});

test('scoreSectionContrastAudit penalizes banned neutrals on color/background', () => {
  const banned = [{ file: 'x.css', line: 1, match: '#0f172a', text: 'color: #0f172a;' }];
  const score = scoreSectionContrastAudit(banned, []);
  assert.ok(score < 100);
});

test('scorePerformanceFromLighthouseRuns averages recent Lighthouse metrics', () => {
  const score = scorePerformanceFromLighthouseRuns([
    { lcpScore: 80, clsScore: 100, fcpScore: 90, tbtScore: 80 },
    { lcpScore: 90, clsScore: 100, fcpScore: 95, tbtScore: 90 },
  ]);
  assert.ok(score >= 80 && score <= 100, `expected composite 80–100, got ${score}`);
});

test('scorePerformanceFromLighthouseRuns returns null without runs', () => {
  assert.equal(scorePerformanceFromLighthouseRuns([]), null);
  assert.equal(scorePerformanceFromLighthouseRuns(null), null);
});
