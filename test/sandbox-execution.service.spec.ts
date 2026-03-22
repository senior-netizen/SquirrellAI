import test from 'node:test';
import assert from 'node:assert/strict';
import { SandboxExecutionService } from '../src/application/sandbox/sandbox-execution.service';
import { ToolCommandPolicy } from '../src/application/tools/tool-command-policy';
import { InMemoryExecutionRepository } from '../src/infrastructure/persistence/in-memory-execution.repository';
import { SandboxRuntime } from '../src/application/sandbox/sandbox.types';

test('SandboxExecutionService persists sandbox metadata on the execution record', async () => {
  const repository = new InMemoryExecutionRepository();
  const runtime: SandboxRuntime = {
    execute: async () => ({
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      metadata: {
        containerId: 'container-123',
        imageDigest: 'sha256:image',
        startedAt: new Date('2026-03-22T00:00:00.000Z'),
        stoppedAt: new Date('2026-03-22T00:00:02.000Z'),
        exitCode: 0,
      },
    }),
  };

  const service = new SandboxExecutionService(runtime, repository, new ToolCommandPolicy());
  const result = await service.executeTool({
    projectId: 'project-1',
    projectDirectory: '/tmp/project-1',
    action: 'runTests',
    timeoutMs: 30_000,
  });

  assert.equal(result.status, 'succeeded');
  assert.equal(result.sandboxMetadata?.containerId, 'container-123');
  assert.equal(result.sandboxMetadata?.imageDigest, 'sha256:image');
  assert.equal(result.sandboxMetadata?.exitCode, 0);

  const saved = await repository.findById(result.id);
  assert.equal(saved?.sandboxMetadata?.containerId, 'container-123');
});

test('SandboxExecutionService disables network access by default', async () => {
  const repository = new InMemoryExecutionRepository();
  const capturedRequests: unknown[] = [];
  const runtime: SandboxRuntime = {
    execute: async (request) => {
      capturedRequests.push(request);
      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        timedOut: false,
        metadata: {
          containerId: 'container-123',
          imageDigest: 'sha256:image',
          startedAt: new Date(),
          stoppedAt: new Date(),
          exitCode: 0,
        },
      };
    },
  };

  const service = new SandboxExecutionService(runtime, repository, new ToolCommandPolicy());
  await service.executeTool({
    projectId: 'project-2',
    projectDirectory: '/tmp/project-2',
    action: 'installDependencies',
    timeoutMs: 30_000,
  });

  assert.equal((capturedRequests[0] as { networkAccess: boolean }).networkAccess, false);
});
