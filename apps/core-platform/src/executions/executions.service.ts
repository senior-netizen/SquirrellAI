import { Injectable } from '@nestjs/common';
import { ExecutionState } from '@squirrellai/contracts';

@Injectable()
export class ExecutionsService {
  listExecutions(): Array<{ id: string; state: ExecutionState }> {
    return [{ id: 'exec_001', state: ExecutionState.Pending }];
  }
}
