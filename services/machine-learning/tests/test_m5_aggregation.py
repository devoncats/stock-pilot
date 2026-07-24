from pathlib import Path

import pandas as pd
import pytest
from stock_pilot_ml.m5_aggregation import aggregate_m5

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "m5"

@pytest.fixture
def m5_paths() -> dict[str, Path]:
    """
    Returns the paths to the M5 data fixtures.
    """
    return {
        "sales_path": FIXTURE_DIR / "sales_train_sample.csv",
        "calendar_path": FIXTURE_DIR / "calendar_sample.csv",
        "prices_path": FIXTURE_DIR / "sell_prices_sample.csv",
    }

@pytest.fixture
def result(m5_paths: dict[str, Path]) -> pd.DataFrame:
    """
    Returns the result of aggregating the M5 data using the provided fixture paths.
    """
    return aggregate_m5(**m5_paths, store="CA_1", sku_count=2)

def weeks_for(df: pd.DataFrame, sku: str):
    """
    Returns the weeks and quantities for a given SKU from the aggregated M5 DataFrame.
    """
    rows = df[df["sku"] == sku].sort_values("week")
    return list(zip(rows["week"].dt.strftime("%Y-%m-%d"), rows["qty"], strict=True))

def test_daily_to_weekly_anchored_monday(result):
    assert weeks_for(result, "FOODS_1_001") == [
        ("2011-01-24", 2),
        ("2011-01-31", 7),
        ("2011-02-07", 5),
    ]
    assert all(pd.Timestamp(w).isoweekday() == 1 for w in result["week"])


def test_does_not_use_walmart_week(result):
    qtys = [qty for _, qty in weeks_for(result, "FOODS_1_001")]
    assert qtys == [2, 7, 5]


def test_filters_by_store(result):
    assert "FOODS_1_002" not in set(result["sku"])
    assert 9 not in set(result["qty"])


def test_deterministic_subsample(m5_paths):
    first = aggregate_m5(**m5_paths, store="CA_1", sku_count=1)
    second = aggregate_m5(**m5_paths, store="CA_1", sku_count=1)

    assert set(first["sku"]) == {"FOODS_1_001"}
    pd.testing.assert_frame_equal(first, second)


def test_metadata_and_no_negatives(result):
    assert (result["qty"] >= 0).all()
    assert set(result["category"]) == {"FOODS", "HOBBIES"}

    foods = result[result["sku"] == "FOODS_1_001"].iloc[0]
    assert float(foods["price"]) == 3.00
    assert float(foods["unit_cost"]) == 1.95
