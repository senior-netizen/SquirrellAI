# ADR-0001: Adopt a polyglot monorepo baseline

## Status
Accepted

## Context
SquirrellAI needs a control plane (`core-platform`) and an execution plane (`ai-engine`) that evolve together while sharing contracts and local orchestration.

## Decision
Use a single repository with:

- `apps/core-platform` for the NestJS API gateway and control-plane concerns.
- `apps/ai-engine` for the FastAPI execution engine.
- `packages/contracts` for shared type contracts and JSON schemas.
- `infra/*` for deployment-adjacent assets.
- `docs/*` for architectural decisions and API references.

## Consequences
- Shared contracts stay versioned with both services.
- CI can validate cross-service compatibility in a single pipeline.
- Teams must keep TypeScript and Python tooling isolated but coordinated.
