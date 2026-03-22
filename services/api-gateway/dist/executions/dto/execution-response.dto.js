"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toExecutionResponse = toExecutionResponse;
function toExecutionResponse(execution) {
    const orderedSteps = [...(execution.steps ?? [])].sort((left, right) => left.stepIndex - right.stepIndex);
    const orderedLogs = [...(execution.logs ?? [])].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
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
//# sourceMappingURL=execution-response.dto.js.map