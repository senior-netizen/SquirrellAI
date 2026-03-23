import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AgentsService } from './agents.service';

@UseGuards(AuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  listAgents(): ReturnType<AgentsService['listAgents']> {
    return this.agentsService.listAgents();
  }
}
