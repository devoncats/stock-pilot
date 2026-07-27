import { randomUUID } from "node:crypto";
import { MovementType } from "@stock-pilot/shared";
import { createProduct } from "test/integration/support/fixtures.js";
import { resetDatabase } from "test/integration/support/reset.js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaStockMovementRepository } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement.prisma.repository.js";
import { MovementReference } from "@/modules/inventory/domain/movement-reference/movement-reference.js";
import {
    StockMovement,
    type StockMovementProps,
} from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { stockMovementId } from "@/modules/inventory/domain/stock-movement-id/stock-movement-id.js";
import {
    type ProductId,
    productId,
} from "@/shared/domain/product-id/product-id.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import { TransactionContext } from "@/shared/transaction-context.js";

const prisma = new PrismaService();
const context = new TransactionContext(prisma);
const repository = new PrismaStockMovementRepository(context);

const movement = (
    product: ProductId,
    overrides: Partial<StockMovementProps> = {},
): StockMovement =>
    StockMovement.create({
        id: stockMovementId(randomUUID()),
        productId: product,
        type: MovementType.ADJUSTMENT,
        qty: -3,
        reference: MovementReference.manual(),
        reason: "cycle count",
        occurredAt: new Date("2026-07-22T12:00:00Z"),
        ...overrides,
    });

describe("PrismaStockMovementRepository", () => {
    beforeEach(() => resetDatabase(prisma));

    afterAll(() => prisma.$disconnect());

    describe("append", () => {
        it("writes the movement outside a transaction, using the base client", async () => {
            const product = await createProduct(prisma);

            await repository.append(movement(productId(product.id)));

            expect(await prisma.stockMovement.count()).toBe(1);
        });

        it("stores the Monday of the movement's week", async () => {
            const product = await createProduct(prisma);

            await repository.append(
                movement(productId(product.id), {
                    occurredAt: new Date("2026-07-22T12:00:00Z"),
                }),
            );

            const row = await prisma.stockMovement.findFirst();

            expect(row?.week.toISOString()).toBe("2026-07-20T00:00:00.000Z");
            expect(row?.createdAt.toISOString()).toBe(
                "2026-07-22T12:00:00.000Z",
            );
        });
    });

    describe("append-only", () => {
        it("cannot be updated or deleted, even bypassing the repository", async () => {
            const product = await createProduct(prisma);
            await repository.append(movement(productId(product.id)));

            const row = await prisma.stockMovement.findFirstOrThrow();

            await expect(
                prisma.stockMovement.update({
                    where: { id: row.id },
                    data: { reason: "tampered" },
                }),
            ).rejects.toThrow();

            await expect(
                prisma.stockMovement.delete({ where: { id: row.id } }),
            ).rejects.toThrow();
        });
    });
});
