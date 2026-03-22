import { SandboxExecutionService } from '../application/sandbox/sandbox-execution.service';
import { ToolCommandPolicy } from '../application/tools/tool-command-policy';
import { ExecutionRepository } from '../domain/execution/execution-repository';
import { DockerSandboxService } from '../infrastructure/docker/docker-sandbox.service';
import { DockerClient } from '../infrastructure/docker/docker-client';

export interface SandboxPlatformDependencies {
  dockerClient: DockerClient;
  executionRepository: ExecutionRepository;
  imageName?: string;
}

/**
 * Composition root for plugging the sandbox services into a NestJS module or any other DI container.
 */
export function createSandboxExecutionService(
  dependencies: SandboxPlatformDependencies,
): SandboxExecutionService {
  return new SandboxExecutionService(
    new DockerSandboxService(dependencies.dockerClient, dependencies.imageName),
    dependencies.executionRepository,
    new ToolCommandPolicy(),
  );
}
