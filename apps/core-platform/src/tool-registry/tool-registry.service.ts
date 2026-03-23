import { Injectable } from '@nestjs/common';
import { mockTools } from '../data/mock-data';

@Injectable()
export class ToolRegistryService {
  listTools(): typeof mockTools {
    return mockTools;
  }
}
