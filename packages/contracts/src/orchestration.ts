import type { ExecutionState } from './execution-state';

/**
 * Version marker for compatibility across the control plane and AI engine.
 */
export const ORCHESTRATION_CONTRACT_VERSION = '1.0.0';

export interface PromptSubmissionRequest {
  executionId: string;
  idempotencyKey?: string;
  prompt: string;
  userId?: string;
  metadata?: Record<string, string>;
  submittedAt: string;
}

export interface PromptSubmissionResponse {
  executionId: string;
  acceptedState: Extract<ExecutionState, 'RECEIVED'>;
  contractVersion: string;
  acceptedAt: string;
}

export interface NormalizedIntent {
  executionId: string;
  intentId: string;
  summary: string;
  goals: string[];
  constraints: string[];
  requiredTools: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  parsedAt: string;
}

export interface PlanStep {
  stepId: string;
  description: string;
  toolName?: string;
  deterministicInput?: Record<string, unknown>;
}

export interface ToolInvocation {
  executionId: string;
  invocationId: string;
  toolName: string;
  deterministicInput: Record<string, unknown>;
  issuedAt: string;
}

export interface ToolResult {
  executionId: string;
  invocationId: string;
  toolName: string;
  status: 'SUCCEEDED' | 'FAILED';
  output: Record<string, unknown>;
  outputPayloadHash: string;
  observedAt: string;
}

/**
 * Append-only log event for every execution state transition.
 */
export interface ExecutionLogEvent {
  executionId: string;
  eventId: string;
  priorState: ExecutionState;
  nextState: ExecutionState;
  toolInvoked?: string;
  deterministicInputPayload: Record<string, unknown>;
  outputPayloadHash: string;
  timestamp: string;
  attempt: number;
  notes?: string;
}

export interface FinalAgentOutput {
  executionId: string;
  finalState: Extract<ExecutionState, 'SUCCEEDED' | 'FAILED'>;
  summary: string;
  artifacts: Array<{
    name: string;
    uri: string;
    mediaType: string;
  }>;
  completedAt: string;
}
