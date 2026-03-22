/**
 * Canonical execution lifecycle states shared across orchestration boundaries.
 */
export const EXECUTION_STATES = [
  'RECEIVED',
  'PARSED',
  'PLANNED',
  'ACTING',
  'OBSERVING',
  'RETRYING',
  'SUCCEEDED',
  'FAILED',
] as const;

export type ExecutionState = (typeof EXECUTION_STATES)[number];

export const TERMINAL_EXECUTION_STATES = ['SUCCEEDED', 'FAILED'] as const satisfies readonly ExecutionState[];
