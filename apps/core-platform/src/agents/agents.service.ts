import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentsService {
  listAgents(): Array<{ id: string; status: string }> {
    return [{ id: 'planner', status: 'available' }];
  }
}
