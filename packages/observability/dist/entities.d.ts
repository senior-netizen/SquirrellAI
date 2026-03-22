export declare enum ExecutionStatus {
    Pending = "pending",
    Queued = "queued",
    Running = "running",
    Succeeded = "succeeded",
    Failed = "failed",
    Retrying = "retrying",
    Cancelled = "cancelled"
}
export declare enum ExecutionLogSource {
    ApiGateway = "api_gateway",
    AiEngine = "ai_engine",
    Sandbox = "sandbox"
}
export declare class AgentEntity {
    id: string;
    name: string;
    description: string | null;
    runtimeEndpoint: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    executions: ExecutionEntity[];
}
export declare class ExecutionEntity {
    id: string;
    agentId: string;
    agent: AgentEntity;
    correlationId: string;
    inputPrompt: string;
    parsedIntent: Record<string, unknown> | null;
    generatedSpecReference: string | null;
    runtimeEndpoint: string | null;
    testResults: Array<Record<string, unknown>>;
    status: ExecutionStatus;
    attemptCount: number;
    lastError: string | null;
    requestedAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    steps: ExecutionStepEntity[];
    logs: ExecutionLogEntity[];
    artifacts: ArtifactEntity[];
}
export declare class ExecutionStepEntity {
    id: string;
    executionId: string;
    execution: ExecutionEntity;
    stepIndex: number;
    toolName: string;
    toolInput: Record<string, unknown> | null;
    toolOutput: Record<string, unknown> | null;
    status: string;
    startedAt: Date | null;
    finishedAt: Date | null;
    createdAt: Date;
}
export declare class ExecutionLogEntity {
    id: string;
    executionId: string;
    execution: ExecutionEntity;
    correlationId: string;
    source: ExecutionLogSource;
    level: string;
    message: string;
    payload: Record<string, unknown> | null;
    createdAt: Date;
}
export declare class ArtifactEntity {
    id: string;
    executionId: string;
    execution: ExecutionEntity;
    kind: string;
    uri: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}
export declare const observabilityEntities: readonly [typeof AgentEntity, typeof ExecutionEntity, typeof ExecutionStepEntity, typeof ExecutionLogEntity, typeof ArtifactEntity];
