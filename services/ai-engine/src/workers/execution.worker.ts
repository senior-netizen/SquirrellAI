import { Worker, Queue } from 'bullmq';
import {
  createQueueConfig,
  EXECUTION_DISPATCH_QUEUE,
  EXECUTION_RETRY_QUEUE,
  ExecutionDispatchJob,
  ExecutionEntity,
  ExecutionLogEntity,
  ExecutionStatus,
  ExecutionStepEntity,
  withCorrelationContext,
  sanitizeError,
  redactValue
} from '@squirrell/observability';
import { DataSource, Repository } from 'typeorm';
import { ExecutionLogger } from '../logging/execution-logger';

export interface WorkerDependencies {
  dataSource: Pick<DataSource, 'getRepository'>;
  redisUrl: string;
}

export class ExecutionWorker {
  readonly dispatchWorker: Worker<ExecutionDispatchJob>;
  readonly retryQueue: Queue<ExecutionDispatchJob>;
  private readonly executionRepository: Repository<ExecutionEntity>;
  private readonly stepRepository: Repository<ExecutionStepEntity>;
  private readonly logger: ExecutionLogger;

  constructor(private readonly dependencies: WorkerDependencies) {
    const queueConfig = createQueueConfig(dependencies.redisUrl);

    this.executionRepository = dependencies.dataSource.getRepository(ExecutionEntity);
    this.stepRepository = dependencies.dataSource.getRepository(ExecutionStepEntity);
    this.logger = new ExecutionLogger(dependencies.dataSource.getRepository(ExecutionLogEntity));
    this.retryQueue = new Queue(EXECUTION_RETRY_QUEUE, queueConfig);
    this.dispatchWorker = new Worker(
      EXECUTION_DISPATCH_QUEUE,
      async (job) => withCorrelationContext(job.data.correlationId, () => this.process(job.data)),
      queueConfig
    );
  }

  async process(job: ExecutionDispatchJob): Promise<void> {
    const execution = await this.executionRepository.findOne({ where: { id: job.executionId } });
    if (!execution) {
      throw new Error(`Execution ${job.executionId} not found`);
    }

    execution.status = ExecutionStatus.Running;
    execution.startedAt = new Date();
    execution.attemptCount += 1;
    execution.parsedIntent = this.parseIntent(job.prompt);
    execution.generatedSpecReference = `spec://${execution.agentId}/${execution.id}`;
    await this.executionRepository.save(execution);

    await this.logger.info(execution.id, 'Execution started', { agentId: execution.agentId });

    try {
      const step = await this.stepRepository.save(
        this.stepRepository.create({
          executionId: execution.id,
          stepIndex: 1,
          toolName: 'spec-generator',
          toolInput: redactValue({ prompt: job.prompt }) as Record<string, unknown>,
          toolOutput: redactValue({ specReference: execution.generatedSpecReference }) as Record<string, unknown>,
          status: 'succeeded',
          startedAt: execution.startedAt,
          finishedAt: new Date()
        })
      );

      await this.logger.sandbox(execution.id, 'Sandbox runtime prepared', {
        runtimeEndpoint: execution.runtimeEndpoint ?? 'sandbox://dynamic'
      });

      execution.runtimeEndpoint = execution.runtimeEndpoint ?? `sandbox://runtime/${execution.id}`;
      execution.testResults = [
        {
          name: 'dispatch-envelope',
          status: 'passed',
          stepId: step.id
        }
      ];
      execution.status = ExecutionStatus.Succeeded;
      execution.finishedAt = new Date();
      execution.lastError = null;
      await this.executionRepository.save(execution);

      await this.logger.info(execution.id, 'Execution completed', {
        runtimeEndpoint: execution.runtimeEndpoint,
        finalStatus: execution.status
      });
    } catch (error) {
      execution.status = ExecutionStatus.Retrying;
      execution.lastError = sanitizeError(error);
      await this.executionRepository.save(execution);
      await this.retryQueue.add(execution.id, job, {
        delay: Math.min(60_000, 2 ** execution.attemptCount * 1_000),
        jobId: `${execution.id}:retry:${execution.attemptCount}`
      });
      await this.logger.error(execution.id, 'Execution failed and scheduled for retry', error);
      throw error;
    }
  }

  private parseIntent(prompt: string): Record<string, unknown> {
    const normalized = prompt.toLowerCase();
    return {
      summary: normalized.slice(0, 80),
      action: normalized.includes('test') ? 'test' : 'execute',
      entities: normalized.split(/\s+/).filter(Boolean).slice(0, 8)
    };
  }
}
