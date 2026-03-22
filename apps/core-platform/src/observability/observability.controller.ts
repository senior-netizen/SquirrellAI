import { Controller, Get } from '@nestjs/common';
import { ObservabilityService } from './observability.service';

@Controller('observability')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('readiness')
  getReadiness(): ReturnType<ObservabilityService['getReadiness']> {
    return this.observabilityService.getReadiness();
  }
}
