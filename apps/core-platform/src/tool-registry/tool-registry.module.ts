import { Module } from '@nestjs/common';
import { ToolRegistryController } from './tool-registry.controller';
import { ToolRegistryService } from './tool-registry.service';

@Module({
  controllers: [ToolRegistryController],
  providers: [ToolRegistryService],
  exports: [ToolRegistryService],
})
export class ToolRegistryModule {}
