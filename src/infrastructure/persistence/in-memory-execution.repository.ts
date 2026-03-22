import { ExecutionRecord } from '../../domain/execution/execution-record';
import { ExecutionRepository } from '../../domain/execution/execution-repository';

export class InMemoryExecutionRepository implements ExecutionRepository {
  private readonly records = new Map<string, ExecutionRecord>();

  async create(record: ExecutionRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async update(record: ExecutionRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async findById(id: string): Promise<ExecutionRecord | undefined> {
    return this.records.get(id);
  }
}
