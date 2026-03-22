import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface CorrelationContextValue {
  correlationId: string;
}

const correlationStore = new AsyncLocalStorage<CorrelationContextValue>();
export const CORRELATION_HEADER = 'x-correlation-id';

export function withCorrelationContext<T>(correlationId: string, callback: () => T): T {
  return correlationStore.run({ correlationId }, callback);
}

export function getCorrelationId(): string | undefined {
  return correlationStore.getStore()?.correlationId;
}

export function ensureCorrelationId(candidate?: string): string {
  return candidate && candidate.length > 0 ? candidate : randomUUID();
}
