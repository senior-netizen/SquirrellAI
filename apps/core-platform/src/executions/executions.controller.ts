import { Controller, Get, Param } from '@nestjs/common';
import { ExecutionState } from '@squirrellai/contracts';
import { ExecutionsService } from './executions.service';

@Controller('executions')
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Get()
  listExecutions(): ReturnType<ExecutionsService['listExecutions']> {
    return this.executionsService.listExecutions();
  }

  @Get('states')
  listStates(): typeof ExecutionState {
    return ExecutionState;
  }

  @Get(':executionId')
  getExecution(@Param('executionId') executionId: string): ReturnType<ExecutionsService['getExecution']> {
    return this.executionsService.getExecution(executionId);
  }
}
