import type { JsonObject, ToolInputByName, ToolOutputByName, ToolName } from '../domain/tool-contracts.ts';
import type {
  AgentExecutionContext,
  AgentIntent,
  AgentState,
  ToolExecutionErrorClassification,
  ToolExecutionStepRecord,
} from '../domain/tool-execution.ts';
import { OpenApiSpecValidator } from '../domain/openapi-spec-validator.ts';
import { MalformedToolCallError, ToolRegistry, UnknownToolError } from '../infrastructure/tools/ToolRegistry.ts';
import type { ExecutionStepStore } from '../infrastructure/persistence/ExecutionStepStore.ts';

export type ExecuteAgentRequest = {
  executionId: string;
  input: AgentIntent | string;
};

export type AgentStepResult = {
  state: AgentState;
  invokedTool?: ToolName;
  record: ToolExecutionStepRecord;
  artifacts: AgentExecutionContext['artifacts'];
  context: AgentExecutionContext;
};

const now = () => new Date().toISOString();

export class AgentExecutionService {
  private readonly toolRegistry: ToolRegistry;
  private readonly executionStepStore: ExecutionStepStore;
  private readonly openApiSpecValidator: OpenApiSpecValidator;

  constructor(
    toolRegistry: ToolRegistry,
    executionStepStore: ExecutionStepStore,
    openApiSpecValidator = new OpenApiSpecValidator(),
  ) {
    this.toolRegistry = toolRegistry;
    this.executionStepStore = executionStepStore;
    this.openApiSpecValidator = openApiSpecValidator;
  }

  async executeNext(request: ExecuteAgentRequest, previous?: AgentExecutionContext): Promise<AgentStepResult> {
    const context = previous ?? this.initializeContext(request);
    const plan = this.planNextAllowedAction(context);

    const startedAt = Date.now();
    let record: ToolExecutionStepRecord = {
      executionId: context.executionId,
      sequence: context.sequence + 1,
      toolName: plan.toolName,
      sanitizedInput: plan.sanitizedInput,
      durationMs: 0,
      errorClassification: 'none',
      timestamp: now(),
    };

    try {
      const result = await this.invokePlannedTool(plan.toolName, plan.input);

      if (plan.toolName === 'generate_openapi_spec') {
        const openApiOutput = result.output as ToolOutputByName['generate_openapi_spec'];
        const openApiResult = this.openApiSpecValidator.validate(openApiOutput.spec);
        if (!openApiResult.ok) {
          record = {
            ...record,
            sanitizedOutput: {
              warnings: openApiOutput.warnings,
              openApiValidationErrors: openApiResult.errors,
            },
            durationMs: Date.now() - startedAt,
            errorClassification: 'openapi_validation_error',
          };
          await this.executionStepStore.persist(record);
          return {
            state: 'blocked',
            record,
            artifacts: context.artifacts,
            context: { ...context, state: 'blocked', sequence: context.sequence + 1 },
          };
        }
      }

      const nextContext = this.transitionContext(context, plan.toolName, result.output);

      record = {
        ...record,
        sanitizedInput: result.sanitizedInput as JsonObject,
        sanitizedOutput: result.sanitizedOutput as JsonObject,
        durationMs: Date.now() - startedAt,
      };

      await this.executionStepStore.persist(record);

      return {
        state: nextContext.state,
        invokedTool: plan.toolName,
        record,
        artifacts: nextContext.artifacts,
        context: nextContext,
      };
    } catch (error) {
      record = {
        ...record,
        durationMs: Date.now() - startedAt,
        errorClassification: this.classifyError(error),
        sanitizedOutput: {
          message: error instanceof Error ? error.message : 'Unknown execution error',
        },
      };

      await this.executionStepStore.persist(record);

      return {
        state: 'blocked',
        invokedTool: plan.toolName,
        record,
        artifacts: context.artifacts,
        context: { ...context, state: 'blocked', sequence: context.sequence + 1 },
      };
    }
  }

  initializeContext(request: ExecuteAgentRequest): AgentExecutionContext {
    return {
      executionId: request.executionId,
      state: 'awaiting_openapi_spec',
      sequence: 0,
      intent: this.normalizeIntent(request.input),
      artifacts: {},
    };
  }

  normalizeIntent(input: AgentIntent | string): AgentIntent {
    if (typeof input !== 'string') {
      return input;
    }

    const parsed = JSON.parse(input) as Partial<AgentIntent>;

    return {
      goal: parsed.goal ?? 'Generate service from structured plan',
      boundedContext: parsed.boundedContext ?? 'default',
      endpoints: parsed.endpoints ?? [],
      outputDirectory: parsed.outputDirectory ?? 'apps/generated-service/src',
      projectRoot: parsed.projectRoot ?? 'apps/generated-service',
      packageManager: parsed.packageManager ?? 'npm',
      testCommand: parsed.testCommand ?? ['npm', 'test'],
      serviceCommand: parsed.serviceCommand ?? ['npm', 'run', 'start'],
      servicePort: parsed.servicePort ?? 3000,
    };
  }

  planNextAllowedAction(context: AgentExecutionContext): {
    toolName: ToolName;
    input: ToolInputByName[ToolName];
    sanitizedInput: JsonObject;
  } {
    switch (context.state) {
      case 'awaiting_openapi_spec': {
        const input: ToolInputByName['generate_openapi_spec'] = {
          productBrief: context.intent.goal,
          boundedContext: context.intent.boundedContext,
          endpoints: context.intent.endpoints,
        };
        return this.toPlannedAction('generate_openapi_spec', input);
      }
      case 'awaiting_code_generation': {
        if (!context.artifacts.openApiSpecArtifactId) {
          throw new Error('Missing validated OpenAPI artifact id.');
        }
        const input: ToolInputByName['generate_nestjs_code'] = {
          specArtifactId: context.artifacts.openApiSpecArtifactId,
          moduleName: context.intent.boundedContext,
          outputDirectory: context.intent.outputDirectory,
        };
        return this.toPlannedAction('generate_nestjs_code', input);
      }
      case 'awaiting_file_write': {
        const generatedFiles = this.requireStringArrayArtifact(context.artifacts.generatedFiles, 'generatedFiles');
        const generatedContents = this.requireObjectArtifact(context.artifacts.generatedFileContents, 'generatedFileContents');
        const input: ToolInputByName['write_project_files'] = {
          projectRoot: context.intent.projectRoot,
          files: generatedFiles.map((path) => ({
            path,
            content: String(generatedContents[path]),
            encoding: 'utf8',
          })),
        };
        return this.toPlannedAction('write_project_files', input);
      }
      case 'awaiting_dependency_install': {
        const input: ToolInputByName['install_dependencies'] = {
          projectRoot: context.intent.projectRoot,
          packageManager: context.intent.packageManager,
          dependencies: ['@nestjs/common', '@nestjs/core'],
          devDependencies: ['@nestjs/testing'],
        };
        return this.toPlannedAction('install_dependencies', input);
      }
      case 'awaiting_test_run': {
        const input: ToolInputByName['run_tests'] = {
          projectRoot: context.intent.projectRoot,
          command: context.intent.testCommand,
          coverage: true,
        };
        return this.toPlannedAction('run_tests', input);
      }
      case 'awaiting_service_start': {
        const input: ToolInputByName['start_service'] = {
          projectRoot: context.intent.projectRoot,
          command: context.intent.serviceCommand,
          port: context.intent.servicePort,
        };
        return this.toPlannedAction('start_service', input);
      }
      case 'awaiting_log_read': {
        const input: ToolInputByName['read_logs'] = {
          source: 'service',
          limit: 50,
        };
        return this.toPlannedAction('read_logs', input);
      }
      case 'completed':
      case 'blocked':
        throw new Error(`Execution is terminal in state ${context.state}.`);
    }
  }

  private async invokePlannedTool<TName extends ToolName>(toolName: TName, input: ToolInputByName[TName]) {
    return this.toolRegistry.invoke<TName>({ name: toolName, input });
  }

  private toPlannedAction<TName extends ToolName>(toolName: TName, input: ToolInputByName[TName]) {
    const contract = this.toolRegistry.getContract(toolName);
    return {
      toolName,
      input,
      sanitizedInput: contract.sanitizeInput(input),
    };
  }

  private transitionContext<TName extends ToolName>(
    context: AgentExecutionContext,
    toolName: TName,
    output: ToolOutputByName[TName],
  ): AgentExecutionContext {
    switch (toolName) {
      case 'generate_openapi_spec': {
        const generatedSpec = output as ToolOutputByName['generate_openapi_spec'];
        return {
          ...context,
          sequence: context.sequence + 1,
          state: 'awaiting_code_generation',
          artifacts: {
            ...context.artifacts,
            openApiSpecArtifactId: generatedSpec.artifactId,
            openApiSpec: generatedSpec.spec,
          },
        };
      }
      case 'generate_nestjs_code': {
        const generatedCode = output as ToolOutputByName['generate_nestjs_code'];
        return {
          ...context,
          sequence: context.sequence + 1,
          state: 'awaiting_file_write',
          artifacts: {
            ...context.artifacts,
            nestCodeArtifactId: generatedCode.artifactId,
            generatedFiles: generatedCode.files.map((file) => file.path),
            generatedFileContents: Object.fromEntries(generatedCode.files.map((file) => [file.path, file.content])),
          },
        };
      }
      case 'write_project_files':
        return { ...context, sequence: context.sequence + 1, state: 'awaiting_dependency_install' };
      case 'install_dependencies':
        return { ...context, sequence: context.sequence + 1, state: 'awaiting_test_run' };
      case 'run_tests': {
        const testResult = output as ToolOutputByName['run_tests'];
        return {
          ...context,
          sequence: context.sequence + 1,
          state: testResult.success ? 'awaiting_service_start' : 'awaiting_log_read',
        };
      }
      case 'start_service':
        return { ...context, sequence: context.sequence + 1, state: 'awaiting_log_read' };
      case 'read_logs':
        return { ...context, sequence: context.sequence + 1, state: 'completed' };
    }
  }

  private requireStringArrayArtifact(value: unknown, name: string): string[] {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
      throw new Error(`Artifact ${name} is missing or malformed.`);
    }
    return value;
  }

  private requireObjectArtifact(value: unknown, name: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`Artifact ${name} is missing or malformed.`);
    }
    return value as Record<string, unknown>;
  }

  private classifyError(error: unknown): ToolExecutionErrorClassification {
    if (error instanceof UnknownToolError) {
      return 'unknown_tool';
    }
    if (error instanceof MalformedToolCallError) {
      return 'validation_error';
    }
    if (error instanceof Error && /terminal|Missing validated OpenAPI artifact/.test(error.message)) {
      return 'policy_violation';
    }
    return 'handler_error';
  }
}
