import type { ConnectionOptions } from 'bullmq';
export declare const EXECUTION_DISPATCH_QUEUE = "execution-dispatch";
export declare const EXECUTION_RETRY_QUEUE = "execution-retry";
export interface ExecutionDispatchJob {
    executionId: string;
    agentId: string;
    correlationId: string;
    requestedAt: string;
    prompt: string;
}
export interface QueueConfig {
    connection: ConnectionOptions;
}
export declare function createQueueConfig(redisUrl: string): QueueConfig;
