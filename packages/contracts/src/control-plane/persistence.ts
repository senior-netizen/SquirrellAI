import { ExecutionState } from '../execution/execution-state';

export const CONTROL_PLANE_STORE_VERSION = '1.0.0';
export const CONTROL_PLANE_STORE_FILENAME = 'control-plane-store.json';

export type AgentStatus = 'available' | 'degraded' | 'disabled';

export interface AgentRecord {
  id: string;
  status: AgentStatus;
  description: string;
}

export interface ToolRecord {
  name: string;
  owner: string;
  timeoutSeconds: number;
}

export interface ExecutionRecord {
  id: string;
  agentId: string;
  prompt: string;
  state: ExecutionState;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExecutionInput {
  agentId: string;
  prompt: string;
  requestedBy: string;
}

export interface ControlPlaneStoreSnapshot {
  version: string;
  agents: AgentRecord[];
  tools: ToolRecord[];
  executions: ExecutionRecord[];
}

export const DEFAULT_CONTROL_PLANE_STORE: ControlPlaneStoreSnapshot = {
  version: CONTROL_PLANE_STORE_VERSION,
  agents: [
    {
      id: 'planner',
      status: 'available',
      description: 'Primary planning agent for control-plane orchestrations.',
    },
  ],
  tools: [
    {
      name: 'search',
      owner: 'ai-engine',
      timeoutSeconds: 30,
    },
  ],
  executions: [],
};
