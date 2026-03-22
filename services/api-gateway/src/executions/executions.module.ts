import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AgentEntity,
  ArtifactEntity,
  ExecutionEntity,
  ExecutionLogEntity,
  ExecutionStepEntity
} from '@squirrell/observability';
import { queueProviders } from '../common/queue.providers';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentEntity,
      ExecutionEntity,
      ExecutionStepEntity,
      ExecutionLogEntity,
      ArtifactEntity
    ])
  ],
  controllers: [ExecutionsController],
  providers: [ExecutionsService, ...queueProviders],
  exports: [ExecutionsService]
})
export class ExecutionsModule {}
