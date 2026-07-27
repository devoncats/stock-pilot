# StockPilot · Machine Learning

Demand forecasting for StockPilot. This service trains models, evaluates them
against mandatory baselines, and writes the resulting forecasts to PostgreSQL,
where the NestJS API reads them to drive replenishment policies.

The API never trains or infers locally. Integration happens through the database
(and, for on-demand inference, through FastAPI over HTTP).

## Requirements

- Python 3.14 (managed by uv — see `.python-version`)
- [uv](https://docs.astral.sh/uv/) 0.11+

## Usage

```bash
uv sync              # create the venv and install dependencies
uv run pytest        # tests
uv run ruff check .  # lint
uv run ruff format . # format
```

From the monorepo root these are wired as `pnpm test:ml` and `pnpm lint:ml`, and
both are included in `pnpm test` and `pnpm check`. This directory is **not** a pnpm
workspace, so `pnpm -r` does not reach it — the root scripts delegate to uv
explicitly.

## Layout

```
src/stock_pilot_ml/   package source — M5 aggregation and its CLI
tests/                pytest suite and M5 fixtures
pyproject.toml        dependencies, ruff and pytest configuration
```

## Planned scope

So far this service only prepares data: `stock_pilot_ml.cli` aggregates the raw
M5 dataset into the weekly demand file the seed consumes (F0-04). Forecasting
lands in Phase 2:

- **Prefect pipeline** — `ingest → features → train → evaluate → publish`
- **Baselines** (naive, moving average, ETS/Holt-Winters, Croston for intermittent
  demand) as a mandatory comparison
- **LightGBM global model** with calendar, lag and rolling-window features
- **Temporal validation** — rolling-origin backtesting, never a random shuffle
- **WMAPE and MASE** per SKU and aggregated; the main model must beat the
  baselines before it can be promoted
- **FastAPI** service for on-demand inference

Outputs are validated (schema, non-negative values, correct horizon) before being
written to PostgreSQL.
