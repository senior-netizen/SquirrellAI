import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ExecutionState } from '@squirrellai/contracts';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { ExecutionsService } from './executions.service';

@UseGuards(AuthGuard)
@Controller('executions')
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Get()
  listExecutions(): ReturnType<ExecutionsService['listExecutions']> {
    return this.executionsService.listExecutions();
  }

  @Post()
  createExecution(
    @Body() body: CreateExecutionDto,
    @Req() request: Request & { auth?: { sub: string } },
  ): ReturnType<ExecutionsService['createExecution']> {
    return this.executionsService.createExecution({
      agentId: body.agentId,
      prompt: body.prompt,
      requestedBy: request.auth!.sub,
    });
  }

  @Get('states')
  listStates(): typeof ExecutionState {
    return ExecutionState;
  }

  @Get(':id')
  getExecutionById(@Param('id') id: string): ReturnType<ExecutionsService['getExecutionById']> {
    return this.executionsService.getExecutionById(id);
  }
}
