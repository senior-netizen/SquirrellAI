import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { ExecutionsModule } from './executions/executions.module';
import { ObservabilityModule } from './observability/observability.module';
import { ToolRegistryModule } from './tool-registry/tool-registry.module';

@Module({
  imports: [AuthModule, AgentsModule, ExecutionsModule, ToolRegistryModule, ObservabilityModule],
})
export class AppModule {}
