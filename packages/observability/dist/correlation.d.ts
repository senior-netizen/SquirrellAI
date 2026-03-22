export interface CorrelationContextValue {
    correlationId: string;
}
export declare const CORRELATION_HEADER = "x-correlation-id";
export declare function withCorrelationContext<T>(correlationId: string, callback: () => T): T;
export declare function getCorrelationId(): string | undefined;
export declare function ensureCorrelationId(candidate?: string): string;
