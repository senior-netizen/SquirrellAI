import { ExecutionState } from '../execution/execution-state';

export interface ToolInvocationContext {
  executionId: string;
  agentId: string;
  correlationId: string;
  requestedAt: string;
}

export interface ToolRequestPayload {
  toolName: string;
  action: string;
  input: Record<string, unknown>;
  context: ToolInvocationContext;
}

export interface ToolResponsePayload {
  toolName: string;
  status: Extract<ExecutionState, ExecutionState.Succeeded | ExecutionState.Failed>;
  output: Record<string, unknown>;
  errorMessage?: string;
  completedAt: string;
}
