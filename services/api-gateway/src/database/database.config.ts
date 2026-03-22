import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { observabilityEntities } from '@squirrell/observability';

export function createDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [...observabilityEntities],
    synchronize: false,
    autoLoadEntities: false
  };
}
