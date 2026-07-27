import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

describe("schema", () => {
    let prisma: PrismaService;

    beforeAll(() => {
        prisma = new PrismaService();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("creates exactly the six domain tables", async () => {
        const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND table_name <> '_prisma_migrations'
        `;

        // Exact equality, not arrayContaining: a table added to the schema and
        // forgotten here has to turn this red. Sorted in JS rather than with
        // ORDER BY so the result does not depend on the database collation
        // ('_' sorts before 's' by code unit, but not under every locale).
        expect(rows.map((row) => row.table_name).sort()).toEqual([
            "demand_history",
            "inventory_items",
            "products",
            "stock_movements",
            "supplier_products",
            "suppliers",
        ]);
    });
});
