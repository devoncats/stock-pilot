import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { runSeed, type SeedOptions } from "@/seed/seed.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

const seedOptions = (overrides: Partial<SeedOptions> = {}): SeedOptions => ({
    path: "test/integration/seed/fixtures/weekly-demand.csv",
    count: 3,
    seed: 42,
    startWeek: "2026-01-05",
    ...overrides,
});

const prisma = new PrismaService();

describe("seed", () => {
    beforeEach(() => resetDatabase(prisma));
    afterAll(() => prisma.$disconnect());

    it("generate at least 1 product", async () => {
        const options = seedOptions();

        const summary = await runSeed(prisma, options);

        expect(summary.products).toBeGreaterThan(0);
    });

    it("a second run creates no duplicates", async () => {
        const options = seedOptions();

        await runSeed(prisma, options);
        const before = await prisma.product.count();

        await runSeed(prisma, options);
        const after = await prisma.product.count();

        expect(after).toEqual(before);
    });

    it("on_hand reconciles with the ledger", async () => {
        const options = seedOptions();

        await runSeed(prisma, options);

        const mismatches = await prisma.$queryRaw`
        SELECT i.product_id, i.on_hand, COALESCE(SUM(m.signed_qty), 0) AS ledger
        FROM inventory_items i
        LEFT JOIN stock_movements m ON m.product_id = i.product_id
        GROUP BY i.product_id, i.on_hand
        HAVING i.on_hand <> COALESCE(SUM(m.signed_qty), 0)
        `;

        expect(mismatches).toEqual([]);
    });

    it("every product has at least one supplier and exactly one primary", async () => {
        const options = seedOptions();

        await runSeed(prisma, options);

        const invalid = await prisma.$queryRaw`
        SELECT p.sku,
               COUNT(sp.id) AS suppliers,
               COUNT(*) FILTER (WHERE sp.is_primary) AS primaries
        FROM products p
        LEFT JOIN supplier_products sp ON sp.product_id = p.id
        GROUP BY p.sku
        HAVING COUNT(sp.id) = 0
            OR COUNT(*) FILTER (WHERE sp.is_primary) <> 1
        `;

        expect(invalid).toEqual([]);
    });

    it("demand_history has no negatives and only Mondays", async () => {
        const options = seedOptions();

        await runSeed(prisma, options);

        const invalid = await prisma.$queryRaw`
        SELECT product_id, week, qty
        FROM demand_history
        WHERE qty < 0 OR EXTRACT(ISODOW FROM week) <> 1
        `;

        expect(invalid).toEqual([]);
    });
});
