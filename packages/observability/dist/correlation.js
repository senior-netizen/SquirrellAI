"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORRELATION_HEADER = void 0;
exports.withCorrelationContext = withCorrelationContext;
exports.getCorrelationId = getCorrelationId;
exports.ensureCorrelationId = ensureCorrelationId;
const node_async_hooks_1 = require("node:async_hooks");
const node_crypto_1 = require("node:crypto");
const correlationStore = new node_async_hooks_1.AsyncLocalStorage();
exports.CORRELATION_HEADER = 'x-correlation-id';
function withCorrelationContext(correlationId, callback) {
    return correlationStore.run({ correlationId }, callback);
}
function getCorrelationId() {
    return correlationStore.getStore()?.correlationId;
}
function ensureCorrelationId(candidate) {
    return candidate && candidate.length > 0 ? candidate : (0, node_crypto_1.randomUUID)();
}
//# sourceMappingURL=correlation.js.map