import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolExecutionStepRecord } from '../../domain/tool-execution.ts';

export interface ExecutionStepStore {
  persist(step: ToolExecutionStepRecord): Promise<void>;
}

export class FileExecutionStepStore implements ExecutionStepStore {
  private readonly baseDirectory: string;

  constructor(baseDirectory: string) {
    this.baseDirectory = baseDirectory;
  }

  async persist(step: ToolExecutionStepRecord): Promise<void> {
    const directory = join(this.baseDirectory, step.executionId);
    await mkdir(directory, { recursive: true });

    const filePath = join(directory, `${String(step.sequence).padStart(4, '0')}-${step.toolName}.json`);
    await writeFile(filePath, JSON.stringify(step, null, 2), 'utf8');
  }
}
