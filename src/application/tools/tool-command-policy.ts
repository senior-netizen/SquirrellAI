import { SandboxCommandId } from '../sandbox/sandbox.types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export type ToolAction = 'installDependencies' | 'runTests' | 'startService' | 'readLog' | 'writeFile';

export interface AllowedToolCommand {
  commandId: SandboxCommandId;
  argv: string[];
  env?: Record<string, string>;
}

export class ToolCommandPolicy {
  private readonly staticCommands: Record<Exclude<ToolAction, 'readLog' | 'writeFile'>, AllowedToolCommand> = {
    installDependencies: {
      commandId: 'install-dependencies',
      argv: ['npm', 'ci', '--ignore-scripts=false'],
    },
    runTests: {
      commandId: 'run-tests',
      argv: ['npm', 'test', '--', '--runInBand'],
    },
    startService: {
      commandId: 'start-service',
      argv: ['npm', 'run', 'start'],
    },
  };

  resolve(action: 'installDependencies' | 'runTests' | 'startService'): AllowedToolCommand;
  resolve(action: 'readLog', options: { relativePath: string }): AllowedToolCommand;
  resolve(action: 'writeFile', options: { relativePath: string; contents: string; mode?: number }): AllowedToolCommand;
  resolve(action: ToolAction, options?: { relativePath?: string; contents?: string; mode?: number }): AllowedToolCommand {
    if (action in this.staticCommands) {
      return this.staticCommands[action as keyof typeof this.staticCommands];
    }

    if (!options?.relativePath) {
      throw new ValidationError(`A relativePath is required for ${action}`);
    }

    this.assertSafeRelativePath(options.relativePath);

    if (action === 'readLog') {
      return {
        commandId: 'read-log',
        argv: ['node', '/opt/runner/bin/read-log.mjs'],
        env: {
          LOG_FILE_RELATIVE_PATH: options.relativePath,
        },
      };
    }

    if (action === 'writeFile') {
      if (options.contents === undefined) {
        throw new ValidationError('File contents are required for writeFile');
      }

      return {
        commandId: 'write-file',
        argv: ['node', '/opt/runner/bin/write-file.mjs'],
        env: {
          TARGET_FILE_RELATIVE_PATH: options.relativePath,
          TARGET_FILE_CONTENTS_BASE64: Buffer.from(options.contents, 'utf8').toString('base64'),
          ...(options.mode ? { TARGET_FILE_MODE: options.mode.toString(8) } : {}),
        },
      };
    }

    throw new ValidationError(`Unsupported tool action: ${action}`);
  }

  private assertSafeRelativePath(relativePath: string): void {
    if (relativePath.startsWith('/') || relativePath.includes('..')) {
      throw new ValidationError('Path must remain inside the mounted project workspace');
    }
  }
}
