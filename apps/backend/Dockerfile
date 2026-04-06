# NestJS API — production multi-stage (Yarn workspaces: build from repository root)
#
# Build:  from repo root: docker compose -f apps/backend/docker-compose.yml build api
# Run:    docker compose -f apps/backend/docker-compose.yml up -d api

FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN yarn install --frozen-lockfile

COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache wget

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

RUN chown -R node:node /app

USER node
WORKDIR /app/apps/backend
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
