import { ExecutionState } from '@squirrellai/contracts';

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

export interface ExecutionStepSummary {
  id: string;
  title: string;
  status: ExecutionState;
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

export interface ExecutionSummary {
  id: string;
  agentId: string;
  correlationId: string;
  prompt: string;
  state: ExecutionState;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  summary: string;
  toolCount: number;
}

export interface ExecutionDetail extends ExecutionSummary {
  runtimeEndpoint: string | null;
  logs: ExecutionLogEntry[];
  artifacts: ExecutionArtifact[];
  steps: ExecutionStepSummary[];
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

export const mockAgents: AgentSummary[] = [
  {
    id: 'planner',
    name: 'Planner Agent',
    status: 'available',
    description: 'Builds execution plans, allocates tools, and synthesizes final output.',
    capabilities: ['planning', 'registry-discovery', 'result-synthesis'],
    concurrencyLimit: 24,
    version: '2026.03.1',
  },
  {
    id: 'auditor',
    name: 'Audit Agent',
    status: 'degraded',
    description: 'Performs validation passes on generated artifacts and safety evidence.',
    capabilities: ['artifact-audit', 'policy-checks'],
    concurrencyLimit: 8,
    version: '2026.03.1',
  },
];

export const mockTools: ToolSummary[] = [
  {
    name: 'search',
    owner: 'ai-engine',
    version: '1.4.0',
    category: 'retrieval',
    description: 'Searches indexed project and external knowledge sources.',
    inputMode: 'structured',
    riskLevel: 'low',
  },
  {
    name: 'openapi.generate',
    owner: 'ai-engine',
    version: '0.9.2',
    category: 'codegen',
    description: 'Produces OpenAPI specifications and associated consistency reports.',
    inputMode: 'structured',
    riskLevel: 'moderate',
  },
  {
    name: 'sandbox.exec',
    owner: 'ai-engine',
    version: '2.1.0',
    category: 'execution',
    description: 'Runs deterministic, policy-constrained execution steps for generated code.',
    inputMode: 'freeform',
    riskLevel: 'high',
  },
];

export const mockExecutionDetails: ExecutionDetail[] = [
  {
    id: 'exec_001',
    agentId: 'planner',
    correlationId: 'corr_20260323_001',
    prompt: 'Generate an inventory service API, tests, and deployment notes.',
    state: ExecutionState.Running,
    requestedAt: '2026-03-23T08:15:00.000Z',
    startedAt: '2026-03-23T08:15:07.000Z',
    finishedAt: null,
    summary: 'Planner generated the OpenAPI draft and is validating NestJS output.',
    toolCount: 3,
    runtimeEndpoint: 'http://localhost:8000/v1/executions',
    steps: [
      {
        id: 'step_1',
        title: 'Intent normalization',
        status: ExecutionState.Succeeded,
        startedAt: '2026-03-23T08:15:07.000Z',
        finishedAt: '2026-03-23T08:15:09.000Z',
        owner: 'planner',
      },
      {
        id: 'step_2',
        title: 'OpenAPI synthesis',
        status: ExecutionState.Succeeded,
        startedAt: '2026-03-23T08:15:09.000Z',
        finishedAt: '2026-03-23T08:15:15.000Z',
        owner: 'openapi.generate',
      },
      {
        id: 'step_3',
        title: 'Validation and packaging',
        status: ExecutionState.Running,
        startedAt: '2026-03-23T08:15:15.000Z',
        finishedAt: null,
        owner: 'sandbox.exec',
      },
    ],
    logs: [
      {
        id: 'log_1',
        level: 'INFO',
        emittedAt: '2026-03-23T08:15:08.000Z',
        component: 'planner',
        message: 'Prompt classified as backend-codegen workflow.',
      },
      {
        id: 'log_2',
        level: 'INFO',
        emittedAt: '2026-03-23T08:15:13.000Z',
        component: 'openapi.generate',
        message: 'Draft specification emitted with 12 operations and 8 schemas.',
      },
      {
        id: 'log_3',
        level: 'WARN',
        emittedAt: '2026-03-23T08:15:19.000Z',
        component: 'sandbox.exec',
        message: 'Generated bundle missing one DTO serializer; applying repair policy.',
      },
    ],
    artifacts: [
      {
        id: 'artifact_1',
        kind: 'spec',
        label: 'OpenAPI 3.0 specification',
        uri: 's3://dev-squirrellai/executions/exec_001/spec.json',
        sizeBytes: 18432,
        createdAt: '2026-03-23T08:15:15.000Z',
      },
      {
        id: 'artifact_2',
        kind: 'report',
        label: 'Route consistency report',
        uri: 's3://dev-squirrellai/executions/exec_001/consistency-report.json',
        sizeBytes: 6212,
        createdAt: '2026-03-23T08:15:18.000Z',
      },
    ],
  },
  {
    id: 'exec_002',
    agentId: 'auditor',
    correlationId: 'corr_20260323_002',
    prompt: 'Review latest generated patch for sandbox policy violations.',
    state: ExecutionState.Succeeded,
    requestedAt: '2026-03-23T06:40:00.000Z',
    startedAt: '2026-03-23T06:40:03.000Z',
    finishedAt: '2026-03-23T06:41:11.000Z',
    summary: 'Audit completed with a clean validation pass and archived the evidence bundle.',
    toolCount: 2,
    runtimeEndpoint: 'http://localhost:8000/v1/executions',
    steps: [
      {
        id: 'step_4',
        title: 'Artifact ingestion',
        status: ExecutionState.Succeeded,
        startedAt: '2026-03-23T06:40:03.000Z',
        finishedAt: '2026-03-23T06:40:20.000Z',
        owner: 'auditor',
      },
      {
        id: 'step_5',
        title: 'Policy audit',
        status: ExecutionState.Succeeded,
        startedAt: '2026-03-23T06:40:20.000Z',
        finishedAt: '2026-03-23T06:41:11.000Z',
        owner: 'sandbox.exec',
      },
    ],
    logs: [
      {
        id: 'log_4',
        level: 'INFO',
        emittedAt: '2026-03-23T06:40:18.000Z',
        component: 'auditor',
        message: 'Evidence bundle checksum verified.',
      },
      {
        id: 'log_5',
        level: 'INFO',
        emittedAt: '2026-03-23T06:41:11.000Z',
        component: 'sandbox.exec',
        message: 'No forbidden imports, process spawning, or filesystem writes detected.',
      },
    ],
    artifacts: [
      {
        id: 'artifact_3',
        kind: 'bundle',
        label: 'Audit evidence bundle',
        uri: 's3://dev-squirrellai/executions/exec_002/evidence.tar.gz',
        sizeBytes: 125001,
        createdAt: '2026-03-23T06:41:11.000Z',
      },
      {
        id: 'artifact_4',
        kind: 'log',
        label: 'Structured audit log',
        uri: 's3://dev-squirrellai/executions/exec_002/audit.ndjson',
        sizeBytes: 9510,
        createdAt: '2026-03-23T06:41:11.000Z',
      },
    ],
  },
];

export const mockBillingSnapshot: BillingSnapshot = {
  accountId: 'acct_dev_team',
  plan: {
    name: 'Builder',
    monthlyPriceUsd: 249,
    includedExecutions: 5000,
    includedTokens: 25000000,
  },
  usage: {
    executionCount: 1824,
    executionQuota: 5000,
    tokenCount: 8421310,
    tokenQuota: 25000000,
    overageUsd: 0,
    periodStart: '2026-03-01T00:00:00.000Z',
    periodEnd: '2026-03-31T23:59:59.000Z',
  },
  paymentMethod: {
    brand: 'Visa',
    last4: '4242',
  },
};
