import type { ArtifactEntity, ExecutionEntity, ExecutionLogEntity, ExecutionStepEntity } from '@squirrell/observability';
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
export declare function toExecutionResponse(execution: ExecutionEntity & {
    steps?: ExecutionStepEntity[];
    logs?: ExecutionLogEntity[];
    artifacts?: ArtifactEntity[];
}): ExecutionResponseDto;
