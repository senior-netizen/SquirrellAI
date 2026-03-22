export const FAILURE_TYPES = Object.freeze({
  SPEC_VALIDATION_ERROR: 'spec_validation_error',
  CODE_GENERATION_ERROR: 'code_generation_error',
  DEPENDENCY_INSTALL_FAILURE: 'dependency_install_failure',
  TEST_FAILURE: 'test_failure',
  STARTUP_FAILURE: 'startup_failure',
  SANDBOX_VIOLATION: 'sandbox_violation',
  TIMEOUT: 'timeout',
});

export const FAILURE_TYPE_SET = new Set(Object.values(FAILURE_TYPES));

export function assertFailureType(failureType) {
  if (!FAILURE_TYPE_SET.has(failureType)) {
    throw new Error(`Unknown failure type: ${failureType}`);
  }

  return failureType;
}

export function createFailureEvidence({
  failureType,
  message,
  command = null,
  excerpt = null,
  timestamp,
}) {
  assertFailureType(failureType);

  if (!message || typeof message !== 'string') {
    throw new Error('Failure evidence requires a non-empty message.');
  }

  if (!timestamp || typeof timestamp !== 'string') {
    throw new Error('Failure evidence requires an ISO timestamp string.');
  }

  return Object.freeze({
    failureType,
    message,
    command,
    excerpt,
    timestamp,
  });
}

export function createPatchAttemptRecord({
  observedFailure,
  proposedFixRationale,
  diffSummary,
  retryCounter,
}) {
  if (!observedFailure) {
    throw new Error('Patch attempts must include observed failure evidence.');
  }

  if (!proposedFixRationale || typeof proposedFixRationale !== 'string') {
    throw new Error('Patch attempts must include a proposed fix rationale.');
  }

  if (!diffSummary || typeof diffSummary !== 'string') {
    throw new Error('Patch attempts must include a diff summary.');
  }

  if (!Number.isInteger(retryCounter) || retryCounter < 0) {
    throw new Error('Patch attempts must include a non-negative retry counter.');
  }

  return Object.freeze({
    observedFailure,
    proposedFixRationale,
    diffSummary,
    retryCounter,
  });
}

export function createTerminalFailurePayload({
  failureType,
  message,
  retryCounter,
  retryBudget,
  evidence,
  reason,
}) {
  assertFailureType(failureType);

  if (!message || typeof message !== 'string') {
    throw new Error('Terminal failures require a non-empty message.');
  }

  if (!Number.isInteger(retryCounter) || retryCounter < 0) {
    throw new Error('Terminal failures require a non-negative retry counter.');
  }

  if (!Number.isInteger(retryBudget) || retryBudget < 0) {
    throw new Error('Terminal failures require a non-negative retry budget.');
  }

  if (!reason || typeof reason !== 'string') {
    throw new Error('Terminal failures require a terminal reason.');
  }

  return Object.freeze({
    status: 'terminal_failure',
    failureType,
    message,
    retryCounter,
    retryBudget,
    evidence,
    reason,
  });
}
