import openApi30Schema from './openapi/openapi-3.0.schema.json' with { type: 'json' };
import type { JsonObject } from './tool-contracts.ts';

export type OpenApiValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const OPENAPI_30_PATTERN = new RegExp(String(openApi30Schema.properties.openapi.pattern));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class OpenApiSpecValidator {
  validate(spec: JsonObject): OpenApiValidationResult {
    const errors: string[] = [];

    if (!isObject(spec)) {
      return { ok: false, errors: ['Spec must be a JSON object.'] };
    }

    if (typeof spec.openapi !== 'string' || !OPENAPI_30_PATTERN.test(spec.openapi)) {
      errors.push('/openapi must match OpenAPI 3.0.x');
    }

    if (!isObject(spec.info)) {
      errors.push('/info must be an object');
    } else {
      if (typeof spec.info.title !== 'string' || spec.info.title.trim().length === 0) {
        errors.push('/info/title is required');
      }
      if (typeof spec.info.version !== 'string' || spec.info.version.trim().length === 0) {
        errors.push('/info/version is required');
      }
    }

    if (!isObject(spec.paths)) {
      errors.push('/paths must be an object');
    } else {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (!path.startsWith('/')) {
          errors.push(`/paths/${path} must start with /`);
          continue;
        }

        if (!isObject(pathItem)) {
          errors.push(`/paths/${path} must be an object`);
          continue;
        }

        const operations = HTTP_METHODS.filter((method) => isObject(pathItem[method]));
        if (operations.length === 0) {
          errors.push(`/paths/${path} must define at least one HTTP operation`);
          continue;
        }

        for (const method of operations) {
          const operation = pathItem[method];
          if (!isObject(operation)) {
            continue;
          }

          if (!isObject(operation.responses) || Object.keys(operation.responses).length === 0) {
            errors.push(`/paths/${path}/${method}/responses must define at least one response`);
            continue;
          }

          for (const [statusCode, response] of Object.entries(operation.responses)) {
            if (!/^[1-5][0-9]{2}$|^default$/.test(statusCode)) {
              errors.push(`/paths/${path}/${method}/responses/${statusCode} is not a valid response key`);
              continue;
            }
            if (!isObject(response) || typeof response.description !== 'string') {
              errors.push(`/paths/${path}/${method}/responses/${statusCode}/description is required`);
            }
          }
        }
      }
    }

    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  }
}
