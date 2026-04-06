# Next.js 13 — standalone output (production, Yarn workspaces — build from repository root)
#
# Build args (public env ฝังตอน build):
#   NEXT_PUBLIC_API_URL=/api/v1
#   NEXT_PUBLIC_WS_ORIGIN=   (ว่าง = ใช้ origin เดียวกับหน้าเว็บ เช่นหลัง Nginx)

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN yarn install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY apps ./apps

ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_WS_ORIGIN=
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_ORIGIN=$NEXT_PUBLIC_WS_ORIGIN
ENV BACKEND_INTERNAL_URL=

WORKDIR /app/apps/frontend
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Monorepo standalone: server.js อยู่ที่ apps/frontend/ ภายใต้รากของ .next/standalone
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=35s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/frontend/server.js"]
