declare module '@nestjs/common' {
  export type Provider = Record<string | symbol, unknown>;
  export class NotFoundException extends Error {}
  export class ValidationPipe { constructor(options?: unknown); }
  export interface NestMiddleware { use(req: unknown, res: unknown, next: (...args: unknown[]) => void): void; }
  export interface MiddlewareConsumer { apply(...middleware: unknown[]): { forRoutes(...routes: unknown[]): void }; }
  export interface NestModule { configure(consumer: MiddlewareConsumer): void; }
  export function Injectable(): ClassDecorator;
  export function Module(metadata: Record<string, unknown>): ClassDecorator;
  export function Controller(prefix?: string): ClassDecorator;
  export function Post(path?: string): MethodDecorator;
  export function Get(path?: string): MethodDecorator;
  export function Body(): ParameterDecorator;
  export function Param(param?: string): ParameterDecorator;
  export function Req(): ParameterDecorator;
  export function Inject(token?: unknown): ParameterDecorator & PropertyDecorator;
}

declare module '@nestjs/core' {
  export class NestFactory {
    static create(module: unknown): Promise<{
      useGlobalPipes(...pipes: unknown[]): void;
      listen(port: number): Promise<void>;
    }>;
  }
}

declare module '@nestjs/typeorm' {
  export interface TypeOrmModuleOptions extends Record<string, unknown> {}
  export class TypeOrmModule {
    static forRoot(options: TypeOrmModuleOptions): unknown;
    static forFeature(entities: unknown[]): unknown;
  }
  export function InjectRepository(entity: unknown): ParameterDecorator;
}

declare module 'class-validator' {
  export function IsNotEmpty(): PropertyDecorator;
  export function IsObject(): PropertyDecorator;
  export function IsOptional(): PropertyDecorator;
  export function IsString(): PropertyDecorator;
  export function MaxLength(length: number): PropertyDecorator;
}

declare module 'bullmq' {
  export interface ConnectionOptions extends Record<string, unknown> {}
  export class Queue<T = unknown> {
    constructor(name: string, options?: unknown);
    add(name: string, data: T, opts?: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
  }
  export class Worker<T = unknown> {
    constructor(name: string, processor: (job: { id?: string; data: T }) => Promise<unknown>, options?: unknown);
    on(event: 'failed', listener: (job: { id?: string; data: T } | undefined, error: unknown) => void): this;
    close(): Promise<void>;
  }
}

declare module 'express' {
  export interface Request {
    header(name: string): string | undefined;
  }
  export interface Response {
    setHeader(name: string, value: string): void;
  }
  export type NextFunction = (...args: unknown[]) => void;
}

declare module 'typeorm' {
  export function Entity(options?: unknown): ClassDecorator;
  export function Index(nameOrFields: string | string[], maybeFieldsOrOptions?: unknown, maybeOptions?: unknown): ClassDecorator & PropertyDecorator;
  export function JoinColumn(options?: unknown): PropertyDecorator;
  export function ManyToOne(typeFactory: () => unknown, inverse?: (entity: any) => unknown, options?: unknown): PropertyDecorator;
  export function OneToMany(typeFactory: () => unknown, inverse?: (entity: any) => unknown, options?: unknown): PropertyDecorator;
  export function Column(options?: unknown): PropertyDecorator;
  export function CreateDateColumn(options?: unknown): PropertyDecorator;
  export function UpdateDateColumn(options?: unknown): PropertyDecorator;
  export function PrimaryGeneratedColumn(strategy?: string): PropertyDecorator;
  export class Repository<T> {
    create(entityLike: Partial<T>): T;
    save(entity: T): Promise<T>;
    findOne(options: unknown): Promise<T | null>;
    find(options: unknown): Promise<T[]>;
  }
  export class DataSource {
    constructor(options?: Record<string, unknown>);
    initialize(): Promise<DataSource>;
    destroy(): Promise<void>;
    getRepository<T>(target: new () => T): Repository<T>;
  }
}

declare module 'node:async_hooks' {
  export class AsyncLocalStorage<T> {
    run<R>(store: T, callback: () => R): R;
    getStore(): T | undefined;
  }
}

declare module 'node:crypto' {
  export function randomUUID(): string;
}

declare module 'node:test' {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}

declare module 'node:assert/strict' {
  const assert: {
    deepEqual(actual: unknown, expected: unknown): void;
    equal(actual: unknown, expected: unknown): void;
    match(actual: string, expected: RegExp): void;
  };
  export default assert;
}

declare namespace NodeJS {
  type Signals = 'SIGINT' | 'SIGTERM';
}

declare const process: {
  env: Record<string, string | undefined>;
  once(event: NodeJS.Signals, listener: () => void): void;
  exit(code?: number): never;
};

declare module 'reflect-metadata';
