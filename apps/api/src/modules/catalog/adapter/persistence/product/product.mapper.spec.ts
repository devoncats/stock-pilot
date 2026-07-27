import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client.js";
import { ProductMapper } from "@/modules/catalog/adapter/persistence/product/product.mapper.js";
import {
    Product,
    type ProductProps,
} from "@/modules/catalog/domain/product/product.js";
import { productId } from "@/modules/catalog/domain/product-id/product-id.js";
import { Sku } from "@/modules/catalog/domain/sku/sku.js";
import { Money } from "@/shared/domain/money/money.js";

const row = (
    overrides: Partial<Prisma.ProductModel> = {},
): Prisma.ProductModel => ({
    id: "0192f8a0-0000-7000-8000-000000000000",
    sku: "ABC-123",
    name: "Widget",
    category: "hardware",
    unitCost: new Prisma.Decimal("19.99"),
    price: new Prisma.Decimal("29.99"),
    holdingCostRate: new Prisma.Decimal("0.2500"),
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

const product = (overrides: Partial<ProductProps> = {}): Product =>
    Product.create({
        id: productId("0192f8a0-0000-7000-8000-000000000000"),
        sku: Sku.create("ABC-123"),
        name: "Widget",
        category: "hardware",
        unitCost: Money.fromDecimalString("19.99"),
        price: Money.fromDecimalString("29.99"),
        holdingCostRate: 0.25,
        active: true,
        ...overrides,
    });

describe("ProductMapper", () => {
    describe("toDomain", () => {
        it("maps a row to a Product with its value objects", () => {
            const product = ProductMapper.toDomain(row());

            expect(product.id).toBe("0192f8a0-0000-7000-8000-000000000000");
            expect(product.sku.equals(Sku.create("ABC-123"))).toBe(true);
            expect(product.name).toBe("Widget");
            expect(product.category).toBe("hardware");
            expect(product.unitCost.equals(Money.fromCents(1999))).toBe(true);
            expect(product.holdingCostRate).toBe(0.25);
            expect(product.active).toBe(true);
        });

        it("converts Decimal to Money without precision loss", () => {
            const product = ProductMapper.toDomain(
                row({ unitCost: new Prisma.Decimal("19.99") }),
            );

            expect(product.unitCost.equals(Money.fromCents(1999))).toBe(true);
        });

        it("maps a null price to null", () => {
            expect(
                ProductMapper.toDomain(row({ price: null })).price,
            ).toBeNull();
        });
    });

    describe("toPersistence", () => {
        it("maps a Product to a persistance shape", () => {
            const data = ProductMapper.toPersistence(product());

            expect(data.id).toBe("0192f8a0-0000-7000-8000-000000000000");
            expect(data.sku).toBe("ABC-123");
            expect(data.name).toBe("Widget");
            expect(data.category).toBe("hardware");
            expect(data.unitCost).toBe("19.99");
            expect(data.price).toBe("29.99");
            expect(data.holdingCostRate).toBe(0.25);
            expect(data.active).toBe(true);
        });

        it("maps a null price to null", () => {
            expect(
                ProductMapper.toPersistence(product({ price: null })).price,
            ).toBeNull();
        });

        it("dos not emit CreatedAt or UpdatedAt", () => {
            const data = ProductMapper.toPersistence(product());

            expect(data).not.toHaveProperty("createdAt");
            expect(data).not.toHaveProperty("updatedAt");
        });
    });

    describe("round-trip", () => {
        it("preserves the product through persistence and back", () => {
            const original = product();
            const data = ProductMapper.toPersistence(original);

            const restored = ProductMapper.toDomain(
                row({
                    id: data.id,
                    sku: data.sku,
                    name: data.name,
                    category: data.category,
                    unitCost: new Prisma.Decimal(String(data.unitCost)),
                    price:
                        data.price === null
                            ? null
                            : new Prisma.Decimal(String(data.price)),
                    holdingCostRate: new Prisma.Decimal(
                        String(data.holdingCostRate),
                    ),
                }),
            );

            expect(restored.id).toBe(original.id);
            expect(restored.sku.equals(original.sku)).toBe(true);
            expect(restored.unitCost.equals(original.unitCost)).toBe(true);
            expect(restored.price?.equals(original.unitCost)).toBe(false);
            expect(restored.holdingCostRate).toBe(original.holdingCostRate);
        });
    });
});
