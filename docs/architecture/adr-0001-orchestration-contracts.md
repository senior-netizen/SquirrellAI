# ADR-0001: Explicit orchestration contracts across the control plane, AI engine, and sandbox

- Status: Accepted
- Date: 2026-03-22

## Context

The platform needs a clear separation of concerns before business logic is implemented. Without explicit orchestration contracts, the system risks coupling persistence concerns, agent reasoning, and runtime isolation into one implicit workflow. That would make the platform hard to audit, hard to retry deterministically, and unsafe to evolve.

The architecture has three independent responsibilities:

1. **NestJS control plane** must remain the system of record for execution identity, durable state, lifecycle ownership, and auditability.
2. **FastAPI AI engine** must act as a deterministic executor that transforms inputs into plans, tool calls, observations, and final outputs using explicit contracts.
3. **Docker sandbox** must isolate runtime side effects so tools execute in a constrained environment with bounded capabilities.

This split is required to preserve deterministic orchestration, replayability, observability, and operational safety.

## Decision

We will define orchestration as an explicit contract between three bounded contexts:

### 1. NestJS control plane: system of record

The control plane owns:

- execution identifiers
- request acceptance and idempotency
- durable execution state
- transition validation
- append-only execution logs
- operator and API facing read models

The control plane does **not** implement planning, reasoning, or tool execution policy. It persists what happened and governs whether a transition is legal.

### 2. FastAPI AI engine: deterministic executor

The AI engine owns:

- prompt normalization
- intent parsing
- planning
- tool invocation requests
- observation analysis
- retry decisions
- final output assembly

The AI engine does **not** become the durable source of truth. It consumes and emits typed contracts. Given the same deterministic inputs, model configuration, and tool responses, it should produce equivalent state transition intents and outputs.

### 3. Docker sandbox: isolated runtime

The sandbox owns:

- execution of side-effecting tools
- process isolation
- filesystem isolation
- network and capability boundaries
- capture of deterministic input/output artifacts when possible

The sandbox does **not** own orchestration state. It is an execution substrate invoked by the AI engine or supporting tool runtime.

## State model

Executions move through the following lifecycle states:

- `RECEIVED`
- `PARSED`
- `PLANNED`
- `ACTING`
- `OBSERVING`
- `RETRYING`
- `SUCCEEDED`
- `FAILED`

Every state transition must record:

- prior state
- next state
- tool invoked
- deterministic input payload
- output payload hash
- timestamp

These fields are mandatory so the system can support replay, auditing, debugging, and policy enforcement.

## Data flow

1. A client submits a prompt to the control plane.
2. The control plane persists an execution in `RECEIVED` and emits a request to the AI engine.
3. The AI engine parses intent and proposes `RECEIVED -> PARSED`.
4. The AI engine creates a plan and proposes `PARSED -> PLANNED`.
5. The AI engine issues tool invocations through the sandbox and proposes `PLANNED/RETRYING -> ACTING`.
6. Tool outputs are analyzed and recorded as `ACTING -> OBSERVING`.
7. The AI engine either retries (`OBSERVING -> RETRYING`) or completes (`OBSERVING -> SUCCEEDED`) or fails (`OBSERVING/RETRYING/ACTING -> FAILED`).
8. The control plane validates each transition, persists it, and exposes the final execution state and log.

## Consequences

### Positive

- Durable state remains separate from execution logic.
- Agent behavior becomes replayable and easier to test.
- Sandbox isolation is explicit rather than incidental.
- Failure handling is observable at the transition boundary.
- Contracts can evolve with backward-compatible versioning.

### Negative

- More up-front contract design is required.
- Cross-service schema versioning must be maintained.
- Deterministic payload capture adds storage and hashing overhead.

## Operational notes

- State transitions must be append-only in the execution log.
- Transition validation must happen before persistence commits the next state.
- Tool outputs should be hashed before storage when payload size or sensitivity requires indirection.
- Idempotent submission keys should be supported by the control plane.
- Retry policy should be explicit and bounded by attempt count and failure class.

## Alternatives considered

### Single service orchestration

Rejected because it blurs system-of-record responsibilities with execution logic and reduces operational isolation.

### Sandbox-managed execution state

Rejected because runtimes should be ephemeral and replaceable, not durable authorities.

### AI engine as system of record

Rejected because model-serving infrastructure is not the right place for durable audit state, transition governance, or operator-facing lifecycle management.
