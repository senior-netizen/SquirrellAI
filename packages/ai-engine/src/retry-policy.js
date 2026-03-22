import {
  FAILURE_TYPES,
  assertFailureType,
  createTerminalFailurePayload,
} from '../../contracts/src/index.js';

export const DEFAULT_RETRY_LIMITS = Object.freeze({
  [FAILURE_TYPES.SPEC_VALIDATION_ERROR]: 0,
  [FAILURE_TYPES.CODE_GENERATION_ERROR]: 1,
  [FAILURE_TYPES.DEPENDENCY_INSTALL_FAILURE]: 1,
  [FAILURE_TYPES.TEST_FAILURE]: 2,
  [FAILURE_TYPES.STARTUP_FAILURE]: 1,
  [FAILURE_TYPES.SANDBOX_VIOLATION]: 0,
  [FAILURE_TYPES.TIMEOUT]: 1,
});

const DEFAULT_REASON_BY_FAILURE = Object.freeze({
  [FAILURE_TYPES.SPEC_VALIDATION_ERROR]: 'Specification validation failures are deterministic input contract violations and must not be retried.',
  [FAILURE_TYPES.CODE_GENERATION_ERROR]: 'One retry is allowed after constraining generation inputs because the prompt can be corrected deterministically.',
  [FAILURE_TYPES.DEPENDENCY_INSTALL_FAILURE]: 'A single retry is allowed to remove or replace a blocked dependency.',
  [FAILURE_TYPES.TEST_FAILURE]: 'Up to two retries are allowed when the failing assertion has concrete evidence and a scoped corrective patch.',
  [FAILURE_TYPES.STARTUP_FAILURE]: 'One retry is allowed when startup logs identify a single service initialization defect.',
  [FAILURE_TYPES.SANDBOX_VIOLATION]: 'Sandbox violations are terminal because the generated patch breached the execution policy.',
  [FAILURE_TYPES.TIMEOUT]: 'One retry is allowed only after proving the next attempt reduces scope or runtime.',
});

export function createRetryPolicy({
  retryLimits = DEFAULT_RETRY_LIMITS,
  reasonByFailure = DEFAULT_REASON_BY_FAILURE,
  totalRepairBudget = 4,
} = {}) {
  const frozenRetryLimits = Object.freeze({ ...DEFAULT_RETRY_LIMITS, ...retryLimits });
  const frozenReasonByFailure = Object.freeze({ ...DEFAULT_REASON_BY_FAILURE, ...reasonByFailure });

  return Object.freeze({
    retryLimits: frozenRetryLimits,
    reasonByFailure: frozenReasonByFailure,
    totalRepairBudget,
    evaluateRetry,
    toTerminalFailure,
  });

  function evaluateRetry({ failureType, attempts = [] }) {
    assertFailureType(failureType);

    if (!Array.isArray(attempts)) {
      throw new Error('Retry evaluation requires an array of prior attempts.');
    }

    const retryBudget = frozenRetryLimits[failureType] ?? 0;
    const retryCounter = attempts.filter((attempt) => attempt.failureType === failureType).length;
    const totalAttempts = attempts.length;

    if (totalAttempts >= totalRepairBudget) {
      return Object.freeze({
        allowed: false,
        reason: `Total repair budget of ${totalRepairBudget} attempts exhausted.`,
        retryCounter,
        retryBudget,
        terminal: true,
      });
    }

    if (retryCounter >= retryBudget) {
      return Object.freeze({
        allowed: false,
        reason: `Retry budget exhausted for ${failureType}.`,
        retryCounter,
        retryBudget,
        terminal: true,
      });
    }

    return Object.freeze({
      allowed: true,
      reason: frozenReasonByFailure[failureType],
      retryCounter,
      retryBudget,
      terminal: false,
    });
  }

  function toTerminalFailure({ failureType, evidence, attempts = [] }) {
    const decision = evaluateRetry({ failureType, attempts });

    return createTerminalFailurePayload({
      failureType,
      message: evidence.message,
      retryCounter: decision.retryCounter,
      retryBudget: decision.retryBudget,
      evidence,
      reason: decision.reason,
    });
  }
}
