export interface ContainerCreateOptions {
  Image: string;
  Cmd: string[];
  Env?: string[];
  WorkingDir: string;
  AttachStdout: boolean;
  AttachStderr: boolean;
  Tty: boolean;
  HostConfig: {
    AutoRemove: boolean;
    Binds: string[];
    Memory: number;
    NanoCpus: number;
    NetworkMode: 'bridge' | 'none';
    Privileged: boolean;
    ReadonlyRootfs: boolean;
    CapDrop: string[];
    SecurityOpt: string[];
    PidsLimit: number;
    Tmpfs: Record<string, string>;
  };
  Labels: Record<string, string>;
  User: string;
}

export interface ContainerInspectInfo {
  Id: string;
  Image: string;
}

export interface ContainerWaitResult {
  StatusCode: number | null;
}

export interface ContainerInstance {
  id: string;
  start(): Promise<void>;
  wait(): Promise<ContainerWaitResult>;
  inspect(): Promise<ContainerInspectInfo>;
  logs(options: {
    stdout: boolean;
    stderr: boolean;
    follow: boolean;
    timestamps: boolean;
  }): Promise<Buffer | NodeJS.ReadableStream>;
  kill(): Promise<void>;
  remove(options: { force: boolean }): Promise<void>;
}

export interface DockerClient {
  createContainer(options: ContainerCreateOptions): Promise<ContainerInstance>;
  getContainer(containerId: string): ContainerInstance;
}
