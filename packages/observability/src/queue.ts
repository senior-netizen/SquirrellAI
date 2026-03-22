import type { ConnectionOptions } from 'bullmq';

export const EXECUTION_DISPATCH_QUEUE = 'execution-dispatch';
export const EXECUTION_RETRY_QUEUE = 'execution-retry';

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

export function createQueueConfig(redisUrl: string): QueueConfig {
  const url = new URL(redisUrl);
  return {
    connection: {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      db: url.pathname ? Number(url.pathname.replace('/', '') || '0') : 0,
      tls: url.protocol === 'rediss:' ? {} : undefined
    }
  };
}
