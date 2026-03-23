import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ToolRegistryService } from './tool-registry.service';

@UseGuards(AuthGuard)
@Controller('tool-registry')
export class ToolRegistryController {
  constructor(private readonly toolRegistryService: ToolRegistryService) {}

  @Get()
  listTools(): ReturnType<ToolRegistryService['listTools']> {
    return this.toolRegistryService.listTools();
  }
}
