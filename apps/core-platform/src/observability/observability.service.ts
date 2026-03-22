import { Injectable } from '@nestjs/common';

@Injectable()
export class ObservabilityService {
  getReadiness(): { ready: boolean; checks: string[] } {
    return {
      ready: true,
      checks: ['http-server', 'contract-registry'],
    };
  }
}
