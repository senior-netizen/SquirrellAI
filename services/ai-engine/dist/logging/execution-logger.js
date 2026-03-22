"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionLogger = void 0;
const observability_1 = require("@squirrell/observability");
class ExecutionLogger {
    logRepository;
    constructor(logRepository) {
        this.logRepository = logRepository;
    }
    async info(executionId, message, payload) {
        await this.write(executionId, 'info', message, payload);
    }
    async error(executionId, message, error) {
        await this.write(executionId, 'error', message, error ? { error: (0, observability_1.sanitizeError)(error) } : undefined);
    }
    async sandbox(executionId, message, payload) {
        await this.write(executionId, 'info', message, payload, observability_1.ExecutionLogSource.Sandbox);
    }
    async write(executionId, level, message, payload, source = observability_1.ExecutionLogSource.AiEngine) {
        await this.logRepository.save(this.logRepository.create({
            executionId,
            correlationId: (0, observability_1.getCorrelationId)() ?? '00000000-0000-0000-0000-000000000000',
            source,
            level,
            message: String((0, observability_1.redactValue)(message)),
            payload: payload ? (0, observability_1.redactValue)(payload) : null
        }));
    }
}
exports.ExecutionLogger = ExecutionLogger;
//# sourceMappingURL=execution-logger.js.map