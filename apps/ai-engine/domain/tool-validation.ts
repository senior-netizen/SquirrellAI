import type {
  JsonObject,
  JsonValue,
  ToolName,
  ValidationIssue,
  ValidationResult,
} from './tool-contracts.ts';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) {
    return true;
  }

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isObject(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
};

export const asValidationFailure = (...issues: ValidationIssue[]): ValidationResult => ({
  ok: false,
  issues,
});

export const asValidationSuccess = (): ValidationResult => ({ ok: true });

const issue = (path: string, message: string): ValidationIssue => ({ path, message });

const validateCommand = (path: string, value: unknown): ValidationIssue[] => {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
    return [issue(path, 'Expected a non-empty string array command.')];
  }

  return [];
};

const collectIssues = (name: ToolName, input: unknown): ValidationIssue[] => {
  if (!isObject(input)) {
    return [issue(name, 'Expected object input.')];
  }

  switch (name) {
    case 'generate_openapi_spec': {
      const endpoints = input.endpoints;
      const issues: ValidationIssue[] = [];

      if (!isNonEmptyString(input.productBrief)) {
        issues.push(issue('productBrief', 'Product brief is required.'));
      }
      if (!isNonEmptyString(input.boundedContext)) {
        issues.push(issue('boundedContext', 'Bounded context is required.'));
      }
      if (!Array.isArray(endpoints) || endpoints.length === 0) {
        issues.push(issue('endpoints', 'At least one endpoint definition is required.'));
      } else {
        endpoints.forEach((endpoint, index) => {
          if (!isObject(endpoint)) {
            issues.push(issue(`endpoints[${index}]`, 'Endpoint must be an object.'));
            return;
          }

          if (!isNonEmptyString(endpoint.path) || !String(endpoint.path).startsWith('/')) {
            issues.push(issue(`endpoints[${index}].path`, 'Endpoint path must begin with /.'));
          }
          if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(String(endpoint.method))) {
            issues.push(issue(`endpoints[${index}].method`, 'Unsupported HTTP method.'));
          }
          if (!isNonEmptyString(endpoint.summary)) {
            issues.push(issue(`endpoints[${index}].summary`, 'Endpoint summary is required.'));
          }
        });
      }

      return issues;
    }
    case 'generate_nestjs_code': {
      const issues: ValidationIssue[] = [];
      if (!isNonEmptyString(input.specArtifactId)) {
        issues.push(issue('specArtifactId', 'A valid spec artifact id is required.'));
      }
      if (!isNonEmptyString(input.moduleName)) {
        issues.push(issue('moduleName', 'Module name is required.'));
      }
      if (!isNonEmptyString(input.outputDirectory)) {
        issues.push(issue('outputDirectory', 'Output directory is required.'));
      }
      return issues;
    }
    case 'write_project_files': {
      const issues: ValidationIssue[] = [];
      if (!isNonEmptyString(input.projectRoot)) {
        issues.push(issue('projectRoot', 'Project root is required.'));
      }
      if (!Array.isArray(input.files) || input.files.length === 0) {
        issues.push(issue('files', 'At least one file is required.'));
      } else {
        input.files.forEach((file, index) => {
          if (!isObject(file)) {
            issues.push(issue(`files[${index}]`, 'File entry must be an object.'));
            return;
          }
          if (!isNonEmptyString(file.path)) {
            issues.push(issue(`files[${index}].path`, 'File path is required.'));
          }
          if (typeof file.content !== 'string') {
            issues.push(issue(`files[${index}].content`, 'File content must be a string.'));
          }
          if (file.encoding !== 'utf8') {
            issues.push(issue(`files[${index}].encoding`, 'Only utf8 encoding is supported.'));
          }
        });
      }
      return issues;
    }
    case 'install_dependencies': {
      const issues: ValidationIssue[] = [];
      if (!isNonEmptyString(input.projectRoot)) {
        issues.push(issue('projectRoot', 'Project root is required.'));
      }
      if (!['npm', 'pnpm', 'yarn'].includes(String(input.packageManager))) {
        issues.push(issue('packageManager', 'Unsupported package manager.'));
      }
      if (!isStringArray(input.dependencies)) {
        issues.push(issue('dependencies', 'Dependencies must be a string array.'));
      }
      if (!isStringArray(input.devDependencies)) {
        issues.push(issue('devDependencies', 'Dev dependencies must be a string array.'));
      }
      return issues;
    }
    case 'run_tests': {
      const issues: ValidationIssue[] = [];
      if (!isNonEmptyString(input.projectRoot)) {
        issues.push(issue('projectRoot', 'Project root is required.'));
      }
      issues.push(...validateCommand('command', input.command));
      if (typeof input.coverage !== 'boolean') {
        issues.push(issue('coverage', 'Coverage flag must be boolean.'));
      }
      return issues;
    }
    case 'start_service': {
      const issues: ValidationIssue[] = [];
      if (!isNonEmptyString(input.projectRoot)) {
        issues.push(issue('projectRoot', 'Project root is required.'));
      }
      issues.push(...validateCommand('command', input.command));
      if (typeof input.port !== 'number' || !Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
        issues.push(issue('port', 'Port must be an integer between 1 and 65535.'));
      }
      return issues;
    }
    case 'read_logs': {
      const issues: ValidationIssue[] = [];
      if (!['service', 'test_run'].includes(String(input.source))) {
        issues.push(issue('source', 'Unsupported log source.'));
      }
      if (typeof input.limit !== 'number' || !Number.isInteger(input.limit) || input.limit < 1 || input.limit > 500) {
        issues.push(issue('limit', 'Limit must be an integer between 1 and 500.'));
      }
      if (input.cursor !== undefined && !isNonEmptyString(input.cursor)) {
        issues.push(issue('cursor', 'Cursor must be a non-empty string when provided.'));
      }
      return issues;
    }
    default:
      return [issue(name, 'Unsupported tool name.')];
  }
};

export const validateInputForTool = <T extends JsonObject>(name: ToolName, input: unknown) => {
  const issues = collectIssues(name, input);

  if (issues.length > 0) {
    return {
      ok: false as const,
      issues,
    };
  }

  return {
    ok: true as const,
    value: input as T,
  };
};

export const validateOutputObject = <T extends JsonObject>(output: unknown) => {
  if (!isObject(output) || !isJsonValue(output)) {
    return {
      ok: false as const,
      issues: [issue('output', 'Tool output must be a JSON object.')],
    };
  }

  return {
    ok: true as const,
    value: output as T,
  };
};
