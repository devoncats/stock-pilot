import { randomUUID } from "node:crypto";
import { MovementType, ReferenceType } from "@stock-pilot/shared";
import {
    createInventoryItem,
    createProduct,
} from "test/integration/support/fixtures.js";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaInventoryItemRepository } from "@/modules/inventory/adapter/persistence/inventory-item/inventory-item.prisma.repository.js";
import { PrismaStockMovementRepository } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement.prisma.repository.js";
import type { InventoryItemRepository } from "@/modules/inventory/application/commands/ports/inventory-item.repository.js";
import { RecordStockMovement } from "@/modules/inventory/application/commands/record-stock-movement.use-case.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import { PrismaTransactionManager } from "@/shared/prisma-transaction.manager.js";
import { TransactionContext } from "@/shared/transaction-context.js";

const NOW = new Date("2026-07-22T12:00:00Z");

const prisma = new PrismaService();
const context = new TransactionContext(prisma);
const manager = new PrismaTransactionManager(prisma, context);
const clock = { now: () => NOW };
const ids = { next: () => randomUUID() };

const items = new PrismaInventoryItemRepository(context, clock);
const movements = new PrismaStockMovementRepository(context);
const useCase = new RecordStockMovement(items, movements, manager, clock, ids);

const adjustment = (productId: string, qty: number) => ({
    productId,
    type: MovementType.ADJUSTMENT,
    qty,
    reference: { type: ReferenceType.MANUAL },
    reason: "cycle count",
});

const receipt = (productId: string, qty: number) => ({
    productId,
    type: MovementType.RECEIPT,
    qty,
    reference: { type: ReferenceType.PURCHASE_ORDER, id: randomUUID() },
});

const onHandOf = async (productId: string) =>
    (await prisma.inventoryItem.findUnique({ where: { productId } }))?.onHand;

describe("RecordStockMovement (integration)", () => {
    beforeEach(() => resetDatabase(prisma));

    afterAll(() => prisma.$disconnect());

    it("rolls the movement back when persisting the item fails", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 10 });

        const failingItems: InventoryItemRepository = {
            findByProductIdForUpdate: (id) =>
                items.findByProductIdForUpdate(id),
            save: () => Promise.reject(new Error("boom")),
        };

        const failing = new RecordStockMovement(
            failingItems,
            movements,
            manager,
            clock,
            ids,
        );

        await expect(
            failing.execute(adjustment(product.id, -3)),
        ).rejects.toThrow("boom");

        expect(await prisma.stockMovement.count()).toBe(0);
        expect(await onHandOf(product.id)).toBe(10);
    });

    it("serialises concurrent adjustments on the same SKU", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 10 });

        await Promise.all([
            useCase.execute(adjustment(product.id, -3)),
            useCase.execute(adjustment(product.id, -4)),
        ]);

        expect(await onHandOf(product.id)).toBe(3);
        expect(await prisma.stockMovement.count()).toBe(2);
    });

    it("keeps on-hand equal to the sum of signed quantities", async () => {
        const product = await createProduct(prisma);
        await createInventoryItem(prisma, product.id, { onHand: 0 });

        await useCase.execute(receipt(product.id, 20));

        for (const qty of [-3, 5, -2, 10, -7]) {
            await useCase.execute(adjustment(product.id, qty));
        }

        const aggregate = await prisma.stockMovement.aggregate({
            where: { productId: product.id },
            _sum: { signedQty: true },
        });

        expect(await onHandOf(product.id)).toBe(23);
        expect(await onHandOf(product.id)).toBe(aggregate._sum.signedQty);
    });
});
