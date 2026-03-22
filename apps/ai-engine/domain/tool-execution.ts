import type { JsonObject, ToolName } from './tool-contracts.ts';

export type ToolInvocation<TInput extends Record<string, unknown> = JsonObject> = {
  name: ToolName;
  input: TInput;
};

export type ToolExecutionErrorClassification =
  | 'none'
  | 'validation_error'
  | 'unknown_tool'
  | 'policy_violation'
  | 'timeout'
  | 'handler_error'
  | 'openapi_validation_error';

export type ToolExecutionStepRecord = {
  executionId: string;
  sequence: number;
  toolName: ToolName;
  sanitizedInput: JsonObject;
  sanitizedOutput?: JsonObject;
  durationMs: number;
  errorClassification: ToolExecutionErrorClassification;
  timestamp: string;
};

export type AgentIntent = {
  goal: string;
  boundedContext: string;
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    summary: string;
  }>;
  outputDirectory: string;
  projectRoot: string;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  testCommand: string[];
  serviceCommand: string[];
  servicePort: number;
};

export type AgentState =
  | 'awaiting_openapi_spec'
  | 'awaiting_code_generation'
  | 'awaiting_file_write'
  | 'awaiting_dependency_install'
  | 'awaiting_test_run'
  | 'awaiting_service_start'
  | 'awaiting_log_read'
  | 'completed'
  | 'blocked';

export type ArtifactCatalog = {
  openApiSpecArtifactId?: string;
  openApiSpec?: JsonObject;
  nestCodeArtifactId?: string;
  generatedFiles?: string[];
  generatedFileContents?: Record<string, string>;
};

export type AgentExecutionContext = {
  executionId: string;
  state: AgentState;
  sequence: number;
  intent: AgentIntent;
  artifacts: ArtifactCatalog;
};
