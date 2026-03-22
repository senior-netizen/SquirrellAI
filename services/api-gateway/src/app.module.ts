import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CorrelationIdMiddleware } from './common/correlation-id.middleware';
import { ExecutionsModule } from './executions/executions.module';

@Module({
  imports: [DatabaseModule, ExecutionsModule]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
