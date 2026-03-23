# Prototype applications

The directories in `apps/*` are legacy scaffolds and exploratory implementations.

- They are **not** the canonical production services.
- Operators should build and deploy `services/api-gateway` and `services/ai-engine` instead.
- Local infrastructure in `infra/compose/docker-compose.yml` is intentionally wired only to the canonical `services/*` path.
