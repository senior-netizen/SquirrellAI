# SquirrellAI

SquirrellAI is organized as a polyglot monorepo with a clear split between the control plane and the execution plane.

## System boundaries

- `apps/core-platform`: NestJS control-plane API for agent registry, authentication, execution lifecycle management, tool registry, and observability.
- `apps/ai-engine`: FastAPI execution-plane service responsible for orchestration-facing AI execution logic and tool adapters.
- `packages/contracts`: shared TypeScript contracts and JSON schema artifacts used to keep both services aligned.
- `apps/web`: zero-dependency TypeScript operator console for authenticated execution monitoring, registry browsing, and billing visibility.
- `infra/docker` and `infra/compose`: container definitions and local orchestration primitives.
- `docs/architecture` and `docs/api`: architecture records and API contract references.

## Repository layout

```text
apps/
  core-platform/
  ai-engine/
  web/
packages/
  contracts/
infra/
  docker/
  compose/
docs/
  architecture/
  api/
```

## Local startup flow

### Prerequisites
- Node.js 22+
- pnpm 9+
- Python 3.10+

### Install dependencies

```bash
corepack enable
pnpm install --recursive
python -m pip install -e .[dev]
```

### Run the services locally

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

## Production orientation

- Shared execution and tool contracts are versioned in-repo.
- The control plane and execution plane can be built and deployed independently.
- Baseline CI validates TypeScript and Python toolchains separately.
- Documentation captures architecture decisions before feature work begins.
