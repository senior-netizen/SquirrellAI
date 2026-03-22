"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactValue = redactValue;
exports.sanitizeError = sanitizeError;
const SENSITIVE_KEY_PATTERN = /(secret|token|password|authorization|cookie|api[-_]?key|credential|session)/i;
const SECRET_VALUE_PATTERN = /\b(?:sk|rk|pk)_[A-Za-z0-9]{8,}|Bearer\s+[A-Za-z0-9._-]+|-----BEGIN [A-Z ]+PRIVATE KEY-----|[A-Fa-f0-9]{32,}\b/g;
const MAX_STRING_LENGTH = 2048;
function redactValue(value) {
    if (typeof value === 'string') {
        const truncated = value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]` : value;
        return truncated.replaceAll(SECRET_VALUE_PATTERN, '[REDACTED]');
    }
    if (Array.isArray(value)) {
        return value.map((item) => redactValue(item));
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).reduce((accumulator, [key, currentValue]) => {
            accumulator[key] = SENSITIVE_KEY_PATTERN.test(key)
                ? '[REDACTED]'
                : redactValue(currentValue);
            return accumulator;
        }, {});
    }
    return value;
}
function sanitizeError(error) {
    if (error instanceof Error) {
        return String(redactValue(error.message));
    }
    return String(redactValue(String(error)));
}
//# sourceMappingURL=redaction.js.map