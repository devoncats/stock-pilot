
-- ─── CHECKs ────────────────────────────────────────────────────────────────

ALTER TABLE "products"
  ADD CONSTRAINT "products_unit_cost_non_negative" CHECK ("unit_cost" >= 0),
  ADD CONSTRAINT "products_price_non_negative" CHECK ("price" IS NULL OR "price" >= 0),
  ADD CONSTRAINT "products_holding_cost_rate_range" CHECK ("holding_cost_rate" >= 0 AND "holding_cost_rate" < 1),
  ADD CONSTRAINT "products_sku_not_empty" CHECK ("sku" <> '');

ALTER TABLE "suppliers"
  ADD CONSTRAINT "suppliers_ordering_cost_non_negative" CHECK ("ordering_cost" >= 0);

ALTER TABLE "supplier_products"
  ADD CONSTRAINT "supplier_products_lead_time_mean_positive" CHECK ("lead_time_mean_weeks" > 0),
  ADD CONSTRAINT "supplier_products_lead_time_std_non_negative" CHECK ("lead_time_std_weeks" >= 0),
  ADD CONSTRAINT "supplier_products_unit_cost_non_negative" CHECK ("unit_cost" >= 0),
  ADD CONSTRAINT "supplier_products_moq_positive" CHECK ("moq" >= 1);

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_on_hand_non_negative" CHECK ("on_hand" >= 0),
  ADD CONSTRAINT "inventory_items_reserved_non_negative" CHECK ("reserved" >= 0),
  ADD CONSTRAINT "inventory_items_reserved_le_on_hand" CHECK ("reserved" <= "on_hand"),
  ADD CONSTRAINT "inventory_items_on_order_non_negative" CHECK ("on_order" >= 0),
  ADD CONSTRAINT "inventory_items_backordered_non_negative" CHECK ("backordered" >= 0);

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_signed_qty_non_zero" CHECK ("signed_qty" <> 0),
  ADD CONSTRAINT "stock_movements_sign_matches_type" CHECK (
    ("type" = 'RECEIPT'    AND "signed_qty" > 0) OR
    ("type" = 'SHIPMENT'   AND "signed_qty" < 0) OR
    ("type" = 'ADJUSTMENT')
  ),
  -- ISODOW: lunes = 1 (DOW pondría domingo en 0 y dejaría pasar fechas malas)
  ADD CONSTRAINT "stock_movements_week_is_monday" CHECK (EXTRACT(ISODOW FROM "week") = 1);

-- ─── TRIGGER: un solo proveedor primario por producto ──────────────────────

CREATE OR REPLACE FUNCTION enforce_single_primary_supplier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary THEN
    -- Serializa cambios concurrentes sobre el mismo producto: sin este lock,
    -- dos transacciones simultáneas no se ven y ambas insertan un primario.
    PERFORM 1 FROM products WHERE id = NEW.product_id FOR UPDATE;
    IF EXISTS (
      SELECT 1 FROM supplier_products
      WHERE product_id = NEW.product_id AND is_primary AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'product % already has a primary supplier', NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplier_products_single_primary
  BEFORE INSERT OR UPDATE ON supplier_products
  FOR EACH ROW EXECUTE FUNCTION enforce_single_primary_supplier();

-- ─── TRIGGER: ledger append-only ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION reject_stock_movement_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- Más fuerte que un REVOKE: aplica a cualquier rol, incluido el superusuario.
  RAISE EXCEPTION 'stock_movements is append-only; % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movements_append_only
  BEFORE UPDATE OR DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION reject_stock_movement_mutation();
