export interface SandboxMetadata {
  containerId: string;
  imageDigest: string;
  startedAt: Date;
  stoppedAt: Date;
  exitCode: number | null;
}

export type ExecutionStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'timed_out';

export interface ExecutionRecord {
  id: string;
  projectId: string;
  command: string[];
  status: ExecutionStatus;
  timeoutMs: number;
  createdAt: Date;
  updatedAt: Date;
  sandboxMetadata?: SandboxMetadata;
  stdout?: string;
  stderr?: string;
  errorMessage?: string;
}
