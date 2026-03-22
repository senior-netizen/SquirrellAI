import { ExecutionState } from '../execution/execution-state';

export interface ExecutionLogRecord {
  executionId: string;
  sequence: number;
  state: ExecutionState;
  message: string;
  emittedAt: string;
  metadata?: Record<string, unknown>;
}
