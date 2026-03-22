"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXECUTION_RETRY_QUEUE = exports.EXECUTION_DISPATCH_QUEUE = void 0;
exports.createQueueConfig = createQueueConfig;
exports.EXECUTION_DISPATCH_QUEUE = 'execution-dispatch';
exports.EXECUTION_RETRY_QUEUE = 'execution-retry';
function createQueueConfig(redisUrl) {
    const url = new URL(redisUrl);
    return {
        connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            username: url.username || undefined,
            password: url.password || undefined,
            db: url.pathname ? Number(url.pathname.replace('/', '') || '0') : 0,
            tls: url.protocol === 'rediss:' ? {} : undefined
        }
    };
}
//# sourceMappingURL=queue.js.map