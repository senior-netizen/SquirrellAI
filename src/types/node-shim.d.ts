declare namespace NodeJS {
  interface ReadableStream {
    on(event: 'data', listener: (chunk: unknown) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: unknown) => void): this;
  }
}

declare class Buffer {
  static from(data: string | ArrayLike<number> | ArrayBuffer, encoding?: string): Buffer;
  static concat(chunks: readonly Buffer[]): Buffer;
  static isBuffer(value: unknown): value is Buffer;
  toString(encoding?: string): string;
}

declare module 'node:crypto' {
  export function randomUUID(): string;
}

declare module 'node:test' {
  export interface TestContext {}
  export default function test(
    name: string,
    fn: (context: TestContext) => void | Promise<void>,
  ): void;
}

declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown): void;
    deepEqual(actual: unknown, expected: unknown): void;
    ok(value: unknown): void;
    throws(block: () => void, error?: unknown): void;
  };
  export default assert;
}

declare module 'node:fs/promises' {
  export function readFile(path: string, encoding: string): Promise<string>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function writeFile(
    path: string,
    data: Buffer,
    options?: { mode?: number },
  ): Promise<void>;
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
}
