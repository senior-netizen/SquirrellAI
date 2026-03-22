# SquirrellAI Observability Monorepo

This repository provides a production-oriented baseline for making observability a first-class feature across two services:

- `services/api-gateway`: NestJS API gateway with execution management endpoints.
- `services/ai-engine`: asynchronous BullMQ worker that processes executions.
- `packages/observability`: shared Postgres entities, Redis queue contracts, correlation propagation, and redaction utilities.

## Architecture

1. API requests enter the NestJS gateway.
2. A correlation ID is accepted or generated and returned via `x-correlation-id`.
3. Execution metadata is persisted to PostgreSQL.
4. A BullMQ job is dispatched to Redis for asynchronous execution.
5. The AI engine consumes the job, updates execution state, writes ordered steps/logs, and schedules retries when failures occur.
6. Log payloads and errors are redacted before they reach durable storage.

## API surface

- `POST /agents/:id/executions`
- `GET /agents/:id/executions`
- `GET /executions/:executionId`

## Persistence model

The PostgreSQL schema is defined in `services/api-gateway/migrations/0001_observability.sql` and mirrored in TypeORM entities under `packages/observability/src/entities.ts`.
