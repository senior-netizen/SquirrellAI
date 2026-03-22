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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("bullmq");
const observability_1 = require("@squirrell/observability");
const typeorm_2 = require("typeorm");
const queue_providers_1 = require("../common/queue.providers");
const execution_response_dto_1 = require("./dto/execution-response.dto");
let ExecutionsService = class ExecutionsService {
    agentRepository;
    executionRepository;
    executionStepRepository;
    executionLogRepository;
    artifactRepository;
    dispatchQueue;
    constructor(agentRepository, executionRepository, executionStepRepository, executionLogRepository, artifactRepository, dispatchQueue) {
        this.agentRepository = agentRepository;
        this.executionRepository = executionRepository;
        this.executionStepRepository = executionStepRepository;
        this.executionLogRepository = executionLogRepository;
        this.artifactRepository = artifactRepository;
        this.dispatchQueue = dispatchQueue;
    }
    async createExecution(agentId, dto, request) {
        const agent = await this.agentRepository.findOne({ where: { id: agentId } });
        if (!agent) {
            throw new common_1.NotFoundException(`Agent ${agentId} was not found`);
        }
        const execution = await this.executionRepository.save(this.executionRepository.create({
            agentId,
            correlationId: request.correlationId,
            inputPrompt: dto.prompt,
            runtimeEndpoint: agent.runtimeEndpoint,
            status: observability_1.ExecutionStatus.Queued,
            parsedIntent: null,
            generatedSpecReference: null,
            testResults: []
        }));
        await this.executionLogRepository.save(this.executionLogRepository.create({
            executionId: execution.id,
            correlationId: execution.correlationId,
            source: observability_1.ExecutionLogSource.ApiGateway,
            level: 'info',
            message: 'Execution accepted by API gateway',
            payload: (0, observability_1.redactValue)({ context: dto.context ?? null })
        }));
        await this.dispatchQueue.add(execution.id, {
            executionId: execution.id,
            agentId,
            correlationId: execution.correlationId,
            requestedAt: execution.requestedAt.toISOString(),
            prompt: dto.prompt
        }, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 1_000
            },
            removeOnComplete: 500,
            removeOnFail: 1_000,
            jobId: execution.id
        });
        return this.getExecution(execution.id);
    }
    async listExecutionsForAgent(agentId) {
        const executions = await this.executionRepository.find({
            where: { agentId },
            relations: { steps: true, logs: true, artifacts: true },
            order: { requestedAt: 'DESC' }
        });
        return executions.map((execution) => (0, execution_response_dto_1.toExecutionResponse)(execution));
    }
    async getExecution(executionId) {
        const execution = await this.executionRepository.findOne({
            where: { id: executionId },
            relations: { steps: true, logs: true, artifacts: true }
        });
        if (!execution) {
            throw new common_1.NotFoundException(`Execution ${executionId} was not found`);
        }
        return (0, execution_response_dto_1.toExecutionResponse)(execution);
    }
};
exports.ExecutionsService = ExecutionsService;
exports.ExecutionsService = ExecutionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(observability_1.AgentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(observability_1.ExecutionEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(observability_1.ExecutionStepEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(observability_1.ExecutionLogEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(observability_1.ArtifactEntity)),
    __param(5, (0, common_1.Inject)(queue_providers_1.EXECUTION_DISPATCH_QUEUE_TOKEN)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        bullmq_1.Queue])
], ExecutionsService);
//# sourceMappingURL=executions.service.js.map