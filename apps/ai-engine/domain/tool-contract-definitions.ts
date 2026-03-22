import type {
  JsonObject,
  ToolContract,
  ToolInputByName,
  ToolName,
  ToolOutputByName,
} from './tool-contracts.ts';
import { TOOL_NAMES } from './tool-contracts.ts';
import { validateInputForTool, validateOutputObject } from './tool-validation.ts';

const redactLargeText = (value: string, maxLength = 256) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

const sanitizeJson = (input: JsonObject): JsonObject =>
  Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, redactLargeText(value)];
      }

      if (Array.isArray(value)) {
        return [
          key,
          value.map((item) => {
            if (typeof item === 'string') {
              return redactLargeText(item);
            }
            return item;
          }),
        ];
      }

      return [key, value];
    }),
  );

const createContract = <TName extends ToolName>(
  name: TName,
  description: string,
  inputSchema: JsonObject,
  outputSchema: JsonObject,
  validationRules: string[],
  timeoutMs: number,
  retryPolicy: ToolContract<ToolInputByName[TName], ToolOutputByName[TName]>['retryPolicy'],
  sideEffectClassification: ToolContract<ToolInputByName[TName], ToolOutputByName[TName]>['sideEffectClassification'],
): ToolContract<ToolInputByName[TName], ToolOutputByName[TName]> => ({
  name,
  description,
  inputSchema,
  outputSchema,
  validationRules,
  timeoutMs,
  retryPolicy,
  sideEffectClassification,
  validateInput: (input) => validateInputForTool<ToolInputByName[TName]>(name, input),
  validateOutput: (output) => validateOutputObject<ToolOutputByName[TName]>(output),
  sanitizeInput: (input) => sanitizeJson(input),
  sanitizeOutput: (output) => sanitizeJson(output),
});

export const TOOL_CONTRACTS = {
  generate_openapi_spec: createContract(
    'generate_openapi_spec',
    'Produce an OpenAPI 3.0 specification artifact from a bounded-context brief.',
    {
      type: 'object',
      required: ['productBrief', 'boundedContext', 'endpoints'],
    },
    {
      type: 'object',
      required: ['artifactId', 'spec', 'warnings'],
    },
    [
      'Requires at least one endpoint.',
      'Every endpoint path must start with /.',
      'Only GET, POST, PUT, PATCH, DELETE methods are permitted.',
    ],
    30_000,
    { maxAttempts: 1, backoffMs: 0, retryableErrors: [] },
    'read_only',
  ),
  generate_nestjs_code: createContract(
    'generate_nestjs_code',
    'Generate deterministic NestJS source files from a previously validated OpenAPI artifact.',
    {
      type: 'object',
      required: ['specArtifactId', 'moduleName', 'outputDirectory'],
    },
    {
      type: 'object',
      required: ['artifactId', 'files', 'warnings'],
    },
    [
      'A validated specArtifactId is mandatory.',
      'The tool never accepts raw OpenAPI documents inline.',
    ],
    45_000,
    { maxAttempts: 1, backoffMs: 0, retryableErrors: [] },
    'read_only',
  ),
  write_project_files: createContract(
    'write_project_files',
    'Persist generated files into the project workspace.',
    {
      type: 'object',
      required: ['projectRoot', 'files'],
    },
    {
      type: 'object',
      required: ['writtenFiles', 'bytesWritten'],
    },
    ['Only utf8 text files are supported.', 'At least one file must be written.'],
    20_000,
    { maxAttempts: 2, backoffMs: 250, retryableErrors: ['EIO', 'EMFILE'] },
    'filesystem_mutation',
  ),
  install_dependencies: createContract(
    'install_dependencies',
    'Install package dependencies in a project workspace.',
    {
      type: 'object',
      required: ['projectRoot', 'packageManager', 'dependencies', 'devDependencies'],
    },
    {
      type: 'object',
      required: ['installedPackages'],
    },
    [
      'Only npm, pnpm, and yarn are supported.',
      'Dependency lists must be explicit arrays of package names.',
    ],
    120_000,
    { maxAttempts: 2, backoffMs: 1_000, retryableErrors: ['NETWORK', 'ETIMEDOUT'] },
    'external_state_mutation',
  ),
  run_tests: createContract(
    'run_tests',
    'Run the project test command and capture a structured result.',
    {
      type: 'object',
      required: ['projectRoot', 'command', 'coverage'],
    },
    {
      type: 'object',
      required: ['success', 'summary', 'failedTests'],
    },
    ['Command must be an explicit argv array.', 'Coverage is a boolean policy flag.'],
    120_000,
    { maxAttempts: 1, backoffMs: 0, retryableErrors: [] },
    'process_control',
  ),
  start_service: createContract(
    'start_service',
    'Start the generated service on a fixed port.',
    {
      type: 'object',
      required: ['projectRoot', 'command', 'port'],
    },
    {
      type: 'object',
      required: ['pid', 'baseUrl', 'started'],
    },
    ['Command must be explicit argv.', 'Port must be within the TCP user-port range.'],
    30_000,
    { maxAttempts: 1, backoffMs: 0, retryableErrors: [] },
    'process_control',
  ),
  read_logs: createContract(
    'read_logs',
    'Read structured logs from the most recent test or service execution.',
    {
      type: 'object',
      required: ['source', 'limit'],
    },
    {
      type: 'object',
      required: ['entries'],
    },
    ['Limit is capped at 500 entries.', 'Cursor is optional but must be non-empty when present.'],
    10_000,
    { maxAttempts: 2, backoffMs: 250, retryableErrors: ['EAGAIN'] },
    'read_only',
  ),
} satisfies {
  [K in ToolName]: ToolContract<ToolInputByName[K], ToolOutputByName[K]>;
};

export const getToolContract = <TName extends ToolName>(name: TName) => TOOL_CONTRACTS[name];

export const isKnownToolName = (value: string): value is ToolName =>
  TOOL_NAMES.includes(value as ToolName);
