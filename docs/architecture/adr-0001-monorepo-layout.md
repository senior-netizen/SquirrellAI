# ADR-0001: Adopt a monorepo with canonical production services and isolated prototypes

## Status
Accepted

## 1. Problem analysis

SquirrellAI needs a repository layout that supports real deployable services, shared contracts, and controlled experimentation. The repository currently contains both `apps/*` scaffolds and `services/*` implementations, which can create operator confusion unless one path is declared authoritative.

## 2. System design

The repository is split into three layers:

- `services/*` for deployable production services.
- `packages/*` for shared libraries and contracts.
- `apps/*` for prototype or exploratory implementations that must not be treated as production artifacts.

The authoritative production path is:

- `services/api-gateway` for the control-plane API gateway.
- `services/ai-engine` for the execution worker.
- `packages/observability` and `packages/contracts` for shared code.

## 3. Implementation

Use a single repository with:

- `services/api-gateway` for the NestJS API gateway and control-plane concerns.
- `services/ai-engine` for the background execution worker.
- `packages/observability` for shared persistence entities, correlation context, queue configuration, and redaction.
- `packages/contracts` for shared external type contracts and JSON schemas.
- `infra/*` for deployment-adjacent assets, including the canonical Compose topology.
- `docs/*` for architecture decisions and API references.
- `apps/*` retained only as clearly labeled prototypes.

## 4. Edge cases

- Duplicate package names across prototype and production paths must be avoided so the workspace can resolve dependencies deterministically.
- Operators should never point build or deployment automation at `apps/*`.
- Prototype code may diverge from production behavior and must not be used as the system of record for operational documentation.

## 5. Improvements

- Remove obsolete prototypes entirely once the production services fully supersede them.
- Add automated checks that prevent Compose files or root scripts from referencing prototype paths.
