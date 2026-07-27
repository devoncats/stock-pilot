import {
    createInventoryItem,
    createProduct,
} from "test/integration/support/fixtures.js";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { productId } from "@/modules/catalog/domain/product-id/product-id.js";
import { PrismaInventoryItemRepository } from "@/modules/inventory/adapter/persistence/inventory-item/inventory-item.prisma.repository.js";
import { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import { PrismaTransactionManager } from "@/shared/prisma-transaction.manager.js";
import { TransactionContext } from "@/shared/transaction-context.js";

const NOW = new Date("2026-07-22T12:00:00Z");

const prisma = new PrismaService();
const context = new TransactionContext(prisma);
const manager = new PrismaTransactionManager(prisma, context);
const repository = new PrismaInventoryItemRepository(context, {
    now: () => NOW,
});

describe("PrismaInventoryItemRepository", () => {
    beforeEach(() => resetDatabase(prisma));

    afterAll(() => prisma.$disconnect());

    describe("findByProductIdForUpdate", () => {
        it("refuses to run outside of a transaction", async () => {
            const product = await createProduct(prisma);
            await createInventoryItem(prisma, product.id, { onHand: 10 });

            await expect(
                repository.findByProductIdForUpdate(productId(product.id)),
            ).rejects.toThrow();
        });

        it("returns null for a product with no inventory item", async () => {
            const product = await createProduct(prisma);

            const found = await manager.runInTransaction(() =>
                repository.findByProductIdForUpdate(productId(product.id)),
            );

            expect(found).toBeNull();
        });

        it("reads the locked row as a domain entity", async () => {
            const product = await createProduct(prisma);
            await createInventoryItem(prisma, product.id, {
                onHand: 10,
                reserved: 3,
            });

            const item = await manager.runInTransaction(() =>
                repository.findByProductIdForUpdate(productId(product.id)),
            );

            expect(item).toBeInstanceOf(InventoryItem);
            expect(item?.onHand).toBe(10);
            expect(item?.reserved).toBe(3);
        });
    });

    describe("save", () => {
        it("persists the four levels and stamps updatedAt from the clock", async () => {
            const product = await createProduct(prisma);
            await createInventoryItem(prisma, product.id, { onHand: 10 });

            await manager.runInTransaction(() =>
                repository.save(
                    InventoryItem.create({
                        productId: productId(product.id),
                        onHand: 20,
                        reserved: 5,
                        onOrder: 2,
                        backordered: 1,
                    }),
                ),
            );

            const row = await prisma.inventoryItem.findUnique({
                where: { productId: product.id },
            });

            expect(row).toMatchObject({
                onHand: 20,
                reserved: 5,
                onOrder: 2,
                backordered: 1,
            });

            expect(row?.updatedAt.toISOString()).toBe(NOW.toISOString());
        });
    });
});
