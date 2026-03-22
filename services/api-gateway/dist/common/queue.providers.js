"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueProviders = exports.EXECUTION_RETRY_QUEUE_TOKEN = exports.EXECUTION_DISPATCH_QUEUE_TOKEN = void 0;
const bullmq_1 = require("bullmq");
const observability_1 = require("@squirrell/observability");
exports.EXECUTION_DISPATCH_QUEUE_TOKEN = Symbol('EXECUTION_DISPATCH_QUEUE_TOKEN');
exports.EXECUTION_RETRY_QUEUE_TOKEN = Symbol('EXECUTION_RETRY_QUEUE_TOKEN');
function buildQueue(queueName) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379/0';
    return new bullmq_1.Queue(queueName, (0, observability_1.createQueueConfig)(redisUrl));
}
exports.queueProviders = [
    {
        provide: exports.EXECUTION_DISPATCH_QUEUE_TOKEN,
        useFactory: () => buildQueue(observability_1.EXECUTION_DISPATCH_QUEUE)
    },
    {
        provide: exports.EXECUTION_RETRY_QUEUE_TOKEN,
        useFactory: () => buildQueue(observability_1.EXECUTION_RETRY_QUEUE)
    }
];
//# sourceMappingURL=queue.providers.js.map