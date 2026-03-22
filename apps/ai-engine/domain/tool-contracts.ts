export const TOOL_NAMES = [
  'generate_openapi_spec',
  'generate_nestjs_code',
  'write_project_files',
  'install_dependencies',
  'run_tests',
  'start_service',
  'read_logs',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; issues: ValidationIssue[] };

export type TypedValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export type SideEffectClassification =
  | 'read_only'
  | 'external_state_mutation'
  | 'filesystem_mutation'
  | 'process_control';

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
  retryableErrors: string[];
};

export type ToolContract<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>> = {
  name: ToolName;
  description: string;
  inputSchema: JsonObject;
  outputSchema: JsonObject;
  validationRules: string[];
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  sideEffectClassification: SideEffectClassification;
  validateInput: (input: unknown) => TypedValidationResult<TInput>;
  validateOutput: (output: unknown) => TypedValidationResult<TOutput>;
  sanitizeInput: (input: TInput) => JsonObject;
  sanitizeOutput: (output: TOutput) => JsonObject;
};

export type ToolInputByName = {
  generate_openapi_spec: {
    productBrief: string;
    boundedContext: string;
    endpoints: Array<{
      path: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      summary: string;
    }>;
  };
  generate_nestjs_code: {
    specArtifactId: string;
    moduleName: string;
    outputDirectory: string;
  };
  write_project_files: {
    projectRoot: string;
    files: Array<{
      path: string;
      content: string;
      encoding: 'utf8';
    }>;
  };
  install_dependencies: {
    projectRoot: string;
    packageManager: 'npm' | 'pnpm' | 'yarn';
    dependencies: string[];
    devDependencies: string[];
  };
  run_tests: {
    projectRoot: string;
    command: string[];
    coverage: boolean;
  };
  start_service: {
    projectRoot: string;
    command: string[];
    port: number;
  };
  read_logs: {
    source: 'service' | 'test_run';
    limit: number;
    cursor?: string;
  };
};

export type ToolOutputByName = {
  generate_openapi_spec: {
    artifactId: string;
    spec: JsonObject;
    warnings: string[];
  };
  generate_nestjs_code: {
    artifactId: string;
    files: Array<{ path: string; content: string }>;
    warnings: string[];
  };
  write_project_files: {
    writtenFiles: string[];
    bytesWritten: number;
  };
  install_dependencies: {
    installedPackages: string[];
    lockfilePath?: string;
  };
  run_tests: {
    success: boolean;
    summary: string;
    failedTests: string[];
  };
  start_service: {
    pid: number;
    baseUrl: string;
    started: boolean;
  };
  read_logs: {
    entries: Array<{
      timestamp: string;
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
    }>;
    nextCursor?: string;
  };
};

export type AnyToolInput = ToolInputByName[ToolName];
export type AnyToolOutput = ToolOutputByName[ToolName];
