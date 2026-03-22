import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import {
  AgentEntity,
  ExecutionDispatchJob,
  ExecutionEntity,
  ExecutionLogEntity,
  ExecutionLogSource,
  ExecutionStatus,
  ExecutionStepEntity,
  ArtifactEntity,
  redactValue
} from '@squirrell/observability';
import { Repository } from 'typeorm';
import { EXECUTION_DISPATCH_QUEUE_TOKEN } from '../common/queue.providers';
import type { CorrelatedRequest } from '../common/correlation-id.middleware';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { toExecutionResponse } from './dto/execution-response.dto';

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    @InjectRepository(ExecutionEntity)
    private readonly executionRepository: Repository<ExecutionEntity>,
    @InjectRepository(ExecutionStepEntity)
    private readonly executionStepRepository: Repository<ExecutionStepEntity>,
    @InjectRepository(ExecutionLogEntity)
    private readonly executionLogRepository: Repository<ExecutionLogEntity>,
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    @Inject(EXECUTION_DISPATCH_QUEUE_TOKEN)
    private readonly dispatchQueue: Queue<ExecutionDispatchJob>
  ) {}

  async createExecution(agentId: string, dto: CreateExecutionDto, request: CorrelatedRequest) {
    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} was not found`);
    }

    const execution = await this.executionRepository.save(
      this.executionRepository.create({
        agentId,
        correlationId: request.correlationId!,
        inputPrompt: dto.prompt,
        runtimeEndpoint: agent.runtimeEndpoint,
        status: ExecutionStatus.Queued,
        parsedIntent: null,
        generatedSpecReference: null,
        testResults: []
      })
    );

    await this.executionLogRepository.save(
      this.executionLogRepository.create({
        executionId: execution.id,
        correlationId: execution.correlationId,
        source: ExecutionLogSource.ApiGateway,
        level: 'info',
        message: 'Execution accepted by API gateway',
        payload: redactValue({ context: dto.context ?? null }) as Record<string, unknown>
      })
    );

    await this.dispatchQueue.add(
      execution.id,
      {
        executionId: execution.id,
        agentId,
        correlationId: execution.correlationId,
        requestedAt: execution.requestedAt.toISOString(),
        prompt: dto.prompt
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1_000
        },
        removeOnComplete: 500,
        removeOnFail: 1_000,
        jobId: execution.id
      }
    );

    return this.getExecution(execution.id);
  }

  async listExecutionsForAgent(agentId: string) {
    const executions = await this.executionRepository.find({
      where: { agentId },
      relations: { steps: true, logs: true, artifacts: true },
      order: { requestedAt: 'DESC' }
    });

    return executions.map((execution) => toExecutionResponse(execution));
  }

  async getExecution(executionId: string) {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: { steps: true, logs: true, artifacts: true }
    });

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} was not found`);
    }

    return toExecutionResponse(execution);
  }
}
