/*
is idempotent: a second run creates no duplicates — corre 2×, compara conteos de las 5 tablas.
on_hand reconciles with the ledger — por SKU, on_hand === Σ signed_qty.
every product has at least one supplier and exactly one primary.
demand_history has no negatives, Mondays only, unique (product, week).
*/

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

    it("a second run creates no duplicates in any table", async () => {
        const options = seedOptions();

        const first = await runSeed(prisma, options);
        const second = await runSeed(prisma, options);

        // The summary counts all six tables. Comparing only `products` would
        // miss the case that matters most: an append-only ledger growing on
        // every re-run.
        expect(second).toEqual(first);
    });

    it("fails with a seed error when a SKU has no demand weeks", async () => {
        await expect(
            runSeed(prisma, seedOptions({ weeks: 0 })),
        ).rejects.toThrow(/has no demand weeks/);
    });

    it("rejects a startWeek that is not a Monday, before writing anything", async () => {
        await expect(
            runSeed(prisma, seedOptions({ startWeek: "2026-01-06" })),
        ).rejects.toThrow(/must be a Monday/);

        expect(await prisma.product.count()).toBe(0);
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
