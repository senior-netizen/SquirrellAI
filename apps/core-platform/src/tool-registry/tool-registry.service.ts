import { Injectable } from '@nestjs/common';
import type { ToolRecord } from '@squirrellai/contracts';
import { ControlPlaneStoreService } from '../persistence/control-plane-store.service';

@Injectable()
export class ToolRegistryService {
  constructor(private readonly controlPlaneStore: ControlPlaneStoreService) {}

  listTools(): Promise<ToolRecord[]> {
    return this.controlPlaneStore.listTools();
  }
}
