import type { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  CORRELATION_HEADER,
  ensureCorrelationId,
  withCorrelationContext
} from '@squirrell/observability';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(request: CorrelatedRequest, response: Response, next: NextFunction): void {
    const correlationId = ensureCorrelationId(request.header(CORRELATION_HEADER));
    request.correlationId = correlationId;
    response.setHeader(CORRELATION_HEADER, correlationId);

    withCorrelationContext(correlationId, () => next());
  }
}
