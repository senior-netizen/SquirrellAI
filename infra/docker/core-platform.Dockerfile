FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json .eslintrc.cjs .prettierrc.json ./
COPY apps/core-platform/package.json apps/core-platform/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN corepack enable && pnpm install --recursive --frozen-lockfile=false
COPY apps/core-platform apps/core-platform
COPY packages/contracts packages/contracts
RUN pnpm --filter @squirrellai/contracts build && pnpm --filter @squirrellai/core-platform build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/core-platform/dist ./dist
COPY --from=builder /app/apps/core-platform/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
