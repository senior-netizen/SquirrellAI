import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { ExecutionsModule } from './executions/executions.module';
import { ObservabilityModule } from './observability/observability.module';
import { PersistenceModule } from './persistence/persistence.module';
import { ToolRegistryModule } from './tool-registry/tool-registry.module';

@Module({
  imports: [PersistenceModule, AuthModule, AgentsModule, ExecutionsModule, ToolRegistryModule, ObservabilityModule],
})
export class AppModule {}
