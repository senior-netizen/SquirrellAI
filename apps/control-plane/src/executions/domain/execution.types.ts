import type {
  ExecutionLogEvent,
  ExecutionState,
  FinalAgentOutput,
  PromptSubmissionRequest,
} from '../../../../../packages/contracts/src';

export interface ExecutionRecord {
  executionId: string;
  state: ExecutionState;
  request: PromptSubmissionRequest;
  finalOutput?: FinalAgentOutput;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStateTransition {
  priorState: ExecutionState;
  nextState: ExecutionState;
  toolInvoked?: string;
  deterministicInputPayload: Record<string, unknown>;
  outputPayloadHash: string;
  timestamp: string;
  attempt: number;
}

/**
 * Persistence boundary for durable execution lifecycle state.
 */
export interface ExecutionRepository {
  create(record: ExecutionRecord): Promise<ExecutionRecord>;
  findById(executionId: string): Promise<ExecutionRecord | null>;
  updateState(executionId: string, transition: ExecutionStateTransition): Promise<ExecutionRecord>;
  attachFinalOutput(executionId: string, output: FinalAgentOutput): Promise<ExecutionRecord>;
}

/**
 * Persistence boundary for append-only execution log entries.
 */
export interface ExecutionLogRepository {
  append(event: ExecutionLogEvent): Promise<void>;
  listByExecutionId(executionId: string): Promise<ExecutionLogEvent[]>;
}

/**
 * Policy boundary used by the control plane to govern legal lifecycle transitions.
 */
export interface ExecutionStateTransitionPolicy {
  canTransition(priorState: ExecutionState, nextState: ExecutionState): boolean;
  assertTransition(priorState: ExecutionState, nextState: ExecutionState): void;
}
