import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeFormField,
  normalizeFormConfig,
  normalizeFormWorkflow,
  evaluateStepCondition,
  visibleSteps,
  FORM_FIELD_TYPES,
} from '../lib/formBuilderSchema.js';
import {
  resolveClientWorkflowOutcome,
  mergeWorkflowIntoSubmitBody,
  shouldSaveLead,
  enabledServerActions,
} from '../lib/formWorkflowEngine.js';
import { buildBuilderLiveRenderOptions } from '../lib/builderLiveParity.js';
import { alignThemeTokensWithSiteTheme, themeTokensToCssVariableStyle } from '../lib/themeTokens.js';
import { SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';
import { validateFormStepFields } from '../lib/runtime/formValidation.js';

test('normalizeFormField supports enterprise field types', () => {
  for (const type of FORM_FIELD_TYPES) {
    const f = normalizeFormField({ type, name: `f_${type}`, label: type }, 0);
    assert.ok(f, `expected field for ${type}`);
    assert.equal(f.type, type);
  }
});

test('normalizeFormWorkflow migrates legacy notifications', () => {
  const wf = normalizeFormWorkflow(null, {
    webhookUrl: 'https://example.com/hook',
    emailTo: 'ops@example.com',
  });
  const types = wf.onSubmit.map((a) => a.type);
  assert.ok(types.includes('save_lead'));
  assert.ok(types.includes('webhook'));
  assert.ok(types.includes('email'));
});

test('conditional steps filter by showWhen', () => {
  const steps = [
    { id: 's1', title: 'One', fieldNames: ['a'] },
    {
      id: 's2',
      title: 'Two',
      fieldNames: ['b'],
      showWhen: { field: 'role', operator: 'equals', value: 'pro' },
    },
  ];
  assert.equal(visibleSteps(steps, { role: 'basic' }).length, 1);
  assert.equal(visibleSteps(steps, { role: 'pro' }).length, 2);
  assert.equal(evaluateStepCondition({ field: 'x', operator: 'notEmpty' }, { x: 'y' }), true);
});

test('normalizeFormConfig produces multi-step when steps > 1', () => {
  const cfg = normalizeFormConfig({
    fields: [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'email' },
    ],
    steps: [
      { id: 'step-1', fieldNames: ['a'] },
      { id: 'step-2', fieldNames: ['b'] },
    ],
  });
  assert.equal(cfg.multiStep, true);
  assert.equal(cfg.fields.length, 2);
});

test('workflow engine: client outcome and submit body', () => {
  const workflow = {
    onSubmit: [
      { type: 'save_lead', enabled: true },
      { type: 'redirect', enabled: true, url: '/thanks' },
    ],
  };
  assert.equal(shouldSaveLead(workflow), true);
  assert.equal(enabledServerActions(workflow).length, 2);
  const outcome = resolveClientWorkflowOutcome(workflow, {
    success: { title: 'Done', message: 'OK' },
  });
  assert.equal(outcome.kind, 'redirect');
  assert.equal(outcome.redirectUrl, '/thanks');
  const body = mergeWorkflowIntoSubmitBody({ values: { a: '1' } }, workflow);
  assert.ok(body.workflow?.onSubmit?.length);
  assert.ok(body.notifications);
});

test('validateFormStepFields validates only step fields', () => {
  const fields = [
    { name: 'a', type: 'text', required: true, label: 'A' },
    { name: 'b', type: 'email', required: true, label: 'B' },
  ];
  const stepFields = [fields[0]];
  const bad = validateFormStepFields({ a: '' }, stepFields);
  assert.equal(bad.ok, false);
  const ok = validateFormStepFields({ a: 'ok' }, stepFields);
  assert.equal(ok.ok, true);
});

test('alignThemeTokensWithSiteTheme follows site preset when mode mismatches', () => {
  const siteTheme = { ...SITE_THEME_PRESETS.dark, presetId: 'dark' };
  const aligned = alignThemeTokensWithSiteTheme(siteTheme, { mode: 'light', colors: { background: '#ffffff' } });
  assert.equal(aligned.mode, 'dark');
  const vars = themeTokensToCssVariableStyle(aligned);
  assert.equal(vars['--token-color-background'], '#0f172a');
});

test('buildBuilderLiveRenderOptions passes builder preview flags', () => {
  const opts = buildBuilderLiveRenderOptions({
    device: 'desktop',
    siteTheme: null,
    formPreviewMode: 'success',
    pageId: 1,
    projectId: 2,
  });
  assert.equal(opts.builderPreview, true);
  assert.equal(opts.formPreviewMode, 'success');
  assert.equal(opts.pageId, 1);
});
