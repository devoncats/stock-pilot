import { randomUUID } from "node:crypto";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaProductRepository } from "@/modules/catalog/adapter/persistence/product/product.prisma.repository.js";
import {
    Product,
    type ProductProps,
} from "@/modules/catalog/domain/product/product.js";
import { Sku } from "@/modules/catalog/domain/sku/sku.js";
import { Money } from "@/shared/domain/money/money.js";
import { productId } from "@/shared/domain/product-id/product-id.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

const prisma = new PrismaService();
const repository = new PrismaProductRepository(prisma);

const product = (overrides: Partial<ProductProps> = {}): Product =>
    Product.create({
        id: productId(randomUUID()),
        sku: Sku.create(`SKU-${randomUUID().slice(0, 8)}`),
        name: "Widget",
        category: "hardware",
        unitCost: Money.fromDecimalString("19.99"),
        price: Money.fromDecimalString("29.99"),
        holdingCostRate: 0.25,
        active: true,
        ...overrides,
    });

describe("PrismaProductRepository", () => {
    beforeEach(() => resetDatabase(prisma));
    afterAll(() => prisma.$disconnect());

    it("saves and finds a product by id", async () => {
        const data = product();
        await repository.save(data);

        const found = await repository.findById(data.id);

        expect(found?.id).toBe(data.id);
        expect(found?.sku.equals(data.sku)).toBe(true);
        expect(found?.unitCost.equals(data.unitCost)).toBe(true);
    });

    it("finds a product by sku", async () => {
        const data = product({ sku: Sku.create("FINDME-1") });
        await repository.save(data);

        const found = await repository.findBySku(Sku.create("FINDME-1"));

        expect(found?.id).toBe(data.id);
    });

    it("returns null when product is not found by id", async () => {
        expect(await repository.findById(productId(randomUUID()))).toBeNull();
    });

    it("paginates with list", async () => {
        await repository.save(product({ sku: Sku.create("AAA-1") }));
        await repository.save(product({ sku: Sku.create("BBB-2") }));
        await repository.save(product({ sku: Sku.create("CCC-3") }));

        const page = await repository.list({ limit: 2, offset: 0 });

        expect(page.data).toHaveLength(2);
        expect(page.total).toBe(3);
    });

    it("respects offset", async () => {
        await repository.save(product({ sku: Sku.create("AAA-1") }));
        await repository.save(product({ sku: Sku.create("BBB-2") }));
        await repository.save(product({ sku: Sku.create("CCC-3") }));

        const page = await repository.list({ limit: 2, offset: 2 });

        expect(page.data).toHaveLength(1);
        expect(page.total).toBe(3);
    });

    it("updates on save instead of creating a new record", async () => {
        const data = product();
        await repository.save(data);

        await repository.save(
            product({
                id: data.id,
                sku: data.sku,
                unitCost: Money.fromDecimalString("99.99"),
            }),
        );

        const all = await repository.list({ limit: 10, offset: 0 });

        expect(all.data).toHaveLength(1);
        expect(
            all.data[0]?.unitCost.equals(Money.fromDecimalString("99.99")),
        ).toBe(true);
    });
});
