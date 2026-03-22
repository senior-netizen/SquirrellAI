import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

export enum ExecutionStatus {
  Pending = 'pending',
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Retrying = 'retrying',
  Cancelled = 'cancelled'
}

export enum ExecutionLogSource {
  ApiGateway = 'api_gateway',
  AiEngine = 'ai_engine',
  Sandbox = 'sandbox'
}

@Entity({ name: 'agents' })
export class AgentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_agents_name', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  runtimeEndpoint!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ExecutionEntity, (execution) => execution.agent)
  executions!: ExecutionEntity[];
}

@Entity({ name: 'executions' })
export class ExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_executions_agent_id')
  @Column({ name: 'agent_id', type: 'uuid' })
  agentId!: string;

  @ManyToOne(() => AgentEntity, (agent) => agent.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent!: AgentEntity;

  @Index('idx_executions_correlation_id')
  @Column({ name: 'correlation_id', type: 'uuid' })
  correlationId!: string;

  @Column({ name: 'input_prompt', type: 'text' })
  inputPrompt!: string;

  @Column({ name: 'parsed_intent', type: 'jsonb', nullable: true })
  parsedIntent!: Record<string, unknown> | null;

  @Column({ name: 'generated_spec_reference', type: 'varchar', length: 255, nullable: true })
  generatedSpecReference!: string | null;

  @Column({ name: 'runtime_endpoint', type: 'varchar', length: 255, nullable: true })
  runtimeEndpoint!: string | null;

  @Column({ name: 'test_results', type: 'jsonb', default: () => "'[]'::jsonb" })
  testResults!: Array<Record<string, unknown>>;

  @Column({ name: 'status', type: 'varchar', length: 32, default: ExecutionStatus.Pending })
  status!: ExecutionStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt!: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ExecutionStepEntity, (step) => step.execution)
  steps!: ExecutionStepEntity[];

  @OneToMany(() => ExecutionLogEntity, (log) => log.execution)
  logs!: ExecutionLogEntity[];

  @OneToMany(() => ArtifactEntity, (artifact) => artifact.execution)
  artifacts!: ArtifactEntity[];
}

@Entity({ name: 'execution_steps' })
export class ExecutionStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_execution_steps_execution_id_order', ['executionId', 'stepIndex'], { unique: true })
  @Column({ name: 'execution_id', type: 'uuid' })
  executionId!: string;

  @ManyToOne(() => ExecutionEntity, (execution) => execution.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execution_id' })
  execution!: ExecutionEntity;

  @Column({ name: 'step_index', type: 'integer' })
  stepIndex!: number;

  @Column({ name: 'tool_name', type: 'varchar', length: 128 })
  toolName!: string;

  @Column({ name: 'tool_input', type: 'jsonb', nullable: true })
  toolInput!: Record<string, unknown> | null;

  @Column({ name: 'tool_output', type: 'jsonb', nullable: true })
  toolOutput!: Record<string, unknown> | null;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status!: string;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity({ name: 'execution_logs' })
export class ExecutionLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_execution_logs_execution_id_created_at', ['executionId', 'createdAt'])
  @Column({ name: 'execution_id', type: 'uuid' })
  executionId!: string;

  @ManyToOne(() => ExecutionEntity, (execution) => execution.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execution_id' })
  execution!: ExecutionEntity;

  @Column({ name: 'correlation_id', type: 'uuid' })
  correlationId!: string;

  @Column({ name: 'source', type: 'varchar', length: 32 })
  source!: ExecutionLogSource;

  @Column({ name: 'level', type: 'varchar', length: 16 })
  level!: string;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity({ name: 'artifacts' })
export class ArtifactEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_artifacts_execution_id')
  @Column({ name: 'execution_id', type: 'uuid' })
  executionId!: string;

  @ManyToOne(() => ExecutionEntity, (execution) => execution.artifacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execution_id' })
  execution!: ExecutionEntity;

  @Column({ name: 'kind', type: 'varchar', length: 64 })
  kind!: string;

  @Column({ name: 'uri', type: 'text' })
  uri!: string;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export const observabilityEntities = [
  AgentEntity,
  ExecutionEntity,
  ExecutionStepEntity,
  ExecutionLogEntity,
  ArtifactEntity
] as const;
