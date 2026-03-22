import { SandboxMetadata } from '../../domain/execution/execution-record';

export const SANDBOX_RUNTIME = Symbol('SANDBOX_RUNTIME');

export type SandboxCommandId =
  | 'install-dependencies'
  | 'run-tests'
  | 'start-service'
  | 'read-log'
  | 'write-file';

export interface ResourceLimits {
  memoryBytes: number;
  nanoCpus: number;
}

export interface SandboxExecutionRequest {
  executionId: string;
  projectDirectory: string;
  commandId: SandboxCommandId;
  argv: string[];
  env?: Record<string, string>;
  timeoutMs: number;
  networkAccess?: boolean;
  resourceLimits: ResourceLimits;
}

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  metadata: SandboxMetadata;
  timedOut: boolean;
}

export interface SandboxRuntime {
  execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult>;
}
