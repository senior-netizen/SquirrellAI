# SquirrellAI

SquirrellAI is organized as a monorepo with a production service topology rooted in `services/*` and shared infrastructure packages in `packages/*`.

## 1. Problem analysis

- `apps/core-platform`: NestJS control-plane API for agent registry, authentication, execution lifecycle management, tool registry, and observability.
- `apps/ai-engine`: FastAPI execution-plane service responsible for orchestration-facing AI execution logic and tool adapters.
- `packages/contracts`: shared TypeScript contracts and JSON schema artifacts used to keep both services aligned.
- `apps/web`: zero-dependency TypeScript operator console for authenticated execution monitoring, registry browsing, and billing visibility.
- `infra/docker` and `infra/compose`: container definitions and local orchestration primitives.
- `docs/architecture` and `docs/api`: architecture records and API contract references.

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
apps/
  core-platform/
  ai-engine/
  web/
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
pnpm --filter @squirrellai/core-platform start:dev
uvicorn main:app --app-dir apps/ai-engine/src --reload --port 8000
pnpm --filter @squirrellai/web dev
```

### Frontend configuration

The frontend static server runs on `http://localhost:5173` after compiling the TypeScript app into `apps/web/dist`. By default the console calls the local backend services directly:

- Core platform: `http://localhost:3000/v1/*`
- AI engine: `http://localhost:8000/v1/*`

To point the console at different backend hosts, define `window.__SQUIRRELLAI_CONFIG__` before loading `main.js` in `apps/web/index.html` with `coreBaseUrl` and `aiEngineBaseUrl`.

### Run using Docker Compose

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
