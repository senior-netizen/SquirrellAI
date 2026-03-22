import { ExecutionRecord } from './execution-record';

export const EXECUTION_REPOSITORY = Symbol('EXECUTION_REPOSITORY');

export interface ExecutionRepository {
  create(record: ExecutionRecord): Promise<void>;
  update(record: ExecutionRecord): Promise<void>;
  findById(id: string): Promise<ExecutionRecord | undefined>;
}
