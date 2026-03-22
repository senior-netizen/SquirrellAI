import { Queue } from 'bullmq';
import { AgentEntity, ExecutionDispatchJob, ExecutionEntity, ExecutionLogEntity, ExecutionStepEntity, ArtifactEntity } from '@squirrell/observability';
import { Repository } from 'typeorm';
import type { CorrelatedRequest } from '../common/correlation-id.middleware';
import { CreateExecutionDto } from './dto/create-execution.dto';
export declare class ExecutionsService {
    private readonly agentRepository;
    private readonly executionRepository;
    private readonly executionStepRepository;
    private readonly executionLogRepository;
    private readonly artifactRepository;
    private readonly dispatchQueue;
    constructor(agentRepository: Repository<AgentEntity>, executionRepository: Repository<ExecutionEntity>, executionStepRepository: Repository<ExecutionStepEntity>, executionLogRepository: Repository<ExecutionLogEntity>, artifactRepository: Repository<ArtifactEntity>, dispatchQueue: Queue<ExecutionDispatchJob>);
    createExecution(agentId: string, dto: CreateExecutionDto, request: CorrelatedRequest): Promise<import("./dto/execution-response.dto").ExecutionResponseDto>;
    listExecutionsForAgent(agentId: string): Promise<import("./dto/execution-response.dto").ExecutionResponseDto[]>;
    getExecution(executionId: string): Promise<import("./dto/execution-response.dto").ExecutionResponseDto>;
}
