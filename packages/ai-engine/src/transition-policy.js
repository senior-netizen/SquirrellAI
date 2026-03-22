export const EXECUTION_STATES = Object.freeze({
  IDLE: 'idle',
  VALIDATING: 'validating_patch',
  EXECUTING: 'executing_patch',
  RETRY_SCHEDULED: 'retry_scheduled',
  COMPLETED: 'completed',
  TERMINAL_FAILURE: 'terminal_failure',
});

export const EXECUTION_EVENTS = Object.freeze({
  PATCH_SUBMITTED: 'patch_submitted',
  VALIDATION_PASSED: 'validation_passed',
  VALIDATION_FAILED: 'validation_failed',
  EXECUTION_SUCCEEDED: 'execution_succeeded',
  EXECUTION_FAILED_RETRYABLE: 'execution_failed_retryable',
  EXECUTION_FAILED_TERMINAL: 'execution_failed_terminal',
  RETRY_DISPATCHED: 'retry_dispatched',
});

const TRANSITIONS = Object.freeze({
  [EXECUTION_STATES.IDLE]: Object.freeze({
    [EXECUTION_EVENTS.PATCH_SUBMITTED]: EXECUTION_STATES.VALIDATING,
  }),
  [EXECUTION_STATES.VALIDATING]: Object.freeze({
    [EXECUTION_EVENTS.VALIDATION_PASSED]: EXECUTION_STATES.EXECUTING,
    [EXECUTION_EVENTS.VALIDATION_FAILED]: EXECUTION_STATES.TERMINAL_FAILURE,
  }),
  [EXECUTION_STATES.EXECUTING]: Object.freeze({
    [EXECUTION_EVENTS.EXECUTION_SUCCEEDED]: EXECUTION_STATES.COMPLETED,
    [EXECUTION_EVENTS.EXECUTION_FAILED_RETRYABLE]: EXECUTION_STATES.RETRY_SCHEDULED,
    [EXECUTION_EVENTS.EXECUTION_FAILED_TERMINAL]: EXECUTION_STATES.TERMINAL_FAILURE,
  }),
  [EXECUTION_STATES.RETRY_SCHEDULED]: Object.freeze({
    [EXECUTION_EVENTS.RETRY_DISPATCHED]: EXECUTION_STATES.VALIDATING,
  }),
  [EXECUTION_STATES.COMPLETED]: Object.freeze({}),
  [EXECUTION_STATES.TERMINAL_FAILURE]: Object.freeze({}),
});

export function transitionExecution(currentState, event) {
  const nextState = TRANSITIONS[currentState]?.[event];

  if (!nextState) {
    throw new Error(`Invalid execution transition from ${currentState} using ${event}.`);
  }

  return nextState;
}
