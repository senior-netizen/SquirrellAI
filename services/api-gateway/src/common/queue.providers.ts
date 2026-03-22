import { Provider } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  createQueueConfig,
  EXECUTION_DISPATCH_QUEUE,
  EXECUTION_RETRY_QUEUE
} from '@squirrell/observability';

export const EXECUTION_DISPATCH_QUEUE_TOKEN = Symbol('EXECUTION_DISPATCH_QUEUE_TOKEN');
export const EXECUTION_RETRY_QUEUE_TOKEN = Symbol('EXECUTION_RETRY_QUEUE_TOKEN');

function buildQueue(queueName: string): Queue {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379/0';
  return new Queue(queueName, createQueueConfig(redisUrl));
}

export const queueProviders: Provider[] = [
  {
    provide: EXECUTION_DISPATCH_QUEUE_TOKEN,
    useFactory: () => buildQueue(EXECUTION_DISPATCH_QUEUE)
  },
  {
    provide: EXECUTION_RETRY_QUEUE_TOKEN,
    useFactory: () => buildQueue(EXECUTION_RETRY_QUEUE)
  }
];
