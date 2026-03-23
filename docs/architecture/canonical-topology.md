# Canonical topology

## 1. Problem analysis

SquirrellAI contains both prototype application scaffolds under `apps/*` and production-oriented services under `services/*`. Operators need a single deployment story with explicit dependencies so execution state, queueing, and worker processing stay coherent.

## 2. System design

### Canonical runtime components

- `services/api-gateway`: NestJS ingress service that accepts execution requests, persists execution state to Postgres, and publishes execution jobs to Redis-backed BullMQ queues.
- `services/ai-engine`: background worker that consumes execution jobs, updates execution records in Postgres, and schedules retries through Redis.
- `postgres`: durable system of record for agents, executions, steps, logs, and artifacts.
- `redis`: queue transport and retry coordination for execution dispatch.

### Topology

```text
client request
  -> api-gateway
      -> postgres (system of record)
      -> redis (dispatch + retry queues)
  -> ai-engine worker
      -> postgres (execution updates, logs, artifacts)
      -> redis (consume dispatch queue, publish retry queue)
```

## 3. Implementation

### Startup order

1. Start `postgres` and wait for readiness.
2. Start `redis` and wait for readiness.
3. Initialize the observability schema from `services/api-gateway/migrations/0001_observability.sql`.
4. Start `services/api-gateway`.
5. Start `services/ai-engine`.

### Required environment

| Component | Required variables |
| --- | --- |
| `services/api-gateway` | `PORT`, `DATABASE_URL`, `REDIS_URL` |
| `services/ai-engine` | `DATABASE_URL`, `REDIS_URL` |
| `postgres` | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| `redis` | none for local development |

### Local orchestration

Use `infra/compose/docker-compose.yml` for the full stack. It provisions Postgres, Redis, the API gateway, and the AI engine worker with explicit health-based dependency ordering.

## 4. Edge cases

- If Postgres is reachable but the schema is absent, the API gateway and worker may boot but will fail on first persistence access.
- If Redis is unavailable, execution acceptance can persist state in Postgres but cannot dispatch work safely.
- If the AI engine is unavailable, queued executions remain durable in Postgres and Redis but will not progress.
- Prototype code under `apps/*` should not be wired into Compose or deployment automation.

## 5. Improvements

- Add explicit migration automation for non-local environments.
- Introduce service health probes that validate both database and queue dependencies.
- Add metrics for queue depth, execution latency, and retry saturation.
