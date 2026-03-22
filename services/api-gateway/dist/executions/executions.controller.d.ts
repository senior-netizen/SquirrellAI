import type { CorrelatedRequest } from '../common/correlation-id.middleware';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { ExecutionsService } from './executions.service';
export declare class ExecutionsController {
    private readonly executionsService;
    constructor(executionsService: ExecutionsService);
    createExecution(agentId: string, createExecutionDto: CreateExecutionDto, request: CorrelatedRequest): Promise<import("./dto/execution-response.dto").ExecutionResponseDto>;
    listExecutions(agentId: string): Promise<import("./dto/execution-response.dto").ExecutionResponseDto[]>;
    getExecution(executionId: string): Promise<import("./dto/execution-response.dto").ExecutionResponseDto>;
}
