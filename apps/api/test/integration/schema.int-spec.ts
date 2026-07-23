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

    it("creates the five tables", async () => {
        const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `;
        const names = rows.map((r) => r.table_name);
        expect(names).toEqual(
            expect.arrayContaining([
                "products",
                "suppliers",
                "supplier_products",
                "inventory_items",
                "stock_movements",
            ]),
        );
    });
});
