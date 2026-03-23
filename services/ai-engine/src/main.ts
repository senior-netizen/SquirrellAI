import 'reflect-metadata';
import { observabilityEntities } from '@squirrell/observability';
import { DataSource } from 'typeorm';
import { ExecutionWorker } from './workers/execution.worker';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function bootstrap(): Promise<void> {
  const databaseUrl = getRequiredEnv('DATABASE_URL');
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379/0';
  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [...observabilityEntities],
    synchronize: false,
  });

  await dataSource.initialize();

  const worker = new ExecutionWorker({
    dataSource,
    redisUrl,
  });

  worker.dispatchWorker.on('failed', (job, error) => {
    const jobId = job?.id ?? 'unknown';
    console.error(`[ai-engine] job ${jobId} failed`, error);
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    console.info(`[ai-engine] received ${signal}, shutting down`);
    await worker.dispatchWorker.close();
    await worker.retryQueue.close();
    await dataSource.destroy();
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      shutdown(signal)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('[ai-engine] shutdown failed', error);
          process.exit(1);
        });
    });
  }

  console.info('[ai-engine] worker online');
}

bootstrap().catch((error) => {
  console.error('[ai-engine] bootstrap failed', error);
  process.exit(1);
});
