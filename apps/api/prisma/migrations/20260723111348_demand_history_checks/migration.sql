ALTER TABLE "demand_history" ADD CONSTRAINT "demand_history_qty_nonneg" CHECK (qty >= 0);
ALTER TABLE "demand_history" ADD CONSTRAINT "demand_history_week_monday" CHECK (EXTRACT(ISODOW FROM week) = 1);
