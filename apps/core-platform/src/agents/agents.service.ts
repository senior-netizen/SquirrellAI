import { Injectable } from '@nestjs/common';
import { mockAgents } from '../data/mock-data';

@Injectable()
export class AgentsService {
  listAgents(): typeof mockAgents {
    return mockAgents;
  }
}
