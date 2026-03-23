# ADR-0001: Explicit orchestration contracts across the API gateway, AI engine worker, and sandbox

- Status: Accepted
- Date: 2026-03-22

## 1. Problem analysis

The platform needs a clear separation of concerns before business logic is implemented. Without explicit orchestration contracts, the system risks coupling persistence concerns, queueing, agent reasoning, and runtime isolation into one implicit workflow. That would make the platform hard to audit, hard to retry deterministically, and unsafe to evolve.

The architecture has three independent responsibilities:

1. **API gateway** must remain the system of record for execution identity, durable state, lifecycle ownership, and auditability.
2. **AI engine worker** must act as a deterministic executor that transforms inputs into plans, tool calls, observations, and final outputs using explicit contracts.
3. **Sandbox/runtime boundary** must isolate runtime side effects so tools execute in a constrained environment with bounded capabilities.

This split is required to preserve deterministic orchestration, replayability, observability, and operational safety.

## 2. System design

We define orchestration as an explicit contract between three bounded contexts:

### 1. API gateway: system of record

The API gateway owns:

- execution identifiers
- request acceptance and idempotency
- durable execution state in Postgres
- transition validation
- append-only execution logs
- queue dispatch into Redis/BullMQ
- operator- and API-facing read models

The API gateway does **not** implement planning, reasoning, or tool execution policy. It persists what happened and governs whether a transition is legal.

### 2. AI engine worker: deterministic executor

The AI engine worker owns:

- prompt normalization
- intent parsing
- planning
- tool invocation requests
- observation analysis
- retry decisions
- final output assembly
- retry scheduling through Redis/BullMQ

The AI engine does **not** become the durable source of truth. It consumes and emits typed contracts. Given the same deterministic inputs, model configuration, and tool responses, it should produce equivalent state transition intents and outputs.

### 3. Sandbox/runtime boundary: isolated side effects

The sandbox owns:

- execution of side-effecting tools
- process isolation
- filesystem isolation
- network and capability boundaries
- capture of deterministic input/output artifacts when possible

The sandbox does **not** own orchestration state. It is an execution substrate invoked by the AI engine or supporting tool runtime.

## 3. Implementation

### State model

Executions move through the following lifecycle states:

- `queued`
- `running`
- `retrying`
- `succeeded`
- `failed`
- `cancelled`

Every state transition must record:

- prior state
- next state
- tool invoked
- deterministic input payload
- output payload hash or redacted payload
- timestamp
- correlation identifier

These fields are mandatory so the system can support replay, auditing, debugging, and policy enforcement.

### Data flow

1. A client submits a prompt to the API gateway.
2. The API gateway persists an execution in Postgres and emits a dispatch job to Redis.
3. The AI engine worker consumes the job and loads the execution state from Postgres.
4. The AI engine worker records parsing, planning, execution, and logging side effects back into Postgres.
5. The AI engine either completes the execution or schedules a bounded retry through Redis.
6. Operators and clients read execution state from the API gateway.

### Required infrastructure

- Postgres for durable execution state.
- Redis for BullMQ dispatch and retry queues.
- Optional sandbox/runtime infrastructure for side-effecting tools.

## 4. Edge cases

- If Redis is unavailable during request acceptance, the API gateway must fail fast rather than acknowledge an execution it cannot dispatch.
- If the AI engine crashes after updating state but before acknowledging a job, retry semantics must remain idempotent at the execution level.
- If sandbox execution produces sensitive data, log payloads must be redacted before persistence.
- If Postgres is unavailable, neither service can safely claim progress on execution state.

## 5. Improvements

- Add an outbox pattern if queue publish atomicity becomes a hard requirement.
- Introduce explicit state transition validators shared between the gateway and worker.
- Persist retry classification and terminal failure taxonomy for better operations visibility.
