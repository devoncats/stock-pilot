"""Aggregate raw M5 daily sales into weekly ISO demand (spec F0-04)."""

from pathlib import Path

import pandas as pd

# D8: M5 exposes sell_price (retail price), but products need a cost.
COST_RATIO = 0.65


def aggregate_m5(
    sales_path: str | Path,
    calendar_path: str | Path,
    prices_path: str | Path,
    store: str,
    sku_count: int,
) -> pd.DataFrame:
    """Return weekly demand per SKU: [sku, week, qty, category, price, unit_cost].

    `week` is the Monday of the ISO week; `qty` is the sum of daily units.
    """
    sales = pd.read_csv(sales_path)
    calendar = pd.read_csv(calendar_path, parse_dates=["date"])
    prices = pd.read_csv(prices_path)

    # 1. Keep only the requested store.
    sales = sales[sales["store_id"] == store]

    # 2. Deterministic subsample: alphabetical, never random (.sample would
    #    break reproducibility, which the seed depends on).
    items = sorted(sales["item_id"].unique())[:sku_count]
    sales = sales[sales["item_id"].isin(items)]

    # 3. Wide (d_1..d_n as columns) -> long (one row per item/day).
    day_columns = [c for c in sales.columns if c.startswith("d_")]
    long_sales = sales.melt(
        id_vars=["item_id", "cat_id"],
        value_vars=day_columns,
        var_name="d",
        value_name="qty",
    )

    # 4. Translate the d_N label into a real calendar date.
    long_sales = long_sales.merge(calendar[["d", "date"]], on="d", how="inner")

    # 5. Anchor each date to the Monday of its ISO week.
    #    .dt.weekday is 0 on Monday, so subtracting it always lands on Monday:
    #    a Saturday (5) rolls back 5 days, a Monday (0) stays put.
    #    D9: derived from `date`, never from wm_yr_wk (Walmart weeks are Sat-Fri).
    long_sales["week"] = long_sales["date"] - pd.to_timedelta(
        long_sales["date"].dt.weekday, unit="D"
    )

    # 6. Sum daily units into weekly demand.
    weekly = long_sales.groupby(["item_id", "week"], as_index=False)["qty"].sum()
    weekly["qty"] = weekly["qty"].astype(int)

    # 7. One price per item: median over the period, robust to promo weeks.
    prices = prices[(prices["store_id"] == store) & (prices["item_id"].isin(items))]
    item_prices = prices.groupby("item_id", as_index=False)["sell_price"].median()
    item_prices = item_prices.rename({"sell_price": "price"}, axis=1)
    # Float math: 3.00 * 0.65 == 1.9500000000000002, so round explicitly.
    item_prices["unit_cost"] = (item_prices["price"] * COST_RATIO).round(2)

    # 8. One category per item.
    categories = sales[["item_id", "cat_id"]].drop_duplicates()

    # 9. Assemble.
    result = weekly.merge(categories, on="item_id", how="left")
    result = result.merge(item_prices, on="item_id", how="left")
    result = result.rename(columns={"item_id": "sku", "cat_id": "category"})
    result = result[["sku", "week", "qty", "category", "price", "unit_cost"]]

    # 10. Stable order + clean index: assert_frame_equal compares the index too,
    #     and filtering/grouping leaves gaps in it.
    return result.sort_values(["sku", "week"]).reset_index(drop=True)
