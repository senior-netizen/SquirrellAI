import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolRegistryService {
  listTools(): Array<{ name: string; owner: string }> {
    return [{ name: 'search', owner: 'ai-engine' }];
  }
}
