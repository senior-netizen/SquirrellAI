import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  CONTROL_PLANE_STORE_FILENAME,
  DEFAULT_CONTROL_PLANE_STORE,
  type AgentRecord,
  type ControlPlaneStoreSnapshot,
  type CreateExecutionInput,
  type ExecutionRecord,
  type ToolRecord,
  ExecutionState,
} from '@squirrellai/contracts';

@Injectable()
export class ControlPlaneStoreService implements OnModuleInit {
  private writeChain = Promise.resolve();

  async onModuleInit(): Promise<void> {
    await this.ensureStoreFile();
  }

  async listAgents(): Promise<AgentRecord[]> {
    const snapshot = await this.readSnapshot();
    return snapshot.agents;
  }

  async listTools(): Promise<ToolRecord[]> {
    const snapshot = await this.readSnapshot();
    return snapshot.tools;
  }

  async listExecutions(): Promise<ExecutionRecord[]> {
    const snapshot = await this.readSnapshot();
    return snapshot.executions;
  }

  async getExecutionById(id: string): Promise<ExecutionRecord> {
    const snapshot = await this.readSnapshot();
    const execution = snapshot.executions.find((entry) => entry.id === id);

    if (!execution) {
      throw new NotFoundException(`execution ${id} was not found`);
    }

    return execution;
  }

  async createExecution(input: CreateExecutionInput): Promise<ExecutionRecord> {
    return this.enqueueWrite(async () => {
      const snapshot = await this.readSnapshot();
      if (!snapshot.agents.some((agent) => agent.id === input.agentId)) {
        throw new NotFoundException(`agent ${input.agentId} was not found`);
      }

      const now = new Date().toISOString();
      const execution: ExecutionRecord = {
        id: `exec_${randomUUID().replace(/-/g, '')}`,
        agentId: input.agentId,
        prompt: input.prompt,
        requestedBy: input.requestedBy,
        state: ExecutionState.Pending,
        createdAt: now,
        updatedAt: now,
      };

      snapshot.executions.push(execution);
      await this.writeSnapshot(snapshot);
      return execution;
    });
  }

  private getStorePath(): string {
    return process.env.CONTROL_PLANE_STORE_PATH ?? join(process.cwd(), 'var', CONTROL_PLANE_STORE_FILENAME);
  }

  private async ensureStoreFile(): Promise<void> {
    const filePath = this.getStorePath();
    await mkdir(dirname(filePath), { recursive: true });

    try {
      await readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }

      await this.writeSnapshot(structuredClone(DEFAULT_CONTROL_PLANE_STORE));
    }
  }

  private async readSnapshot(): Promise<ControlPlaneStoreSnapshot> {
    await this.ensureStoreFile();
    const payload = await readFile(this.getStorePath(), 'utf8');
    return JSON.parse(payload) as ControlPlaneStoreSnapshot;
  }

  private async writeSnapshot(snapshot: ControlPlaneStoreSnapshot): Promise<void> {
    const filePath = this.getStorePath();
    await mkdir(dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(snapshot, null, 2), 'utf8');
    await rename(temporaryPath, filePath);
  }

  private enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const pending = this.writeChain.then(operation, operation);
    this.writeChain = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  }
}
