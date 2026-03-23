FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.build.json .eslintrc.cjs .prettierrc.json ./
COPY services/ai-engine/package.json services/ai-engine/package.json
COPY packages/observability/package.json packages/observability/package.json
RUN corepack enable && pnpm install --recursive --frozen-lockfile=false
COPY services/ai-engine services/ai-engine
COPY packages/observability packages/observability
COPY types types
RUN pnpm --filter @squirrell/observability build && pnpm --filter @squirrell/ai-engine build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/observability ./packages/observability
COPY --from=builder /app/services/ai-engine ./services/ai-engine
ENV NODE_ENV=production
WORKDIR /app/services/ai-engine
CMD ["node", "dist/main.js"]
