export interface LoginResponse {
  accessToken: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  status: 'available' | 'degraded' | 'offline';
  description: string;
  capabilities: string[];
  concurrencyLimit: number;
  version: string;
}

export interface ToolSummary {
  name: string;
  owner: string;
  version: string;
  category: string;
  description: string;
  inputMode: 'structured' | 'freeform';
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface ExecutionSummary {
  id: string;
  agentId: string;
  correlationId: string;
  prompt: string;
  state: string;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  summary: string;
  toolCount: number;
}

export interface ExecutionStepSummary {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  owner: string;
}

export interface ExecutionLogEntry {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  emittedAt: string;
  component: string;
  message: string;
}

export interface ExecutionArtifact {
  id: string;
  kind: 'log' | 'spec' | 'report' | 'bundle';
  label: string;
  uri: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ExecutionDetail extends ExecutionSummary {
  runtimeEndpoint: string | null;
  logs: ExecutionLogEntry[];
  artifacts: ExecutionArtifact[];
  steps: ExecutionStepSummary[];
}

export interface ReadinessResponse {
  ready: boolean;
  checks: string[];
}

export interface BillingSnapshot {
  accountId: string;
  plan: {
    name: string;
    monthlyPriceUsd: number;
    includedExecutions: number;
    includedTokens: number;
  };
  usage: {
    executionCount: number;
    executionQuota: number;
    tokenCount: number;
    tokenQuota: number;
    overageUsd: number;
    periodStart: string;
    periodEnd: string;
  };
  paymentMethod: {
    brand: string;
    last4: string;
  };
}

export interface AiEngineHealthResponse {
  status: string;
}

export interface AiEngineExecutionSummary {
  execution_id: string;
  state: string;
  summary: string;
}

export interface AiEngineExecutionListResponse {
  items: AiEngineExecutionSummary[];
}

export interface AppConfig {
  coreBaseUrl: string;
  aiEngineBaseUrl: string;
}
