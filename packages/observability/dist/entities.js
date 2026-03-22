"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.observabilityEntities = exports.ArtifactEntity = exports.ExecutionLogEntity = exports.ExecutionStepEntity = exports.ExecutionEntity = exports.AgentEntity = exports.ExecutionLogSource = exports.ExecutionStatus = void 0;
const typeorm_1 = require("typeorm");
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["Pending"] = "pending";
    ExecutionStatus["Queued"] = "queued";
    ExecutionStatus["Running"] = "running";
    ExecutionStatus["Succeeded"] = "succeeded";
    ExecutionStatus["Failed"] = "failed";
    ExecutionStatus["Retrying"] = "retrying";
    ExecutionStatus["Cancelled"] = "cancelled";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
var ExecutionLogSource;
(function (ExecutionLogSource) {
    ExecutionLogSource["ApiGateway"] = "api_gateway";
    ExecutionLogSource["AiEngine"] = "ai_engine";
    ExecutionLogSource["Sandbox"] = "sandbox";
})(ExecutionLogSource || (exports.ExecutionLogSource = ExecutionLogSource = {}));
let AgentEntity = class AgentEntity {
    id;
    name;
    description;
    runtimeEndpoint;
    metadata;
    createdAt;
    updatedAt;
    executions;
};
exports.AgentEntity = AgentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AgentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_agents_name', { unique: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], AgentEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "runtimeEndpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], AgentEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AgentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AgentEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ExecutionEntity, (execution) => execution.agent),
    __metadata("design:type", Array)
], AgentEntity.prototype, "executions", void 0);
exports.AgentEntity = AgentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agents' })
], AgentEntity);
let ExecutionEntity = class ExecutionEntity {
    id;
    agentId;
    agent;
    correlationId;
    inputPrompt;
    parsedIntent;
    generatedSpecReference;
    runtimeEndpoint;
    testResults;
    status;
    attemptCount;
    lastError;
    requestedAt;
    startedAt;
    finishedAt;
    createdAt;
    updatedAt;
    steps;
    logs;
    artifacts;
};
exports.ExecutionEntity = ExecutionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExecutionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_executions_agent_id'),
    (0, typeorm_1.Column)({ name: 'agent_id', type: 'uuid' }),
    __metadata("design:type", String)
], ExecutionEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AgentEntity, (agent) => agent.executions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'agent_id' }),
    __metadata("design:type", AgentEntity)
], ExecutionEntity.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_executions_correlation_id'),
    (0, typeorm_1.Column)({ name: 'correlation_id', type: 'uuid' }),
    __metadata("design:type", String)
], ExecutionEntity.prototype, "correlationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'input_prompt', type: 'text' }),
    __metadata("design:type", String)
], ExecutionEntity.prototype, "inputPrompt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parsed_intent', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ExecutionEntity.prototype, "parsedIntent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'generated_spec_reference', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ExecutionEntity.prototype, "generatedSpecReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'runtime_endpoint', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ExecutionEntity.prototype, "runtimeEndpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_results', type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ExecutionEntity.prototype, "testResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 32, default: ExecutionStatus.Pending }),
    __metadata("design:type", String)
], ExecutionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ExecutionEntity.prototype, "attemptCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ExecutionEntity.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requested_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ExecutionEntity.prototype, "requestedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ExecutionEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'finished_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ExecutionEntity.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExecutionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ExecutionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ExecutionStepEntity, (step) => step.execution),
    __metadata("design:type", Array)
], ExecutionEntity.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ExecutionLogEntity, (log) => log.execution),
    __metadata("design:type", Array)
], ExecutionEntity.prototype, "logs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ArtifactEntity, (artifact) => artifact.execution),
    __metadata("design:type", Array)
], ExecutionEntity.prototype, "artifacts", void 0);
exports.ExecutionEntity = ExecutionEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'executions' })
], ExecutionEntity);
let ExecutionStepEntity = class ExecutionStepEntity {
    id;
    executionId;
    execution;
    stepIndex;
    toolName;
    toolInput;
    toolOutput;
    status;
    startedAt;
    finishedAt;
    createdAt;
};
exports.ExecutionStepEntity = ExecutionStepEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExecutionStepEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_execution_steps_execution_id_order', ['executionId', 'stepIndex'], { unique: true }),
    (0, typeorm_1.Column)({ name: 'execution_id', type: 'uuid' }),
    __metadata("design:type", String)
], ExecutionStepEntity.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ExecutionEntity, (execution) => execution.steps, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'execution_id' }),
    __metadata("design:type", ExecutionEntity)
], ExecutionStepEntity.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'step_index', type: 'integer' }),
    __metadata("design:type", Number)
], ExecutionStepEntity.prototype, "stepIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tool_name', type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], ExecutionStepEntity.prototype, "toolName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tool_input', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ExecutionStepEntity.prototype, "toolInput", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tool_output', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ExecutionStepEntity.prototype, "toolOutput", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ExecutionStepEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ExecutionStepEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'finished_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ExecutionStepEntity.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExecutionStepEntity.prototype, "createdAt", void 0);
exports.ExecutionStepEntity = ExecutionStepEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'execution_steps' })
], ExecutionStepEntity);
let ExecutionLogEntity = class ExecutionLogEntity {
    id;
    executionId;
    execution;
    correlationId;
    source;
    level;
    message;
    payload;
    createdAt;
};
exports.ExecutionLogEntity = ExecutionLogEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExecutionLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_execution_logs_execution_id_created_at', ['executionId', 'createdAt']),
    (0, typeorm_1.Column)({ name: 'execution_id', type: 'uuid' }),
    __metadata("design:type", String)
], ExecutionLogEntity.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ExecutionEntity, (execution) => execution.logs, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'execution_id' }),
    __metadata("design:type", ExecutionEntity)
], ExecutionLogEntity.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correlation_id', type: 'uuid' }),
    __metadata("design:type", String)
], ExecutionLogEntity.prototype, "correlationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ExecutionLogEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'level', type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ExecutionLogEntity.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'message', type: 'text' }),
    __metadata("design:type", String)
], ExecutionLogEntity.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payload', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ExecutionLogEntity.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExecutionLogEntity.prototype, "createdAt", void 0);
exports.ExecutionLogEntity = ExecutionLogEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'execution_logs' })
], ExecutionLogEntity);
let ArtifactEntity = class ArtifactEntity {
    id;
    executionId;
    execution;
    kind;
    uri;
    metadata;
    createdAt;
};
exports.ArtifactEntity = ArtifactEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ArtifactEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_artifacts_execution_id'),
    (0, typeorm_1.Column)({ name: 'execution_id', type: 'uuid' }),
    __metadata("design:type", String)
], ArtifactEntity.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ExecutionEntity, (execution) => execution.artifacts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'execution_id' }),
    __metadata("design:type", ExecutionEntity)
], ArtifactEntity.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kind', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ArtifactEntity.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uri', type: 'text' }),
    __metadata("design:type", String)
], ArtifactEntity.prototype, "uri", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], ArtifactEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ArtifactEntity.prototype, "createdAt", void 0);
exports.ArtifactEntity = ArtifactEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'artifacts' })
], ArtifactEntity);
exports.observabilityEntities = [
    AgentEntity,
    ExecutionEntity,
    ExecutionStepEntity,
    ExecutionLogEntity,
    ArtifactEntity
];
//# sourceMappingURL=entities.js.map