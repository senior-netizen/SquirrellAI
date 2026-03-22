import type { NextFunction, Request, Response } from 'express';
import { NestMiddleware } from '@nestjs/common';
export interface CorrelatedRequest extends Request {
    correlationId?: string;
}
export declare class CorrelationIdMiddleware implements NestMiddleware {
    use(request: CorrelatedRequest, response: Response, next: NextFunction): void;
}
