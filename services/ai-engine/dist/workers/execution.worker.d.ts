import { Worker, Queue } from 'bullmq';
import { ExecutionDispatchJob } from '@squirrell/observability';
import { DataSource } from 'typeorm';
export interface WorkerDependencies {
    dataSource: Pick<DataSource, 'getRepository'>;
    redisUrl: string;
}
export declare class ExecutionWorker {
    private readonly dependencies;
    readonly dispatchWorker: Worker<ExecutionDispatchJob>;
    readonly retryQueue: Queue<ExecutionDispatchJob>;
    private readonly executionRepository;
    private readonly stepRepository;
    private readonly logger;
    constructor(dependencies: WorkerDependencies);
    process(job: ExecutionDispatchJob): Promise<void>;
    private parseIntent;
}
