import test from 'node:test';
import assert from 'node:assert/strict';
import { redactValue, sanitizeError } from '../packages/observability/src/redaction.ts';

test('redacts secret keys recursively', () => {
  const payload = redactValue({
    token: 'sk_live_1234567890',
    nested: {
      password: 'super-secret',
      safe: 'visible'
    }
  });

  assert.deepEqual(payload, {
    token: '[REDACTED]',
    nested: {
      password: '[REDACTED]',
      safe: 'visible'
    }
  });
});

test('sanitizes sensitive error messages', () => {
  const error = new Error('Bearer abc.def.ghi failed');
  assert.match(sanitizeError(error), /\[REDACTED\]/);
});
