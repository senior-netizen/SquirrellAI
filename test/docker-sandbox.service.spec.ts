import test from 'node:test';
import assert from 'node:assert/strict';
import { DockerSandboxService } from '../src/infrastructure/docker/docker-sandbox.service';
import { ContainerCreateOptions, ContainerInstance, DockerClient } from '../src/infrastructure/docker/docker-client';

class FakeContainer implements ContainerInstance {
  public id = 'container-abc';
  public killed = false;
  public removedWithForce = false;
  public started = false;

  constructor(private readonly waitDelayMs = 0, private readonly waitStatusCode: number | null = 0) {}

  async start(): Promise<void> {
    this.started = true;
  }

  async wait(): Promise<{ StatusCode: number | null }> {
    await new Promise((resolve) => setTimeout(resolve, this.waitDelayMs));
    return { StatusCode: this.waitStatusCode };
  }

  async inspect(): Promise<{ Id: string; Image: string }> {
    return { Id: this.id, Image: 'sha256:runner' };
  }

  async logs({ stdout }: { stdout: boolean }): Promise<Buffer> {
    return Buffer.from(stdout ? 'std-out' : 'std-err');
  }

  async kill(): Promise<void> {
    this.killed = true;
  }

  async remove({ force }: { force: boolean }): Promise<void> {
    this.removedWithForce = force;
  }
}

test('DockerSandboxService creates hardened containers with no host execution path', async () => {
  let createOptions: ContainerCreateOptions | undefined;
  const container = new FakeContainer();
  const docker: DockerClient = {
    createContainer: async (options) => {
      createOptions = options;
      return container;
    },
    getContainer: () => container,
  };

  const service = new DockerSandboxService(docker, 'squirrellai/nest-runner:latest');
  const result = await service.execute({
    executionId: 'execution-1',
    projectDirectory: '/tmp/project',
    commandId: 'run-tests',
    argv: ['npm', 'test'],
    timeoutMs: 5_000,
    resourceLimits: {
      memoryBytes: 256 * 1024 * 1024,
      nanoCpus: 500_000_000,
    },
    networkAccess: false,
  });

  assert.ok(createOptions);
  const hardenedOptions = createOptions as ContainerCreateOptions;
  assert.deepEqual(hardenedOptions.Cmd, ['npm', 'test']);
  assert.equal(hardenedOptions.WorkingDir, '/workspace/project');
  assert.deepEqual(hardenedOptions.HostConfig.Binds, ['/tmp/project:/workspace/project']);
  assert.equal(hardenedOptions.HostConfig.Privileged, false);
  assert.equal(hardenedOptions.HostConfig.NetworkMode, 'none');
  assert.equal(hardenedOptions.HostConfig.Memory, 256 * 1024 * 1024);
  assert.equal(hardenedOptions.HostConfig.NanoCpus, 500_000_000);
  assert.equal(hardenedOptions.HostConfig.ReadonlyRootfs, true);
  assert.equal(result.metadata.containerId, 'container-abc');
  assert.equal(result.metadata.imageDigest, 'sha256:runner');
  assert.equal(result.metadata.exitCode, 0);
  assert.equal(container.removedWithForce, true);
});

test('DockerSandboxService kills hung containers and marks the execution as timed out', async () => {
  const container = new FakeContainer(50, 137);
  const docker: DockerClient = {
    createContainer: async () => container,
    getContainer: () => container,
  };

  const service = new DockerSandboxService(docker, 'squirrellai/nest-runner:latest');
  const result = await service.execute({
    executionId: 'execution-2',
    projectDirectory: '/tmp/project',
    commandId: 'run-tests',
    argv: ['npm', 'test'],
    timeoutMs: 10,
    resourceLimits: {
      memoryBytes: 256 * 1024 * 1024,
      nanoCpus: 500_000_000,
    },
    networkAccess: false,
  });

  assert.equal(container.killed, true);
  assert.equal(result.timedOut, true);
});
