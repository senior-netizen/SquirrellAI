import { randomUUID } from 'node:crypto';
import { ExecutionRecord } from '../../domain/execution/execution-record';
import { ExecutionRepository } from '../../domain/execution/execution-repository';
import { SandboxExecutionRequest, SandboxExecutionResult, SandboxRuntime } from './sandbox.types';
import { AllowedToolCommand, ToolAction, ToolCommandPolicy } from '../tools/tool-command-policy';

export interface ExecuteToolRequest {
  projectId: string;
  projectDirectory: string;
  action: ToolAction;
  timeoutMs: number;
  options?: {
    relativePath?: string;
    contents?: string;
    mode?: number;
  };
  networkAccess?: boolean;
}

export class SandboxExecutionService {
  constructor(
    private readonly sandboxRuntime: SandboxRuntime,
    private readonly executionRepository: ExecutionRepository,
    private readonly toolCommandPolicy: ToolCommandPolicy,
  ) {}

  async executeTool(request: ExecuteToolRequest): Promise<ExecutionRecord> {
    const executionId = randomUUID();
    const allowedCommand = this.resolveAllowedCommand(request.action, request.options);
    const createdAt = new Date();

    const record: ExecutionRecord = {
      id: executionId,
      projectId: request.projectId,
      command: allowedCommand.argv,
      status: 'pending',
      timeoutMs: request.timeoutMs,
      createdAt,
      updatedAt: createdAt,
    };
    await this.executionRepository.create(record);

    const runningRecord: ExecutionRecord = {
      ...record,
      status: 'running',
      updatedAt: new Date(),
    };
    await this.executionRepository.update(runningRecord);

    try {
      const result = await this.sandboxRuntime.execute(this.toSandboxRequest(executionId, request, allowedCommand));
      const finishedRecord = this.mergeResult(runningRecord, result);
      await this.executionRepository.update(finishedRecord);
      return finishedRecord;
    } catch (error) {
      const failedRecord: ExecutionRecord = {
        ...runningRecord,
        status: 'failed',
        updatedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown sandbox execution failure',
      };
      await this.executionRepository.update(failedRecord);
      throw error;
    }
  }

  private resolveAllowedCommand(
    action: ToolAction,
    options?: ExecuteToolRequest['options'],
  ): AllowedToolCommand {
    if (action === 'readLog') {
      return this.toolCommandPolicy.resolve(action, { relativePath: options?.relativePath ?? '' });
    }

    if (action === 'writeFile') {
      return this.toolCommandPolicy.resolve(action, {
        relativePath: options?.relativePath ?? '',
        contents: options?.contents ?? '',
        mode: options?.mode,
      });
    }

    return this.toolCommandPolicy.resolve(action);
  }

  private toSandboxRequest(
    executionId: string,
    request: ExecuteToolRequest,
    command: AllowedToolCommand,
  ): SandboxExecutionRequest {
    return {
      executionId,
      projectDirectory: request.projectDirectory,
      commandId: command.commandId,
      argv: command.argv,
      env: command.env,
      timeoutMs: request.timeoutMs,
      networkAccess: request.networkAccess ?? false,
      resourceLimits: {
        memoryBytes: 512 * 1024 * 1024,
        nanoCpus: 1_000_000_000,
      },
    };
  }

  private mergeResult(record: ExecutionRecord, result: SandboxExecutionResult): ExecutionRecord {
    return {
      ...record,
      status: result.timedOut ? 'timed_out' : result.exitCode === 0 ? 'succeeded' : 'failed',
      stdout: result.stdout,
      stderr: result.stderr,
      sandboxMetadata: result.metadata,
      updatedAt: new Date(),
    };
  }
}
