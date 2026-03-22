import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FAILURE_TYPES,
  createFailureEvidence,
} from '../../contracts/src/index.js';
import {
  createRetryPolicy,
  evaluateAutomatedPatchAttempt,
  transitionExecution,
  EXECUTION_EVENTS,
  EXECUTION_STATES,
  validateGeneratedArtifact,
} from '../src/index.js';

test('retry policy enforces deterministic per-failure budgets', () => {
  const policy = createRetryPolicy();

  const firstTestFailure = policy.evaluateRetry({
    failureType: FAILURE_TYPES.TEST_FAILURE,
    attempts: [],
  });
  const thirdTestFailure = policy.evaluateRetry({
    failureType: FAILURE_TYPES.TEST_FAILURE,
    attempts: [
      { failureType: FAILURE_TYPES.TEST_FAILURE },
      { failureType: FAILURE_TYPES.TEST_FAILURE },
    ],
  });

  assert.deepEqual(firstTestFailure, {
    allowed: true,
    reason: 'Up to two retries are allowed when the failing assertion has concrete evidence and a scoped corrective patch.',
    retryCounter: 0,
    retryBudget: 2,
    terminal: false,
  });
  assert.deepEqual(thirdTestFailure, {
    allowed: false,
    reason: 'Retry budget exhausted for test_failure.',
    retryCounter: 2,
    retryBudget: 2,
    terminal: true,
  });
});

test('retry policy blocks infinite loops with a total repair budget', () => {
  const policy = createRetryPolicy({ totalRepairBudget: 2 });

  const decision = policy.evaluateRetry({
    failureType: FAILURE_TYPES.TIMEOUT,
    attempts: [
      { failureType: FAILURE_TYPES.TEST_FAILURE },
      { failureType: FAILURE_TYPES.TIMEOUT },
    ],
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.terminal, true);
  assert.match(decision.reason, /Total repair budget of 2 attempts exhausted/u);
});

test('pre-execution validator rejects forbidden imports, process spawning, filesystem access, and disallowed dependencies', () => {
  const validation = validateGeneratedArtifact({
    code: `
      import { execSync } from 'node:child_process';
      import fs from 'node:fs';
      execSync('touch /tmp/boom');
      fs.readFileSync('/etc/passwd', 'utf8');
    `,
    dependencies: ['left-pad', 'malware-lib'],
    dependencyPolicy: {
      allowlist: ['left-pad'],
      denylist: ['malware-lib'],
    },
  });

  assert.equal(validation.valid, false);
  assert.deepEqual(
    validation.violations.map((violation) => violation.category),
    [
      'forbidden_import',
      'blocked_process_spawn',
      'suspicious_filesystem_access',
      'dependency_not_allowlisted',
      'dependency_denylisted',
    ],
  );
});

test('transition policy is deterministic and rejects invalid transitions', () => {
  assert.equal(
    transitionExecution(EXECUTION_STATES.IDLE, EXECUTION_EVENTS.PATCH_SUBMITTED),
    EXECUTION_STATES.VALIDATING,
  );
  assert.equal(
    transitionExecution(EXECUTION_STATES.VALIDATING, EXECUTION_EVENTS.VALIDATION_PASSED),
    EXECUTION_STATES.EXECUTING,
  );
  assert.throws(
    () => transitionExecution(EXECUTION_STATES.COMPLETED, EXECUTION_EVENTS.RETRY_DISPATCHED),
    /Invalid execution transition/u,
  );
});

test('automated patch attempts always attach evidence, rationale, diff summary, and retry counter', () => {
  const evidence = createFailureEvidence({
    failureType: FAILURE_TYPES.TEST_FAILURE,
    message: 'Expected 200 but received 500',
    command: 'node --test',
    excerpt: 'AssertionError: 500 !== 200',
    timestamp: '2026-03-22T00:00:00.000Z',
  });

  const result = evaluateAutomatedPatchAttempt({
    failureEvidence: evidence,
    generatedCode: 'export const ok = true;',
    dependencies: [],
    proposedFixRationale: 'Align the handler return code with the tested contract.',
    diffSummary: 'Adjust response mapping in the request handler.',
    attempts: [],
  });

  assert.equal(result.state, EXECUTION_STATES.RETRY_SCHEDULED);
  assert.deepEqual(result.patchAttempt, {
    observedFailure: evidence,
    proposedFixRationale: 'Align the handler return code with the tested contract.',
    diffSummary: 'Adjust response mapping in the request handler.',
    retryCounter: 0,
  });
  assert.equal(result.retryDecision.allowed, true);
});

test('repair attempts become terminal with a structured payload when retry budget is exceeded', () => {
  const evidence = createFailureEvidence({
    failureType: FAILURE_TYPES.STARTUP_FAILURE,
    message: 'Service did not bind to the requested port.',
    command: 'npm run start',
    excerpt: 'EADDRINUSE',
    timestamp: '2026-03-22T00:00:00.000Z',
  });

  const result = evaluateAutomatedPatchAttempt({
    failureEvidence: evidence,
    generatedCode: 'export const start = () => true;',
    proposedFixRationale: 'Retry startup after narrowing the initialization path.',
    diffSummary: 'Limit startup sequence to the HTTP listener.',
    attempts: [{ failureType: FAILURE_TYPES.STARTUP_FAILURE }],
  });

  assert.equal(result.state, EXECUTION_STATES.TERMINAL_FAILURE);
  assert.deepEqual(result.failure, {
    status: 'terminal_failure',
    failureType: FAILURE_TYPES.STARTUP_FAILURE,
    message: 'Service did not bind to the requested port.',
    retryCounter: 1,
    retryBudget: 1,
    evidence,
    reason: 'Retry budget exhausted for startup_failure.',
  });
});

test('pre-execution validation failures become terminal sandbox violations with structured evidence', () => {
  const evidence = createFailureEvidence({
    failureType: FAILURE_TYPES.CODE_GENERATION_ERROR,
    message: 'Generated patch introduced unsafe execution.',
    command: 'repair-engine',
    excerpt: 'spawn("sh")',
    timestamp: '2026-03-22T00:00:00.000Z',
  });

  const result = evaluateAutomatedPatchAttempt({
    failureEvidence: evidence,
    generatedCode: "import { spawn } from 'node:child_process';\nspawn('sh');",
    proposedFixRationale: 'Attempt to recover generation.',
    diffSummary: 'Generated repair patch.',
    attempts: [],
  });

  assert.equal(result.state, EXECUTION_STATES.TERMINAL_FAILURE);
  assert.equal(result.failure.failureType, FAILURE_TYPES.SANDBOX_VIOLATION);
  assert.equal(result.failure.status, 'terminal_failure');
  assert.equal(result.failure.retryBudget, 0);
  assert.equal(result.validation.valid, false);
  assert.ok(Array.isArray(result.failure.evidence.validationViolations));
});
