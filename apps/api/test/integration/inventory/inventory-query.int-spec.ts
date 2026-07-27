import { randomUUID } from "node:crypto";
import {
    createDemandHistory,
    createInventoryItem,
    createProduct,
    createStockMovement,
} from "test/integration/support/fixtures.js";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
    type ProductId,
    productId,
} from "@/modules/catalog/domain/product-id/product-id.js";
import { PrismaInventoryQuery } from "@/modules/inventory/adapter/persistence/inventory-query.prisma.repository.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

const FIXED_CLOCK = { now: () => new Date("2026-07-22T12:00:00Z") };

const prisma = new PrismaService();
const query = new PrismaInventoryQuery(prisma, FIXED_CLOCK);

describe("PrismaInventoryQuery", () => {
    beforeEach(() => resetDatabase(prisma));

    afterAll(() => prisma.$disconnect());

    describe("listPositions", () => {
        it("reports the global total, not the page's count", async () => {
            const a = await createProduct(prisma, "AAA-1");
            const b = await createProduct(prisma, "BBB-2");
            const c = await createProduct(prisma, "CCC-3");
            await createInventoryItem(prisma, a.id, { onHand: 1 });
            await createInventoryItem(prisma, b.id, { onHand: 2 });
            await createInventoryItem(prisma, c.id, { onHand: 3 });

            const page = await query.listPositions({ offset: 1, limit: 2 });

            expect(page.data).toHaveLength(2);
            expect(page.total).toBe(3);
            expect(page.page).toBe(1);
            expect(page.limit).toBe(2);
        });

        it("searches case-insensitively by SKU and by name", async () => {
            const match = await prisma.product.create({
                data: {
                    id: randomUUID(),
                    sku: "widget-blue",
                    name: "Blue Widget",
                    category: "test",
                    unitCost: "5.00",
                    holdingCostRate: "0.25",
                },
            });

            const other = await createProduct(prisma, "ZZZ-9");
            await createInventoryItem(prisma, match.id);
            await createInventoryItem(prisma, other.id);

            const bySku = await query.listPositions({
                offset: 0,
                limit: 10,
                search: "WIDGET-BLUE",
            });

            const byName = await query.listPositions({
                offset: 0,
                limit: 10,
                search: "blue widget",
            });

            expect(bySku.data.map((p) => p.productId)).toEqual([match.id]);
            expect(byName.data.map((p) => p.productId)).toEqual([match.id]);
        });

        it("sorts by sku, onHand and value, ascending and descending", async () => {
            const cheap = await createProduct(prisma, "AAA-CHEAP");
            const pricey = await createProduct(prisma, "ZZZ-PRICEY");
            await prisma.product.update({
                where: { id: cheap.id },
                data: { unitCost: "1.00" },
            });
            await prisma.product.update({
                where: { id: pricey.id },
                data: { unitCost: "100.00" },
            });
            await createInventoryItem(prisma, cheap.id, { onHand: 50 });
            await createInventoryItem(prisma, pricey.id, { onHand: 1 });

            const bySkuAsc = await query.listPositions({
                offset: 0,
                limit: 10,
                sort: "sku",
                dir: "asc",
            });
            expect(bySkuAsc.data.map((p) => p.sku)).toEqual([
                "AAA-CHEAP",
                "ZZZ-PRICEY",
            ]);

            const byOnHandDesc = await query.listPositions({
                offset: 0,
                limit: 10,
                sort: "onHand",
                dir: "desc",
            });
            expect(byOnHandDesc.data.map((p) => p.sku)).toEqual([
                "AAA-CHEAP",
                "ZZZ-PRICEY",
            ]);

            const byValueDesc = await query.listPositions({
                offset: 0,
                limit: 10,
                sort: "value",
                dir: "desc",
            });
            // pricey: 1 * $100.00 = $100.00 vs cheap: 50 * $1.00 = $50.00
            expect(byValueDesc.data.map((p) => p.sku)).toEqual([
                "ZZZ-PRICEY",
                "AAA-CHEAP",
            ]);
        });

        it("returns coverageWeeks: null for a SKU with no demand history", async () => {
            const product = await createProduct(prisma);
            await createInventoryItem(prisma, product.id, { onHand: 10 });

            const page = await query.listPositions({ offset: 0, limit: 10 });

            expect(page.data[0]?.coverageWeeks).toBeNull();
        });
    });

    describe("findPosition", () => {
        it("returns null for an unknown product", async () => {
            expect(
                await query.findPosition(productId(randomUUID())),
            ).toBeNull();
        });

        it("derives available/position/valueCents from the same formula as InventoryItem", async () => {
            const product = await createProduct(prisma);
            await prisma.product.update({
                where: { id: product.id },
                data: { unitCost: "2.50" },
            });

            await createInventoryItem(prisma, product.id, {
                onHand: 10,
                reserved: 3,
                onOrder: 5,
                backordered: 1,
            });

            const position = await query.findPosition(product.id as ProductId);

            expect(position?.available).toBe(7);
            expect(position?.position).toBe(14);
            expect(position?.valueCents).toBe(2500);
        });
    });

    describe("listMovements", () => {
        it("returns movements newest first and paginated", async () => {
            const product = await createProduct(prisma);
            await createInventoryItem(prisma, product.id);
            await createStockMovement(prisma, product.id, { reason: "first" });
            await new Promise((resolve) => setTimeout(resolve, 5));
            await createStockMovement(prisma, product.id, {
                reason: "second",
            });

            const page = await query.listMovements(product.id as ProductId, {
                offset: 0,
                limit: 10,
            });

            expect(page.data.map((m) => m.reason)).toEqual(["second", "first"]);
            expect(page.total).toBe(2);
        });
    });

    describe("inventoryKpis", () => {
        it("matches a hand-computed value and coverage over seeded data", async () => {
            const a = await createProduct(prisma, "KPI-A");
            const b = await createProduct(prisma, "KPI-B");
            await prisma.product.update({
                where: { id: a.id },
                data: { unitCost: "10.00" },
            });
            await prisma.product.update({
                where: { id: b.id },
                data: { unitCost: "5.00" },
            });
            await createInventoryItem(prisma, a.id, { onHand: 10 });
            await createInventoryItem(prisma, b.id, { onHand: 0 });
            await createDemandHistory(prisma, a.id, [
                { week: "2026-01-05", qty: 10 },
                { week: "2026-01-12", qty: 10 },
            ]);

            const kpis = await query.inventoryKpis();

            expect(kpis.totalSkus).toBe(2);
            // a: 10 * $10.00 = $100.00; b: 0 * $5.00 = $0.00
            expect(kpis.inventoryValueCents).toBe(10_000);
            expect(kpis.skusOutOfStock).toBe(1);
            // only `a` has demand history, so the average ignores `b`'s null
            expect(kpis.averageCoverageWeeks).toBe(1);
        });
    });
});
