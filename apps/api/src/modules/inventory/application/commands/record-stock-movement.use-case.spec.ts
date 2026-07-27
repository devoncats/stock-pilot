import { MovementType, ReferenceType } from "@stock-pilot/shared";
import { describe, expect, it, vi } from "vitest";
import {
    RecordStockMovement,
    type RecordStockMovementInput,
} from "@/modules/inventory/application/commands/record-stock-movement.use-case.js";
import { InsufficientStockError } from "@/modules/inventory/domain/errors/insufficient-stock/insufficient-stock.error.js";
import { InvalidMovementError } from "@/modules/inventory/domain/errors/invalid-movement/invalid-movement.error.js";
import { InventoryItemNotFoundError } from "@/modules/inventory/domain/errors/inventory-item-not-found/inventory-item-not-found.error.js";
import {
    InventoryItem,
    type InventoryItemProps,
} from "@/modules/inventory/domain/inventory-item/inventory-item.js";
import type { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { productId } from "@/shared/domain/product-id/product-id.js";

const PRODUCT_ID = "0192f8a0-0000-7000-8000-000000000000";
const MOVEMENT_ID = "0192f8a0-0000-7000-8000-000000000010";
const PO_ID = "0192f8a0-0000-7000-8000-000000000002";
const NOW = new Date("2026-07-22T12:00:00Z");

const itemWith = (overrides: Partial<InventoryItemProps> = {}): InventoryItem =>
    InventoryItem.create({
        productId: productId(PRODUCT_ID),
        onHand: 0,
        reserved: 0,
        onOrder: 0,
        backordered: 0,
        ...overrides,
    });

const adjustment = (
    overrides: Partial<RecordStockMovementInput> = {},
): RecordStockMovementInput => ({
    productId: PRODUCT_ID,
    type: MovementType.ADJUSTMENT,
    qty: -3,
    reference: { type: ReferenceType.MANUAL },
    reason: "cycle count",
    ...overrides,
});

function harness(existing: InventoryItem | null = itemWith({ onHand: 10 })) {
    const transactions = {
        active: false,
        calls: 0,
        async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
            this.calls += 1;
            this.active = true;

            try {
                return await fn();
            } finally {
                this.active = false;
            }
        },
    };

    const seen: Record<string, boolean> = {};

    const items = {
        findByProductIdForUpdate: vi.fn(async () => {
            seen.read = transactions.active;

            return existing;
        }),
        save: vi.fn(async () => {
            seen.save = transactions.active;
        }),
    };

    const movements = {
        append: vi.fn(async (_movement: StockMovement) => {
            seen.append = transactions.active;
        }),
    };

    const useCase = new RecordStockMovement(
        items,
        movements,
        transactions,
        { now: () => NOW },
        { next: () => MOVEMENT_ID },
    );

    return {
        useCase,
        items,
        movements,
        transactions,
        seen,
        appendedMovement(): StockMovement {
            const [movement] = movements.append.mock.calls[0] ?? [];

            if (!movement) {
                throw new Error("Expected append to have been called");
            }

            return movement;
        },
    };
}

describe("RecordStockMovement", () => {
    it("reads, appends and saves inside the transaction", async () => {
        const { useCase, items, movements, seen } = harness();

        await useCase.execute(adjustment({ qty: -3 }));

        expect(items.findByProductIdForUpdate).toHaveBeenCalledOnce();
        expect(movements.append).toHaveBeenCalledOnce();
        expect(items.save).toHaveBeenCalledOnce();

        expect(seen).toEqual({ read: true, append: true, save: true });
    });

    it("returns the id and the recomputed position", async () => {
        const { useCase } = harness();

        expect(await useCase.execute(adjustment({ qty: -3 }))).toEqual({
            movementId: MOVEMENT_ID,
            onHand: 7,
            available: 7,
            position: 7,
        });
    });

    it("stamps the movement with the injected clock, id and derived week", async () => {
        const { useCase, appendedMovement } = harness();

        await useCase.execute(adjustment());

        const movement = appendedMovement();

        expect(movement.id).toBe(MOVEMENT_ID);
        expect(movement.occurredAt.toISOString()).toBe(NOW.toISOString());
        expect(movement.week.toString()).toBe("2026-07-20");
    });

    it("fails when the product has no inventory item, persisting nothing", async () => {
        const { useCase, items, movements } = harness(null);

        await expect(useCase.execute(adjustment({ qty: -3 }))).rejects.toThrow(
            InventoryItemNotFoundError,
        );

        expect(movements.append).not.toHaveBeenCalled();
        expect(items.save).not.toHaveBeenCalled();
    });

    it("propagates the domain error without persisting anything", async () => {
        const { useCase, items, movements } = harness();

        await expect(useCase.execute(adjustment({ qty: -30 }))).rejects.toThrow(
            InsufficientStockError,
        );

        expect(movements.append).not.toHaveBeenCalled();
        expect(items.save).not.toHaveBeenCalled();
    });

    it("does not open a transaction when the input itself is invalid", async () => {
        const { useCase, items, transactions } = harness();

        await expect(useCase.execute(adjustment({ qty: 0 }))).rejects.toThrow(
            InvalidMovementError,
        );

        expect(transactions.calls).toBe(0);
        expect(items.findByProductIdForUpdate).not.toHaveBeenCalled();
    });

    it("records a receipt with a purchase order reference and no reason", async () => {
        const { useCase, appendedMovement } = harness();

        await useCase.execute({
            productId: PRODUCT_ID,
            type: MovementType.RECEIPT,
            qty: 10,
            reference: { type: ReferenceType.PURCHASE_ORDER, id: PO_ID },
        });

        const movement = appendedMovement();

        expect(movement.type).toBe(MovementType.RECEIPT);
        expect(movement.reason).toBeNull();
        expect(movement.reference.id).toBe(PO_ID);
    });
});
