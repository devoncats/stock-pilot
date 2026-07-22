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
| Docker | latest | required from F0-02 onwards |

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
pnpm check
pnpm test
pnpm dev
```

`pnpm dev` starts the web app on <http://localhost:3000> and the API on
<http://localhost:8080>. Verify the API with:

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm check` | Quality gate: `typecheck` + `lint` + `format:check` + `lint:ml` |
| `pnpm build` | Builds every workspace |
| `pnpm test` | Vitest across the TS workspaces, then pytest in `services/machine-learning` |
| `pnpm dev` | Runs `api` and `web` in parallel |
| `pnpm format` | Formats the repository with Biome |
| `pnpm typecheck` | `tsc --noEmit` in every TS workspace |

`pnpm check` is the single quality gate — CI calls it rather than re-listing the
individual commands, so local and CI cannot drift.

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
