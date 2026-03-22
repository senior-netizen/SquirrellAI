import { ExecutionLogEntity } from '@squirrell/observability';
import { Repository } from 'typeorm';
export declare class ExecutionLogger {
    private readonly logRepository;
    constructor(logRepository: Repository<ExecutionLogEntity>);
    info(executionId: string, message: string, payload?: Record<string, unknown>): Promise<void>;
    error(executionId: string, message: string, error?: unknown): Promise<void>;
    sandbox(executionId: string, message: string, payload?: Record<string, unknown>): Promise<void>;
    private write;
}
