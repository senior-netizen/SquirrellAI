import { Injectable, NotFoundException } from '@nestjs/common';
import { ExecutionState } from '@squirrellai/contracts';
import { mockExecutionDetails } from '../data/mock-data';

@Injectable()
export class ExecutionsService {
  listExecutions(): Array<{
    id: string;
    agentId: string;
    correlationId: string;
    prompt: string;
    state: ExecutionState;
    requestedAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    summary: string;
    toolCount: number;
  }> {
    return mockExecutionDetails.map(({ logs: _logs, artifacts: _artifacts, steps: _steps, runtimeEndpoint: _runtimeEndpoint, ...execution }) => execution);
  }

  getExecution(executionId: string) {
    const execution = mockExecutionDetails.find((candidate) => candidate.id === executionId);

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} was not found`);
    }

    return execution;
  }
}
