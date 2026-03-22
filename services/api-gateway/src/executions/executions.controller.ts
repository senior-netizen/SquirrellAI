import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../common/correlation-id.middleware';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { ExecutionsService } from './executions.service';

@Controller()
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Post('agents/:id/executions')
  createExecution(
    @Param('id') agentId: string,
    @Body() createExecutionDto: CreateExecutionDto,
    @Req() request: CorrelatedRequest
  ) {
    return this.executionsService.createExecution(agentId, createExecutionDto, request);
  }

  @Get('agents/:id/executions')
  listExecutions(@Param('id') agentId: string) {
    return this.executionsService.listExecutionsForAgent(agentId);
  }

  @Get('executions/:executionId')
  getExecution(@Param('executionId') executionId: string) {
    return this.executionsService.getExecution(executionId);
  }
}
