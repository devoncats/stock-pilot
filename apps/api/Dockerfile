FROM node:24-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PNPM_HOME:$PATH
ENV HUSKY=0

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @stock-pilot/api...

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter "@stock-pilot/api..." build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "apps/api/dist/main"]
