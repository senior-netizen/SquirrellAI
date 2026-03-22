import { ExecutionState } from '../execution/execution-state';
import { ExecutionLogRecord } from '../logging/execution-log-record';
import { ToolResponsePayload } from '../tooling/tool-payloads';

export interface AgentResultPayload {
  executionId: string;
  agentId: string;
  finalState: Extract<
    ExecutionState,
    ExecutionState.Succeeded | ExecutionState.Failed | ExecutionState.Cancelled | ExecutionState.TimedOut
  >;
  summary: string;
  toolResponses: ToolResponsePayload[];
  logs: ExecutionLogRecord[];
  producedAt: string;
}
