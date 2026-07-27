FROM node:24-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PNPM_HOME:$PATH
ENV HUSKY=0

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

COPY apps/api/prisma.config.ts apps/api
COPY apps/api/prisma apps/api/prisma

ARG DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder

RUN pnpm install --frozen-lockfile --filter @stock-pilot/api...

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter "@stock-pilot/api..." build

ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-interval=15s --retries=6 \
    CMD ["node", "apps/api/dist/health-check.js"]

CMD ["node", "apps/api/dist/main.js"]
