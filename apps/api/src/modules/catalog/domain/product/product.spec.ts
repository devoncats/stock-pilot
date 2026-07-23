import { describe, expect, it } from "vitest";
import { Money } from "@/shared/domain/money/money.js";
import { productId } from "../product-id/product-id.js";
import { Sku } from "../sku/sku.js";
import { Product } from "./product.js";

const validProps = () => ({
    id: productId("0192f8a0-0000-7000-8000-000000000000"),
    sku: Sku.create("ABC-123"),
    name: "Widget",
    category: "hardware",
    unitCost: Money.fromDecimalString("19.99"),
    price: Money.fromDecimalString("29.99"),
    holdingCostRate: 0.25,
    active: true,
});

describe("Product", () => {
    it("is created with the injected id", () => {
        const id = productId("0192f8a0-0000-7000-8000-000000000000");
        expect(Product.create({ ...validProps(), id }).id).toBe(id);
    });

    it("composes its value objects", () => {
        const product = Product.create(validProps());
        expect(product.sku.value).toBe("ABC-123");
        expect(product.unitCost.equals(Money.fromCents(1999))).toBe(true);
    });

    it("allows a null price", () => {
        expect(
            Product.create({ ...validProps(), price: null }).price,
        ).toBeNull();
    });

    it("rejects a negative holding cost rate", () => {
        expect(() =>
            Product.create({ ...validProps(), holdingCostRate: -0.1 }),
        ).toThrow();
    });

    it("rejects an empty name", () => {
        expect(() =>
            Product.create({ ...validProps(), name: "   " }),
        ).toThrow();
    });
});
