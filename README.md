# StockPilot

Inventory and intelligent replenishment platform. Demand forecasting feeds the
replenishment policies — safety stock, reorder point and EOQ are derived from the
forecast and its variability, never hardcoded.

The system is service-oriented: `api`, `web` and `machine-learning` are separate
deployables that share PostgreSQL as the source of truth.

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node | 24 | see `.nvmrc` |
| pnpm | 10+ | `corepack enable` |
| uv | 0.11+ | Python toolchain for `services/machine-learning` |
| Docker | latest | required for the local stack (Postgres, Redis) |

## Layout

```
apps/api/                    NestJS — domain, use cases, adapters, job orchestration
apps/web/                    Next.js — read-only dashboard
services/machine-learning/   Python — Prefect flows, training, FastAPI inference
packages/shared/             Shared TypeScript contracts (DTOs, enums)
infrastructure/              Docker Compose and local configuration
```

Boundaries are hard: the web only reads stored data, the API owns business logic,
and the ML service writes forecasts to PostgreSQL. See `AGENTS.md` in the planning
repository for the full architecture rules.

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm compose:up      # Postgres and Redis
pnpm dev             # api and web on the host
```

The example environment works as-is for local development — nothing to fill in.
`pnpm dev` starts the web app on <http://localhost:3000> and the API on
<http://localhost:8080>. Verify the API with:

```bash
curl http://localhost:8080/api/v1/health
# {"status":"ok"}
```

## Local stack

Two ways to run it, and they are not interchangeable.

**Daily development — the recommended path.** `pnpm compose:up` starts only the
backing services; `pnpm dev` runs `api` and `web` on the host with hot reload.
This is deliberately the default on Windows: bind-mounting a pnpm workspace into
a Linux container makes the symlinked `node_modules` slow and fragile, and
filesystem events do not propagate, so watch mode in a container does not work.

**Everything in containers.** `pnpm compose:up:apps` builds and starts all four
services. Use it to check parity with a deployed build, or to run the project on
a machine without the Node and Python toolchains. These are **production
images** — they compile at image build time and run the compiled artefact, so a
source change needs a rebuild. `compose:up:apps` passes `--build`, so the command
is the same; it just takes about a minute.

| Service | URL | Configurable via |
| --- | --- | --- |
| web | <http://localhost:3000> | `WEB_PORT` |
| api | <http://localhost:8080> | `API_PORT` |
| Postgres | `localhost:5432` | `POSTGRES_PORT` |
| Redis | `localhost:6379` | `REDIS_PORT` |

Only the host ports are configurable. Inside the Compose network the ports are
constants, so both startup paths always agree on where the API lives.

Verify the stack with the smoke script:

```bash
pnpm smoke:infrastructure   # Postgres answers SELECT 1, Redis answers PING
pnpm smoke:apps             # the above, plus api /health and the web root
```

> **`docker compose down` is not enough.** `api` and `web` sit under the `apps`
> profile, and a profile-less `down` ignores them — they keep running. Use
> `pnpm compose:down`, which pins `--profile apps`.

> **Never run `docker compose down -v`.** The `-v` removes the `pgdata` volume,
> which is the database.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm check` | Quality gate for both lanes: `check:node` + `lint:ml` |
| `pnpm check:node` | Node lane only: `typecheck` + `typecheck:infrastructure` + `lint` + `format:check` |
| `pnpm build` | Builds every workspace |
| `pnpm test` | Both lanes: `test:node` + `test:ml` |
| `pnpm test:node` | Vitest across the TS workspaces |
| `pnpm dev` | Runs `api` and `web` in parallel |
| `pnpm seed` | Loads master data, sourcing, inventory and demand history — see [Seed data](#seed-data) |
| `pnpm format` | Formats the repository with Biome |
| `pnpm typecheck` | `tsc --noEmit` in every TS workspace |
| `pnpm compose:up` | Starts Postgres and Redis only — the daily path |
| `pnpm compose:up:apps` | Builds and starts all four services |
| `pnpm compose:down` | Stops everything, including the `apps` profile |
| `pnpm compose:logs` | Tails logs for every service |
| `pnpm compose:config` | Validates the Compose file |
| `pnpm smoke:infrastructure` | Checks Postgres and Redis are answering |
| `pnpm smoke:apps` | Same, plus the API `/api/v1/health` and the web root |

`pnpm check` and `pnpm test` are the local quality gates. They compose the two
lanes — Node and Python — and CI calls the lane scripts directly rather than
re-listing the individual commands, so the Node lane cannot drift between local
and CI. See [Continuous integration](#continuous-integration) for how the Python
lane differs.

## Continuous integration

`.github/workflows/ci.yaml` runs on every pull request to `main` and on every
push to `main`. Stale runs are cancelled by `concurrency`, and the workflow holds
`permissions: contents: read` — it reads the repository and nothing else.

| Job | What it runs |
| --- | --- |
| `node` | `pnpm install --frozen-lockfile` → build `@stock-pilot/shared` → `check:node` → `test:node` → `build` |
| `python` | `uv sync` → `uv run ruff check .` → `uv run pytest`, in `services/machine-learning` |
| `meta` | actionlint over the workflow files, then commitlint over the pull request's commit range |

The three jobs run in parallel. Integration tests use the runner's Docker through
Testcontainers, exactly as they do locally.

**`DATABASE_URL` is set to a placeholder in the `node` and `meta` jobs, and it is
not a secret — do not move it to GitHub Secrets.** `apps/api` runs
`prisma generate` on `postinstall`, and `prisma.config.ts` resolves
`env("DATABASE_URL")` eagerly when the config file loads. The root `.env` is
gitignored, so it does not exist on a CI runner and `pnpm install` fails outright
without the variable. The value points at nothing on purpose: integration tests
receive their real connection string from Testcontainers at runtime, and dotenv
does not overwrite variables already present in the environment.

**Building `@stock-pilot/shared` before the checks is load-bearing, not a
leftover.** The package exposes its types from `dist/`, which is gitignored, and
both `apps/api` and `apps/web` import it — a clean checkout does not typecheck
until it is built. It is filtered rather than a full `pnpm build` so that
typecheck fails fast; the complete build still runs at the end as its own check.

**The `python` job calls `uv` directly instead of `pnpm lint:ml` / `pnpm test:ml`.**
pnpm's `verifyDepsBeforeRun` setting defaults to `install`, so any `pnpm <script>`
on a clean checkout triggers a full install of the monorepo — plus Prisma's
postinstall — before running anything. Paying for 800-odd packages to run a
`ruff check` is not worth it, and it would couple the Python lane to the health of
the Node toolchain. The trade-off is deliberate: **if the ml lane gains another
check, both `package.json` and the workflow need updating.**

No runtime version is written into the workflow. Node comes from `.nvmrc`, pnpm
from the `packageManager` field, and Python from `.python-version`, so there is
exactly one place to change each.

### Required status checks

Branch protection is configured in the GitHub UI, not in this repository. On
`main`: require a pull request before merging, require the status checks **`node`**,
**`python`** and **`meta`** in strict mode (branches must be up to date), and do not
allow bypassing these settings.

## Database migrations

The Prisma schema lives in `apps/api/prisma/schema.prisma`. The generated client
goes to `apps/api/src/generated/prisma` — gitignored and regenerated by
`postinstall`, so `pnpm install --frozen-lockfile` leaves it ready before
`typecheck`. `DATABASE_URL` is loaded from the repo-root `.env` by
`prisma.config.ts`, so the CLI works from the workspace without extra flags.

| Script | What it does |
| --- | --- |
| `pnpm --filter @stock-pilot/api db:migrate` | Create and apply a migration (development) |
| `pnpm --filter @stock-pilot/api db:deploy` | Apply pending migrations without generating (CI / production) |
| `pnpm --filter @stock-pilot/api db:generate` | Regenerate the client |

**Prisma 7 note:** `migrate dev` no longer runs `generate` automatically — after
changing the schema, run `db:generate` (or rely on `postinstall`).

**Hand-written SQL (CHECKs, triggers).** The Prisma schema can't express these.
Create an empty migration, edit its `migration.sql`, then apply:

```bash
pnpm --filter @stock-pilot/api exec prisma migrate dev --create-only --name <name>
# edit prisma/migrations/<timestamp>_<name>/migration.sql
pnpm --filter @stock-pilot/api db:migrate
```

Triggers and CHECKs survive Prisma's diff (it doesn't model them), so re-running
`migrate dev` reports "Already in sync" — no drift.

## Seed data

Seeding is two steps in two languages. Python aggregates the raw
[M5 Forecasting — Accuracy](https://www.kaggle.com/competitions/m5-forecasting-accuracy)
dataset into weekly demand; TypeScript loads that file, generates synthetic SKUs
alongside it, and writes everything to Postgres. The dataset is ~450 MB and stays
out of the repository — `data/` is gitignored.

**1. Download M5 into `data/`.**

```bash
kaggle competitions download -c m5-forecasting-accuracy -p data
```

Then unzip it in place — `Expand-Archive -Path data\m5-forecasting-accuracy.zip
-DestinationPath data` on Windows, `unzip` elsewhere.

> Accept the competition rules on the Kaggle website first. Without that the
> download returns `403` even when the credentials are valid.

**2. Aggregate it into weekly demand.**

```bash
uv run --directory services/machine-learning python -m stock_pilot_ml.cli
```

This writes `data/weekly-demand.csv` — daily sales for a single store, summed
into the Monday of each ISO week.

**3. Migrate and seed.**

```bash
pnpm compose:up
pnpm --filter @stock-pilot/api db:migrate
pnpm seed
```

| Variable | Default | Consumed by |
| --- | --- | --- |
| `SEED_STORE` | `CA_1` | aggregation (Python) |
| `SEED_SKU_COUNT` | `200` | aggregation (Python) |
| `SEED_SYNTH_COUNT` | `50` | seed (TypeScript) |
| `SEED_RANDOM_SEED` | `42` | seed (TypeScript) |
| `SEED_START_WEEK` | `2011-01-24` | seed (TypeScript) |
| `SEED_SYNTHETIC_WEEKS` | `273` | seed (TypeScript) |
| `SEED_WEEKLY_DEMAND_PATH` | `../../data/weekly-demand.csv` | seed (TypeScript) |

The seed is **idempotent and reproducible**: rows are upserted by natural key and
the synthetic data comes from a seeded PRNG, so a second run reports identical
counts and a given seed always produces the same SKUs. Initial stock is recorded
as a `RECEIPT` movement rather than written straight to `on_hand`, so the ledger
stays the source of truth.

Only step 2's output is required — the seed reads `data/weekly-demand.csv` and
never touches the raw M5 files. A hand-written CSV with the same columns is
enough for a small local dataset.

## Conventions

**Formatting and linting.** [Biome](https://biomejs.dev) handles both for
TypeScript, JavaScript, JSON and CSS; [ruff](https://docs.astral.sh/ruff/) does the
same for Python. `.editorconfig` is the single source of truth for indentation —
Biome reads it via `formatter.useEditorconfig`, so do **not** set
`formatter.indentWidth` in `biome.json`.

**Commits.** [Conventional Commits](https://www.conventionalcommits.org), enforced
by commitlint on the `commit-msg` hook.

**Hooks.** Husky runs `lint-staged` (Biome over staged files) and `typecheck`
before every commit. `git commit --no-verify` bypasses them — treat it as a manual
exception, not a habit.

**Tests.** Strict TDD (tests first, red before green) applies to domain and
application logic. UI adapters require behaviour coverage but not test-first
ordering, and toolchain smoke tests require neither. Import test helpers
explicitly (`import { describe, it } from "vitest"`) — globals are disabled on
purpose so Jest and Vitest type declarations cannot collide.

## Notes for contributors

`apps/api` disables Biome's `useImportType` rule. NestJS reads constructor
parameter types at runtime through `emitDecoratorMetadata`, and rewriting an
injected class to `import type` erases it from the compiled output, breaking
dependency injection. Anything Nest instantiates or injects must be a plain
`import`; types that only describe a shape should use `import type`.

`apps/api` also runs Vitest through SWC (`unplugin-swc`) with `oxc: false`, because
neither Oxc nor esbuild emits the decorator metadata Nest depends on.

The two app images have deliberately different shapes, each following its own
framework's official guidance. `apps/api` is a single stage running
`node apps/api/dist/main`, as in the NestJS deployment docs. `apps/web` is three
stages using Next's `output: "standalone"` and a non-root user, as in the Vercel
`with-docker` example. Because `outputFileTracingRoot` points at the repo root,
the standalone tree mirrors the monorepo and the server ends up at
`apps/web/server.js`, not at the standalone root — and `.next/static` and `public`
are copied explicitly, since the minimal server does not include them.

`NEXT_PUBLIC_API_URL` is a **build argument**, not a runtime variable. Next inlines
`NEXT_PUBLIC_*` into the browser bundle at compile time, so setting it in
`environment:` would have no effect.

Every Compose invocation passes `--env-file .env`. The Compose project directory
is `infrastructure/`, where no `.env` exists, so without the flag every `${VAR}`
resolves to empty — silently.
