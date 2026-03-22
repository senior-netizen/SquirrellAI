import assert from 'node:assert/strict';
import test from 'node:test';
import { ToolRegistry, UnknownToolError, MalformedToolCallError } from '../infrastructure/tools/ToolRegistry.ts';
import type { ToolHandlerMap } from '../infrastructure/tools/ToolRegistry.ts';

const handlers: ToolHandlerMap = {
  generate_openapi_spec: async (input) => ({
    artifactId: 'spec-1',
    spec: {
      openapi: '3.0.3',
      info: { title: input.boundedContext, version: '1.0.0' },
      paths: {
        '/health': {
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
  generate_nestjs_code: async () => ({ artifactId: 'code-1', files: [], warnings: [] }),
  write_project_files: async () => ({ writtenFiles: ['a.ts'], bytesWritten: 1 }),
  install_dependencies: async () => ({ installedPackages: ['ajv'] }),
  run_tests: async () => ({ success: true, summary: 'all green', failedTests: [] }),
  start_service: async () => ({ pid: 123, baseUrl: 'http://localhost:3000', started: true }),
  read_logs: async () => ({ entries: [] }),
};

test('ToolRegistry rejects unknown tool names', async () => {
  const registry = new ToolRegistry(handlers);

  await assert.rejects(
    () => registry.invoke({ name: 'not_real' as never, input: {} as never }),
    UnknownToolError,
  );
});

test('ToolRegistry rejects malformed inputs', async () => {
  const registry = new ToolRegistry(handlers);

  await assert.rejects(
    () =>
      registry.invoke({
        name: 'generate_openapi_spec',
        input: {
          productBrief: '',
          boundedContext: 'billing',
          endpoints: [],
        },
      }),
    MalformedToolCallError,
  );
});

test('ToolRegistry returns sanitized input and output for valid calls', async () => {
  const registry = new ToolRegistry(handlers);

  const result = await registry.invoke({
    name: 'generate_openapi_spec',
    input: {
      productBrief: 'Create a billing API',
      boundedContext: 'billing',
      endpoints: [{ path: '/health', method: 'GET', summary: 'health' }],
    },
  });

  assert.equal((result.output as { artifactId: string }).artifactId, 'spec-1');
  assert.equal(result.sanitizedInput.boundedContext, 'billing');
  assert.deepEqual(result.sanitizedOutput.warnings, []);
});
