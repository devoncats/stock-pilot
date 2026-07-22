FROM node:24-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV HUSKY=0

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter @stock-pilot/web...

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @stock-pilot/shared build && pnpm --filter @stock-pilot/web dev"]
