import type {
  AgentSummary,
  AiEngineExecutionListResponse,
  AiEngineHealthResponse,
  AppConfig,
  BillingSnapshot,
  ExecutionDetail,
  ExecutionSummary,
  LoginResponse,
  ReadinessResponse,
  ToolSummary,
} from '../types/models';
import { requestJson } from './http';

export interface ApiClient {
  login(subject: string): Promise<LoginResponse>;
  getExecutions(token: string): Promise<ExecutionSummary[]>;
  getExecution(executionId: string, token: string): Promise<ExecutionDetail>;
  getAgents(token: string): Promise<AgentSummary[]>;
  getTools(token: string): Promise<ToolSummary[]>;
  getReadiness(token: string): Promise<ReadinessResponse>;
  getBilling(token: string): Promise<BillingSnapshot>;
  getAiEngineHealth(token: string): Promise<AiEngineHealthResponse>;
  getAiEngineExecutions(token: string): Promise<AiEngineExecutionListResponse>;
}

export function createApiClient(config: AppConfig): ApiClient {
  return {
    login(subject) {
      return requestJson<LoginResponse>(`${config.coreBaseUrl}/v1/auth/token`, {
        method: 'POST',
        body: JSON.stringify({ subject }),
      });
    },
    getExecutions(token) {
      return requestJson<ExecutionSummary[]>(`${config.coreBaseUrl}/v1/executions`, { token });
    },
    getExecution(executionId, token) {
      return requestJson<ExecutionDetail>(`${config.coreBaseUrl}/v1/executions/${executionId}`, { token });
    },
    getAgents(token) {
      return requestJson<AgentSummary[]>(`${config.coreBaseUrl}/v1/agents`, { token });
    },
    getTools(token) {
      return requestJson<ToolSummary[]>(`${config.coreBaseUrl}/v1/tool-registry`, { token });
    },
    getReadiness(token) {
      return requestJson<ReadinessResponse>(`${config.coreBaseUrl}/v1/observability/readiness`, { token });
    },
    getBilling(token) {
      return requestJson<BillingSnapshot>(`${config.coreBaseUrl}/v1/account/billing`, { token });
    },
    getAiEngineHealth(token) {
      return requestJson<AiEngineHealthResponse>(`${config.aiEngineBaseUrl}/v1/health`, { token });
    },
    getAiEngineExecutions(token) {
      return requestJson<AiEngineExecutionListResponse>(`${config.aiEngineBaseUrl}/v1/executions`, { token });
    },
  };
}
