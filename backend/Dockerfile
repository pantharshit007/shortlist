# syntax=docker/dockerfile:1

FROM node:24-slim AS base
RUN npm install -g pnpm@11.2.2
WORKDIR /app

# Production dependencies depend only on the lockfile, so code changes reuse this layer and everything after it.
# The pnpm store outlives builds, so a lockfile change downloads only new packages.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# API and worker. The worker uses the same image with `node dist/worker.js`.
FROM base AS api
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY drizzle ./drizzle
USER node
EXPOSE 4000
# exec hands PID 1 to node, so docker stop's SIGTERM reaches the server's graceful shutdown.
CMD ["sh", "-c", "node dist/scripts/migrate.js && node dist/db/seed.js && exec node dist/server.js"]

# LaTeX compiler. Holds no secrets and runs without network access in production.
FROM base AS compiler
ARG TARGETARCH
ARG TECTONIC_VERSION=0.17.0
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN case "$TARGETARCH" in \
      amd64) triple=x86_64-unknown-linux-musl ;; \
      arm64) triple=aarch64-unknown-linux-musl ;; \
      *) echo "Unsupported architecture: $TARGETARCH" && exit 1 ;; \
    esac \
  && curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-${triple}.tar.gz" \
    | tar -xz -C /usr/local/bin tectonic \
  && tectonic --version
ENV XDG_CACHE_HOME=/opt/tex-cache
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
# Download every TeX package the templates and common Overleaf resumes need, then go offline.
# Only what the warm-up imports is copied first, so other code changes don't rerun it; downloads
# persist in a build cache so a template change only recompiles.
COPY --from=build /app/dist/scripts/warm-tectonic.js ./dist/scripts/
COPY --from=build /app/dist/lib/latex ./dist/lib/latex
COPY --from=build /app/dist/schemas ./dist/schemas
COPY --from=build /app/dist/templates ./dist/templates
RUN --mount=type=cache,id=tectonic-downloads,target=/tmp/tex-downloads \
  XDG_CACHE_HOME=/tmp/tex-downloads node dist/scripts/warm-tectonic.js \
  && mkdir -p /opt/tex-cache && cp -a /tmp/tex-downloads/. /opt/tex-cache/ \
  && chmod -R a+rX /opt/tex-cache
COPY --from=build /app/dist ./dist
ENV TECTONIC_ONLY_CACHED=true PORT=4100
USER node
EXPOSE 4100
CMD ["node", "dist/compiler-server.js"]
