# SquirrellAI

SquirrellAI is organized as a monorepo with a production service topology rooted in `services/*` and shared infrastructure packages in `packages/*`.

## 1. Problem analysis

The repository currently contains two parallel implementation paths:

- `services/*` contains the production-oriented control-plane API gateway and AI execution worker with real Postgres and Redis integration.
- `apps/*` contains earlier scaffolds and prototypes that are useful for exploration but are **not** the authoritative deployment path.

The canonical production path is therefore:

- `services/api-gateway` for the control-plane ingress, execution persistence, and queue dispatch.
- `services/ai-engine` for execution processing and retry orchestration.
- `packages/observability` for the shared entities, correlation, redaction, and queue contracts.
- `packages/contracts` for schema artifacts shared with external consumers.

## 2. System design

### Canonical production topology

```text
client
  |
  v
services/api-gateway
  |  persists execution state
  |  enqueues jobs
  |
  +--> postgres
  |
  +--> redis
          |
          v
    services/ai-engine
```

### Repository layout

```text
services/
  api-gateway/     # canonical control-plane HTTP API
  ai-engine/       # canonical background execution worker
packages/
  observability/   # shared entities, queue config, correlation, redaction
  contracts/       # shared external contracts
infra/
  compose/         # local multi-service topology
  docker/          # container build definitions for canonical services
docs/
  architecture/    # ADRs and topology notes
apps/              # legacy prototypes; not for production deployment
```

## 3. Implementation

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker with Compose support for local infra bring-up

### Install dependencies

```bash
corepack enable
pnpm install --recursive
```

### Build the canonical services

```bash
pnpm build
```

### Run the canonical services without Docker

Start infrastructure first:

```bash
docker compose -f infra/compose/docker-compose.yml up postgres redis -d
```

Then run the services in startup order:

```bash
DATABASE_URL=postgresql://squirrell:squirrell@localhost:5432/squirrellai \
REDIS_URL=redis://localhost:6379/0 \
pnpm --filter @squirrell/api-gateway start
```

```bash
DATABASE_URL=postgresql://squirrell:squirrell@localhost:5432/squirrellai \
REDIS_URL=redis://localhost:6379/0 \
pnpm --filter @squirrell/ai-engine start
```

### Run the full canonical stack with Docker Compose

```bash
docker compose -f infra/compose/docker-compose.yml up --build
```

This Compose stack starts services in the following order:

1. `postgres`
2. `redis`
3. `api-gateway`
4. `ai-engine`

## 4. Edge cases

- `apps/*` remains in the repository for reference only; operators should not deploy it.
- `services/api-gateway` requires both `DATABASE_URL` and `REDIS_URL` to accept and enqueue executions.
- `services/ai-engine` requires the same infrastructure because it reads execution state from Postgres and consumes BullMQ queues from Redis.
- The Postgres schema is initialized from `services/api-gateway/migrations/0001_observability.sql` during local Compose startup.

## 5. Improvements

- Add a dedicated migration runner service instead of relying on Postgres init scripts for local bootstrapping.
- Add health endpoints and readiness probes to both canonical services.
- Replace default local credentials with secret-managed values in non-local environments.
