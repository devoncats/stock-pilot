import { randomUUID } from "node:crypto";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Prisma } from "@/generated/prisma/browser.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import { PrismaTransactionManager } from "@/shared/prisma-transaction.manager.js";
import { TransactionContext } from "@/shared/transaction-context.js";

const prisma = new PrismaService();
const context = new TransactionContext(prisma);
const manager = new PrismaTransactionManager(prisma, context);

const productRow = (
    overrides: Partial<Prisma.ProductCreateInput>,
): Prisma.ProductCreateInput => {
    const id = randomUUID();

    return {
        id,
        sku: `TX-${id.slice(0, 8)}`,
        name: "Test product",
        category: "test",
        unitCost: "5.00",
        holdingCostRate: "0.25",
        ...overrides,
    };
};

describe("PrismaTransactionManager", () => {
    beforeEach(() => resetDatabase(prisma));

    afterAll(() => prisma.$disconnect());

    it("commits the work done inside the callback", async () => {
        await manager.runInTransaction(async () => {
            await context.getClient().product.create({ data: productRow({}) });
        });

        expect(await prisma.product.count()).toBe(1);
    });

    it("rolls back everything when the callback throws", async () => {
        await expect(
            manager.runInTransaction(async () => {
                await context
                    .getClient()
                    .product.create({ data: productRow({}) });
                throw new Error("Simulated failure");
            }),
        ).rejects.toThrow("Simulated failure");

        expect(await prisma.product.count()).toBe(0);
    });

    it("joins the outer transaction instead of opening a second one", async () => {
        await expect(
            manager.runInTransaction(async () => {
                await context
                    .getClient()
                    .product.create({ data: productRow({}) });

                await manager.runInTransaction(async () => {
                    await context
                        .getClient()
                        .product.create({ data: productRow({}) });
                });

                throw new Error("Simulated failure");
            }),
        ).rejects.toThrow("Simulated failure");

        expect(await prisma.product.count()).toBe(0);
    });

    it("uses the base client outside a transaction", async () => {
        await context.getClient().product.create({ data: productRow({}) });

        expect(await prisma.product.count()).toBe(1);
    });

    it("refuses to hand out a transactional client outside a transaction", () => {
        expect(() => context.requireTransaction()).toThrow();
    });
});
