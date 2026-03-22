import test from 'node:test';
import assert from 'node:assert/strict';
import { toExecutionResponse } from '../services/api-gateway/src/executions/dto/execution-response.dto.ts';

test('toExecutionResponse orders tool calls and exposes observability fields', () => {
  const response = toExecutionResponse({
    id: 'execution-1',
    agentId: 'agent-1',
    correlationId: 'corr-1',
    inputPrompt: 'Run tests',
    parsedIntent: { action: 'test' },
    generatedSpecReference: 'spec://agent-1/execution-1',
    runtimeEndpoint: 'sandbox://runtime/execution-1',
    testResults: [{ status: 'passed' }],
    status: 'succeeded',
    requestedAt: new Date('2026-01-01T00:00:00.000Z'),
    startedAt: new Date('2026-01-01T00:00:01.000Z'),
    finishedAt: new Date('2026-01-01T00:00:02.000Z'),
    steps: [
      {
        stepIndex: 2,
        toolName: 'second',
        status: 'succeeded',
        toolInput: null,
        toolOutput: null,
        startedAt: new Date('2026-01-01T00:00:01.500Z'),
        finishedAt: new Date('2026-01-01T00:00:01.900Z')
      },
      {
        stepIndex: 1,
        toolName: 'first',
        status: 'succeeded',
        toolInput: { x: 1 },
        toolOutput: { y: 2 },
        startedAt: new Date('2026-01-01T00:00:01.000Z'),
        finishedAt: new Date('2026-01-01T00:00:01.400Z')
      }
    ],
    logs: [
      {
        source: 'ai_engine',
        level: 'info',
        message: 'later',
        payload: null,
        createdAt: new Date('2026-01-01T00:00:03.000Z')
      },
      {
        source: 'api_gateway',
        level: 'info',
        message: 'earlier',
        payload: null,
        createdAt: new Date('2026-01-01T00:00:00.500Z')
      }
    ],
    artifacts: [
      {
        kind: 'spec',
        uri: 's3://bucket/spec.json',
        metadata: { size: 10 }
      }
    ]
  } as never);

  assert.equal(response.inputPrompt, 'Run tests');
  assert.deepEqual(
    response.orderedToolCallLog.map((entry) => entry.toolName),
    ['first', 'second']
  );
  assert.deepEqual(
    response.logs.map((entry) => entry.message),
    ['earlier', 'later']
  );
  assert.equal(response.finalStatus, 'succeeded');
  assert.equal(response.runtimeEndpoint, 'sandbox://runtime/execution-1');
});
