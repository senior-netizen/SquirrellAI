import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { AgentExecutionService } from '../application/AgentExecutionService.ts';
import { FileExecutionStepStore } from '../infrastructure/persistence/ExecutionStepStore.ts';
import { ToolRegistry } from '../infrastructure/tools/ToolRegistry.ts';
import type { ToolHandlerMap } from '../infrastructure/tools/ToolRegistry.ts';

const buildHandlers = (specOverride?: Record<string, unknown>): ToolHandlerMap => ({
  generate_openapi_spec: async () => ({
    artifactId: 'spec-1',
    spec:
      (specOverride as any) ??
      {
        openapi: '3.0.3',
        info: { title: 'Orders', version: '1.0.0' },
        paths: {
          '/orders': {
            get: {
              responses: {
                '200': { description: 'ok' },
              },
            },
          },
        },
      },
    warnings: [],
  }),
  generate_nestjs_code: async () => ({
    artifactId: 'code-1',
    files: [{ path: 'src/orders.controller.ts', content: 'export class OrdersController {}' }],
    warnings: [],
  }),
  write_project_files: async (input) => ({
    writtenFiles: input.files.map((file) => file.path),
    bytesWritten: input.files.reduce((sum, file) => sum + file.content.length, 0),
  }),
  install_dependencies: async (input) => ({
    installedPackages: [...input.dependencies, ...input.devDependencies],
    lockfilePath: join(input.projectRoot, 'package-lock.json'),
  }),
  run_tests: async () => ({ success: true, summary: 'all green', failedTests: [] }),
  start_service: async (input) => ({ pid: 42, baseUrl: `http://localhost:${input.port}`, started: true }),
  read_logs: async () => ({
    entries: [{ timestamp: new Date().toISOString(), level: 'info', message: 'service ready' }],
  }),
});

const request = {
  executionId: 'exec-1',
  input: {
    goal: 'Build an orders service',
    boundedContext: 'orders',
    endpoints: [{ path: '/orders', method: 'GET' as const, summary: 'List orders' }],
    outputDirectory: 'apps/generated-service/src',
    projectRoot: 'apps/generated-service',
    packageManager: 'npm' as const,
    testCommand: ['npm', 'test'],
    serviceCommand: ['npm', 'run', 'start'],
    servicePort: 3000,
  },
};

test('AgentExecutionService enforces OpenAPI validation as the first hard gate', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agent-steps-'));
  const service = new AgentExecutionService(
    new ToolRegistry(buildHandlers({ openapi: '3.0.3', info: { title: 'Broken' }, paths: {} })),
    new FileExecutionStepStore(directory),
  );

  const result = await service.executeNext(request);

  assert.equal(result.state, 'blocked');
  assert.equal(result.record.errorClassification, 'openapi_validation_error');

  const files = await readdir(join(directory, request.executionId));
  assert.equal(files.length, 1);
  const persisted = JSON.parse(await readFile(join(directory, request.executionId, files[0]), 'utf8'));
  assert.equal(persisted.toolName, 'generate_openapi_spec');
});

test('AgentExecutionService advances one validated tool at a time through explicit policy states', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agent-steps-'));
  const service = new AgentExecutionService(
    new ToolRegistry(buildHandlers()),
    new FileExecutionStepStore(directory),
  );

  const first = await service.executeNext(request);
  assert.equal(first.invokedTool, 'generate_openapi_spec');
  assert.equal(first.state, 'awaiting_code_generation');

  const second = await service.executeNext(request, first.context);
  assert.equal(second.invokedTool, 'generate_nestjs_code');
  assert.equal(second.state, 'awaiting_file_write');

  const third = await service.executeNext(request, second.context);
  assert.equal(third.invokedTool, 'write_project_files');
  assert.equal(third.state, 'awaiting_dependency_install');
});
