import { Injectable } from '@nestjs/common';
import type { AgentRecord } from '@squirrellai/contracts';
import { ControlPlaneStoreService } from '../persistence/control-plane-store.service';

@Injectable()
export class AgentsService {
  constructor(private readonly controlPlaneStore: ControlPlaneStoreService) {}

  listAgents(): Promise<AgentRecord[]> {
    return this.controlPlaneStore.listAgents();
  }
}
