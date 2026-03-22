import { SandboxExecutionRequest, SandboxExecutionResult, SandboxRuntime } from '../../application/sandbox/sandbox.types';
import { ContainerCreateOptions, ContainerInstance, DockerClient } from './docker-client';

export class DockerSandboxService implements SandboxRuntime {
  constructor(
    private readonly docker: DockerClient,
    private readonly imageName = 'squirrellai/nest-runner:latest',
  ) {}

  async execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    const startedAt = new Date();
    const container = await this.docker.createContainer(this.toCreateOptions(request));
    let timedOut = false;

    const timer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill();
      } catch {
        // Best effort teardown when the container already exited.
      }
    }, request.timeoutMs);

    try {
      await container.start();
      const [{ StatusCode: exitCode }, stdout, stderr, inspection] = await Promise.all([
        container.wait(),
        this.collectLogs(container, true),
        this.collectLogs(container, false),
        container.inspect(),
      ]);
      const stoppedAt = new Date();
      return {
        stdout,
        stderr,
        exitCode,
        timedOut,
        metadata: {
          containerId: inspection.Id,
          imageDigest: inspection.Image,
          startedAt,
          stoppedAt,
          exitCode,
        },
      };
    } finally {
      clearTimeout(timer);
      await this.forceRemove(container.id);
    }
  }

  private toCreateOptions(request: SandboxExecutionRequest): ContainerCreateOptions {
    return {
      Image: this.imageName,
      Cmd: request.argv,
      Env: Object.entries(request.env ?? {}).map(([key, value]) => `${key}=${value}`),
      WorkingDir: '/workspace/project',
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      HostConfig: {
        AutoRemove: false,
        Binds: [`${request.projectDirectory}:/workspace/project`],
        Memory: request.resourceLimits.memoryBytes,
        NanoCpus: request.resourceLimits.nanoCpus,
        NetworkMode: request.networkAccess ? 'bridge' : 'none',
        Privileged: false,
        ReadonlyRootfs: true,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        PidsLimit: 256,
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=64m',
        },
      },
      Labels: {
        'squirrellai.execution-id': request.executionId,
        'squirrellai.command-id': request.commandId,
      },
      User: 'sandbox',
    };
  }

  private async collectLogs(container: ContainerInstance, stdout: boolean): Promise<string> {
    const stream = await container.logs({
      stdout,
      stderr: !stdout,
      follow: false,
      timestamps: false,
    });

    if (Buffer.isBuffer(stream)) {
      return stream.toString('utf8');
    }

    const readableStream = stream as NodeJS.ReadableStream;
    return await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk: unknown) => chunks.push(Buffer.from(chunk as string)));
      readableStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      readableStream.on('error', reject);
    });
  }

  private async forceRemove(containerId: string): Promise<void> {
    try {
      await this.docker.getContainer(containerId).remove({ force: true });
    } catch {
      // Best effort cleanup; callers still receive execution metadata.
    }
  }
}
