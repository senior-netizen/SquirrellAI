FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.build.json .eslintrc.cjs .prettierrc.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY packages/observability/package.json packages/observability/package.json
RUN corepack enable && pnpm install --recursive --frozen-lockfile=false
COPY services/api-gateway services/api-gateway
COPY packages/observability packages/observability
COPY types types
RUN pnpm --filter @squirrell/observability build && pnpm --filter @squirrell/api-gateway build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/observability ./packages/observability
COPY --from=builder /app/services/api-gateway ./services/api-gateway
ENV NODE_ENV=production
WORKDIR /app/services/api-gateway
EXPOSE 3000
CMD ["node", "dist/main.js"]
