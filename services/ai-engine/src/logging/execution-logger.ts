import {
  ExecutionLogEntity,
  ExecutionLogSource,
  getCorrelationId,
  redactValue,
  sanitizeError
} from '@squirrell/observability';
import { Repository } from 'typeorm';

export class ExecutionLogger {
  constructor(private readonly logRepository: Repository<ExecutionLogEntity>) {}

  async info(executionId: string, message: string, payload?: Record<string, unknown>): Promise<void> {
    await this.write(executionId, 'info', message, payload);
  }

  async error(executionId: string, message: string, error?: unknown): Promise<void> {
    await this.write(executionId, 'error', message, error ? { error: sanitizeError(error) } : undefined);
  }

  async sandbox(executionId: string, message: string, payload?: Record<string, unknown>): Promise<void> {
    await this.write(executionId, 'info', message, payload, ExecutionLogSource.Sandbox);
  }

  private async write(
    executionId: string,
    level: string,
    message: string,
    payload?: Record<string, unknown>,
    source: ExecutionLogSource = ExecutionLogSource.AiEngine
  ): Promise<void> {
    await this.logRepository.save(
      this.logRepository.create({
        executionId,
        correlationId: getCorrelationId() ?? '00000000-0000-0000-0000-000000000000',
        source,
        level,
        message: String(redactValue(message)),
        payload: payload ? (redactValue(payload) as Record<string, unknown>) : null
      })
    );
  }
}
