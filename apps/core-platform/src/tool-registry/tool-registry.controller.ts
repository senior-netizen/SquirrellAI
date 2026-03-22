import { Controller, Get } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';

@Controller('tool-registry')
export class ToolRegistryController {
  constructor(private readonly toolRegistryService: ToolRegistryService) {}

  @Get()
  listTools(): ReturnType<ToolRegistryService['listTools']> {
    return this.toolRegistryService.listTools();
  }
}
