export type Redactable = Record<string, unknown> | unknown[] | string | number | boolean | null;
export declare function redactValue(value: Redactable): Redactable;
export declare function sanitizeError(error: unknown): string;
