import type {
  ArtifactEntity,
  ExecutionEntity,
  ExecutionLogEntity,
  ExecutionStepEntity
} from '@squirrell/observability';

export interface ExecutionResponseDto {
  executionId: string;
  agentId: string;
  correlationId: string;
  inputPrompt: string;
  parsedIntent: Record<string, unknown> | null;
  generatedSpecReference: string | null;
  orderedToolCallLog: Array<{
    stepIndex: number;
    toolName: string;
    status: string;
    toolInput: Record<string, unknown> | null;
    toolOutput: Record<string, unknown> | null;
    startedAt: string | null;
    finishedAt: string | null;
  }>;
  logs: Array<{
    source: string;
    level: string;
    message: string;
    payload: Record<string, unknown> | null;
    createdAt: string;
  }>;
  testResults: Array<Record<string, unknown>>;
  runtimeEndpoint: string | null;
  finalStatus: string;
  artifacts: Array<{
    kind: string;
    uri: string;
    metadata: Record<string, unknown>;
  }>;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export function toExecutionResponse(
  execution: ExecutionEntity & {
    steps?: ExecutionStepEntity[];
    logs?: ExecutionLogEntity[];
    artifacts?: ArtifactEntity[];
  }
): ExecutionResponseDto {
  const orderedSteps = [...(execution.steps ?? [])].sort((left, right) => left.stepIndex - right.stepIndex);
  const orderedLogs = [...(execution.logs ?? [])].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
  );

  return {
    executionId: execution.id,
    agentId: execution.agentId,
    correlationId: execution.correlationId,
    inputPrompt: execution.inputPrompt,
    parsedIntent: execution.parsedIntent,
    generatedSpecReference: execution.generatedSpecReference,
    orderedToolCallLog: orderedSteps.map((step) => ({
      stepIndex: step.stepIndex,
      toolName: step.toolName,
      status: step.status,
      toolInput: step.toolInput,
      toolOutput: step.toolOutput,
      startedAt: step.startedAt?.toISOString() ?? null,
      finishedAt: step.finishedAt?.toISOString() ?? null
    })),
    logs: orderedLogs.map((log) => ({
      source: log.source,
      level: log.level,
      message: log.message,
      payload: log.payload,
      createdAt: log.createdAt.toISOString()
    })),
    testResults: execution.testResults,
    runtimeEndpoint: execution.runtimeEndpoint,
    finalStatus: execution.status,
    artifacts: (execution.artifacts ?? []).map((artifact) => ({
      kind: artifact.kind,
      uri: artifact.uri,
      metadata: artifact.metadata
    })),
    requestedAt: execution.requestedAt.toISOString(),
    startedAt: execution.startedAt?.toISOString() ?? null,
    finishedAt: execution.finishedAt?.toISOString() ?? null
  };
}
