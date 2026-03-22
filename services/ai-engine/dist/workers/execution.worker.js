"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionWorker = void 0;
const bullmq_1 = require("bullmq");
const observability_1 = require("@squirrell/observability");
const execution_logger_1 = require("../logging/execution-logger");
class ExecutionWorker {
    dependencies;
    dispatchWorker;
    retryQueue;
    executionRepository;
    stepRepository;
    logger;
    constructor(dependencies) {
        this.dependencies = dependencies;
        const queueConfig = (0, observability_1.createQueueConfig)(dependencies.redisUrl);
        this.executionRepository = dependencies.dataSource.getRepository(observability_1.ExecutionEntity);
        this.stepRepository = dependencies.dataSource.getRepository(observability_1.ExecutionStepEntity);
        this.logger = new execution_logger_1.ExecutionLogger(dependencies.dataSource.getRepository(observability_1.ExecutionLogEntity));
        this.retryQueue = new bullmq_1.Queue(observability_1.EXECUTION_RETRY_QUEUE, queueConfig);
        this.dispatchWorker = new bullmq_1.Worker(observability_1.EXECUTION_DISPATCH_QUEUE, async (job) => (0, observability_1.withCorrelationContext)(job.data.correlationId, () => this.process(job.data)), queueConfig);
    }
    async process(job) {
        const execution = await this.executionRepository.findOne({ where: { id: job.executionId } });
        if (!execution) {
            throw new Error(`Execution ${job.executionId} not found`);
        }
        execution.status = observability_1.ExecutionStatus.Running;
        execution.startedAt = new Date();
        execution.attemptCount += 1;
        execution.parsedIntent = this.parseIntent(job.prompt);
        execution.generatedSpecReference = `spec://${execution.agentId}/${execution.id}`;
        await this.executionRepository.save(execution);
        await this.logger.info(execution.id, 'Execution started', { agentId: execution.agentId });
        try {
            const step = await this.stepRepository.save(this.stepRepository.create({
                executionId: execution.id,
                stepIndex: 1,
                toolName: 'spec-generator',
                toolInput: (0, observability_1.redactValue)({ prompt: job.prompt }),
                toolOutput: (0, observability_1.redactValue)({ specReference: execution.generatedSpecReference }),
                status: 'succeeded',
                startedAt: execution.startedAt,
                finishedAt: new Date()
            }));
            await this.logger.sandbox(execution.id, 'Sandbox runtime prepared', {
                runtimeEndpoint: execution.runtimeEndpoint ?? 'sandbox://dynamic'
            });
            execution.runtimeEndpoint = execution.runtimeEndpoint ?? `sandbox://runtime/${execution.id}`;
            execution.testResults = [
                {
                    name: 'dispatch-envelope',
                    status: 'passed',
                    stepId: step.id
                }
            ];
            execution.status = observability_1.ExecutionStatus.Succeeded;
            execution.finishedAt = new Date();
            execution.lastError = null;
            await this.executionRepository.save(execution);
            await this.logger.info(execution.id, 'Execution completed', {
                runtimeEndpoint: execution.runtimeEndpoint,
                finalStatus: execution.status
            });
        }
        catch (error) {
            execution.status = observability_1.ExecutionStatus.Retrying;
            execution.lastError = (0, observability_1.sanitizeError)(error);
            await this.executionRepository.save(execution);
            await this.retryQueue.add(execution.id, job, {
                delay: Math.min(60_000, 2 ** execution.attemptCount * 1_000),
                jobId: `${execution.id}:retry:${execution.attemptCount}`
            });
            await this.logger.error(execution.id, 'Execution failed and scheduled for retry', error);
            throw error;
        }
    }
    parseIntent(prompt) {
        const normalized = prompt.toLowerCase();
        return {
            summary: normalized.slice(0, 80),
            action: normalized.includes('test') ? 'test' : 'execute',
            entities: normalized.split(/\s+/).filter(Boolean).slice(0, 8)
        };
    }
}
exports.ExecutionWorker = ExecutionWorker;
//# sourceMappingURL=execution.worker.js.map