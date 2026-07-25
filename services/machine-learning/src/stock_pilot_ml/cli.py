"""Aggregate the raw M5 dataset into the weekly demand file the seed consumes.

Usage: uv run python -m stock_pilot_ml.cli
"""

import os
import sys
from pathlib import Path

from stock_pilot_ml.m5_aggregation import aggregate_m5

# services/machine-learning/src/stock_pilot_ml/cli.py -> repo root
REPO_ROOT = Path(__file__).parents[4]

SALES_FILE = "sales_train_validation.csv"
CALENDAR_FILE = "calendar.csv"
PRICES_FILE = "sell_prices.csv"
OUTPUT_FILE = "weekly-demand.csv"


def main() -> int:
    data_dir = Path(os.environ.get("SEED_DATA_DIR") or REPO_ROOT / "data")
    store = os.environ.get("SEED_STORE", "CA_1")
    sku_count = int(os.environ.get("SEED_SKU_COUNT", "200"))

    missing = [
        name
        for name in (SALES_FILE, CALENDAR_FILE, PRICES_FILE)
        if not (data_dir / name).exists()
    ]

    if missing:
        print(
            f"Missing M5 files in {data_dir}: {', '.join(missing)}\n"
            "Download the M5 Forecasting - Accuracy dataset from Kaggle "
            "(see README, 'Seed data').",
            file=sys.stderr,
        )
        return 1

    weekly = aggregate_m5(
        sales_path=data_dir / SALES_FILE,
        calendar_path=data_dir / CALENDAR_FILE,
        prices_path=data_dir / PRICES_FILE,
        store=store,
        sku_count=sku_count,
    )

    output = data_dir / OUTPUT_FILE
    weekly.to_csv(output, index=False)

    print(
        f"Wrote {len(weekly)} rows "
        f"({weekly['sku'].nunique()} SKUs from {store}) to {output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
