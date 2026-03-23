import { Injectable } from '@nestjs/common';
import type { CreateExecutionInput, ExecutionRecord } from '@squirrellai/contracts';
import { ControlPlaneStoreService } from '../persistence/control-plane-store.service';

@Injectable()
export class ExecutionsService {
  constructor(private readonly controlPlaneStore: ControlPlaneStoreService) {}

  listExecutions(): Promise<ExecutionRecord[]> {
    return this.controlPlaneStore.listExecutions();
  }

  createExecution(input: CreateExecutionInput): Promise<ExecutionRecord> {
    return this.controlPlaneStore.createExecution(input);
  }

  getExecutionById(id: string): Promise<ExecutionRecord> {
    return this.controlPlaneStore.getExecutionById(id);
  }
}
