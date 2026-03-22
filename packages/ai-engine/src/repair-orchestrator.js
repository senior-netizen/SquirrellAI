import {
  FAILURE_TYPES,
  createPatchAttemptRecord,
  createTerminalFailurePayload,
} from '../../contracts/src/index.js';
import { createRetryPolicy } from './retry-policy.js';
import { transitionExecution, EXECUTION_EVENTS, EXECUTION_STATES } from './transition-policy.js';
import { validateGeneratedArtifact } from './pre-execution-validator.js';

export function evaluateAutomatedPatchAttempt({
  failureEvidence,
  generatedCode,
  dependencies = [],
  dependencyPolicy,
  proposedFixRationale,
  diffSummary,
  attempts = [],
  retryPolicy = createRetryPolicy(),
}) {
  let state = EXECUTION_STATES.IDLE;
  state = transitionExecution(state, EXECUTION_EVENTS.PATCH_SUBMITTED);

  const validation = validateGeneratedArtifact({
    code: generatedCode,
    dependencies,
    dependencyPolicy,
  });

  if (!validation.valid) {
    state = transitionExecution(state, EXECUTION_EVENTS.VALIDATION_FAILED);

    return Object.freeze({
      state,
      patchAttempt: createPatchAttemptRecord({
        observedFailure: failureEvidence,
        proposedFixRationale,
        diffSummary,
        retryCounter: attempts.length,
      }),
      failure: createTerminalFailurePayload({
        failureType: FAILURE_TYPES.SANDBOX_VIOLATION,
        message: 'Generated patch failed pre-execution safety validation.',
        retryCounter: attempts.length,
        retryBudget: retryPolicy.retryLimits[FAILURE_TYPES.SANDBOX_VIOLATION] ?? 0,
        evidence: {
          ...failureEvidence,
          validationViolations: validation.violations,
        },
        reason: 'Pre-execution validation rejected the generated artifact.',
      }),
      validation,
    });
  }

  state = transitionExecution(state, EXECUTION_EVENTS.VALIDATION_PASSED);
  const retryDecision = retryPolicy.evaluateRetry({
    failureType: failureEvidence.failureType,
    attempts,
  });

  const patchAttempt = createPatchAttemptRecord({
    observedFailure: failureEvidence,
    proposedFixRationale,
    diffSummary,
    retryCounter: retryDecision.retryCounter,
  });

  if (!retryDecision.allowed) {
    state = transitionExecution(state, EXECUTION_EVENTS.EXECUTION_FAILED_TERMINAL);

    return Object.freeze({
      state,
      patchAttempt,
      failure: retryPolicy.toTerminalFailure({
        failureType: failureEvidence.failureType,
        evidence: failureEvidence,
        attempts,
      }),
      retryDecision,
      validation,
    });
  }

  state = transitionExecution(state, EXECUTION_EVENTS.EXECUTION_FAILED_RETRYABLE);

  return Object.freeze({
    state,
    patchAttempt,
    retryDecision,
    validation,
  });
}
