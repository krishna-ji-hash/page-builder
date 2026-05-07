import assert from 'node:assert/strict';
import test from 'node:test';
import { validateFormFieldValue, validateFormFields } from '../lib/runtime/formValidation.js';

test('validateFormFieldValue: required, email, number', () => {
  assert.ok(validateFormFieldValue('', { name: 'a', type: 'string', required: true }));
  assert.equal(validateFormFieldValue('x@y', { name: 'e', type: 'email' }), 'Invalid email');
  assert.equal(validateFormFieldValue('a@b.co', { name: 'e', type: 'email' }), null);
  assert.equal(validateFormFieldValue('nope', { name: 'n', type: 'number' }), 'Must be a number');
  assert.equal(validateFormFieldValue('3.5', { name: 'n', type: 'number' }), null);
  assert.equal(validateFormFieldValue('999', { name: 'n', type: 'number', validation: { max: 10 } }), 'Must be ≤ 10');
  assert.equal(validateFormFieldValue('+91 99999 99999', { name: 'p', type: 'phone' }), null);
  assert.ok(validateFormFieldValue('abc', { name: 'p', type: 'phone' }));
  assert.equal(validateFormFieldValue('abcd', { name: 't', type: 'text', validation: { min: 5 } }), 'Must be at least 5 characters');
  assert.equal(validateFormFieldValue('AB12', { name: 't', type: 'text', validation: { regex: '^[A-Z]{2}[0-9]{2}$' } }), null);
});

test('validateFormFields aggregates errors', () => {
  const fields = [
    { name: 'a', type: 'string', required: true, label: 'A' },
    { name: 'b', type: 'email', required: true, label: 'B' },
  ];
  const r = validateFormFields({ a: 'ok', b: 'bad' }, fields);
  assert.equal(r.ok, false);
  assert.ok(r.errors.b);
  const ok = validateFormFields({ a: 'ok', b: 'c@d.co' }, fields);
  assert.equal(ok.ok, true);
});
