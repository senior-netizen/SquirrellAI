# API Contract Baseline

## Control plane
- `GET /v1/agents` returns registered agents and availability.
- `GET /v1/executions` returns execution summaries.
- `POST /v1/auth/token` returns a development token placeholder.
- `GET /v1/tool-registry` returns registered tool descriptors.
- `GET /v1/observability/readiness` returns readiness checks.

## AI engine
- `GET /v1/health` returns process liveness.
- `GET /v1/executions` returns execution summaries from the execution application service.

## Shared payloads
Canonical payloads live in `packages/contracts/src` and JSON schemas under `packages/contracts/schemas`.
