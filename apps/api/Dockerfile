# Build context is the repo root (see docker-compose.yml).
# `turbo prune` cuts the monorepo down to the API and the workspaces it depends on,
# so the mobile app's dependencies never enter the image.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS pruner
WORKDIR /repo
RUN npm install -g turbo@2.11.5
COPY . .
RUN turbo prune @padosipro/api --docker

FROM base AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN npm ci
COPY --from=pruner /repo/out/full/ .
RUN npx turbo run build --filter=@padosipro/api
RUN npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/migrations ./apps/api/migrations
WORKDIR /repo/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/server.js"]
