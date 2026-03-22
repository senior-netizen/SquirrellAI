import type {
  ToolContract,
  ToolInputByName,
  ToolName,
  ToolOutputByName,
} from '../../domain/tool-contracts.ts';
import { getToolContract, isKnownToolName } from '../../domain/tool-contract-definitions.ts';
import type { ToolInvocation } from '../../domain/tool-execution.ts';

export type ToolHandler<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>> = (
  input: TInput,
) => Promise<TOutput>;

export type ToolHandlerMap = {
  [K in ToolName]: ToolHandler<ToolInputByName[K], ToolOutputByName[K]>;
};

export type ToolInvocationResult<TName extends ToolName> = {
  contract: ToolContract<ToolInputByName[TName], ToolOutputByName[TName]>;
  sanitizedInput: Record<string, unknown>;
  sanitizedOutput: Record<string, unknown>;
  output: ToolOutputByName[TName];
};

export class UnknownToolError extends Error {
  constructor(toolName: string) {
    super(`Unknown tool: ${toolName}`);
    this.name = 'UnknownToolError';
  }
}

export class MalformedToolCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedToolCallError';
  }
}

export class ToolRegistry {
  private readonly handlers: Partial<ToolHandlerMap>;

  constructor(handlers: Partial<ToolHandlerMap>) {
    this.handlers = handlers;
  }

  getContract<TName extends ToolName>(name: TName): ToolContract<ToolInputByName[TName], ToolOutputByName[TName]> {
    return getToolContract(name) as unknown as ToolContract<ToolInputByName[TName], ToolOutputByName[TName]>;
  }

  async invoke<TName extends ToolName>(invocation: ToolInvocation<ToolInputByName[TName]>): Promise<ToolInvocationResult<TName>> {
    if (!isKnownToolName(invocation.name)) {
      throw new UnknownToolError(String(invocation.name));
    }

    const contract = this.getContract(invocation.name as TName);
    const validation = contract.validateInput(invocation.input);

    if (!validation.ok || !validation.value) {
      throw new MalformedToolCallError(
        `Invalid input for ${invocation.name}: ${(validation as { issues: Array<{ path: string; message: string }> }).issues
          .map((entry: { path: string; message: string }) => `${entry.path} ${entry.message}`)
          .join('; ')}`,
      );
    }

    const handler = this.handlers[invocation.name] as ToolHandler<ToolInputByName[TName], ToolOutputByName[TName]> | undefined;

    if (!handler) {
      throw new UnknownToolError(`No handler registered for ${invocation.name}`);
    }

    const output = await handler(validation.value);
    const outputValidation = contract.validateOutput(output);

    if (!outputValidation.ok || !outputValidation.value) {
      throw new MalformedToolCallError(
        `Invalid output for ${invocation.name}: ${(outputValidation as { issues: Array<{ path: string; message: string }> }).issues
          .map((entry: { path: string; message: string }) => `${entry.path} ${entry.message}`)
          .join('; ')}`,
      );
    }

    return {
      contract,
      sanitizedInput: contract.sanitizeInput(validation.value),
      sanitizedOutput: contract.sanitizeOutput(outputValidation.value),
      output: outputValidation.value,
    };
  }
}
