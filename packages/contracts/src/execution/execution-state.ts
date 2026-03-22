/**
 * Lifecycle states shared across orchestration boundaries.
 */
export enum ExecutionState {
  Pending = 'PENDING',
  Scheduled = 'SCHEDULED',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
  TimedOut = 'TIMED_OUT',
}
