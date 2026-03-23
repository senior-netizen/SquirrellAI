# Architecture Decision Records

This directory documents the canonical `services/*` production topology, the orchestration contract between services, and the repository layout decisions that keep prototype code separate from deployable code.

## Documents

- `canonical-topology.md`: operator-facing deployment topology, startup order, and infrastructure dependencies.
- `adr-0001-monorepo-layout.md`: why the repository uses a multi-surface monorepo and which paths are authoritative.
- `adr-0001-orchestration-contracts.md`: the execution contract between the API gateway, AI engine worker, and sandbox/runtime boundary.
