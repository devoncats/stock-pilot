import { MovementType } from "@stock-pilot/shared";
import { describe, expect, it } from "vitest";
import { InsufficientStockError } from "@/modules/inventory/domain/errors/insufficient-stock/insufficient-stock.error.js";
import { InvalidMovementError } from "@/modules/inventory/domain/errors/invalid-movement/invalid-movement.error.js";
import { MovementReference } from "@/modules/inventory/domain/movement-reference/movement-reference.js";
import {
    StockMovement,
    type StockMovementProps,
} from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { stockMovementId } from "@/modules/inventory/domain/stock-movement-id/stock-movement-id.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";
import { productId } from "@/shared/domain/product-id/product-id.js";
import { InventoryItem, type InventoryItemProps } from "./inventory-item.js";

const baseInventoryItemProps = (
    overrides: Partial<InventoryItemProps> = {},
) => {
    return {
        productId: productId("0192f8a0-0000-7000-8000-000000000000"),
        onHand: 10,
        reserved: 3,
        onOrder: 5,
        backordered: 2,
        ...overrides,
    };
};

const baseStockMovement = (overrides: Partial<StockMovementProps> = {}) =>
    StockMovement.create({
        id: stockMovementId("0192f8a0-0000-7000-8000-000000000000"),
        productId: productId("0192f8a0-0000-7000-8000-000000000000"),
        type: MovementType.ADJUSTMENT,
        qty: 5,
        reference: MovementReference.manual(),
        reason: "Cycle count adjustment",
        occurredAt: new Date("2026-07-22T12:00:00Z"),
        ...overrides,
    });

describe("InventoryItem", () => {
    it("rejects an empty product id", () => {
        expect(() =>
            InventoryItem.create(
                baseInventoryItemProps({ productId: productId("") }),
            ),
        ).toThrow(InvalidValueError);
    });

    it("rejects a whitespace-only product id", () => {
        expect(() =>
            InventoryItem.create(
                baseInventoryItemProps({ productId: productId("   ") }),
            ),
        ).toThrow(InvalidValueError);
    });

    it("derives available as onHand - reserved", () => {
        expect(
            InventoryItem.create(
                baseInventoryItemProps({ onHand: 10, reserved: 3 }),
            ).available,
        ).toBe(7);
    });

    it("derives position as onHand + onOrder - backordered", () => {
        expect(
            InventoryItem.create(
                baseInventoryItemProps({
                    onHand: 10,
                    onOrder: 5,
                    backordered: 2,
                }),
            ).position,
        ).toBe(13);
    });

    it("rejects reserved greater than onHand", () => {
        expect(() =>
            InventoryItem.create(
                baseInventoryItemProps({ onHand: 5, reserved: 6 }),
            ),
        ).toThrow(InvalidValueError);
    });

    it("rejects negative quantities", () => {
        expect(() =>
            InventoryItem.create(baseInventoryItemProps({ onHand: -1 })),
        ).toThrow(InvalidValueError);
    });

    it("rejects non-integer quantities", () => {
        expect(() =>
            InventoryItem.create(baseInventoryItemProps({ onHand: 1.5 })),
        ).toThrow(InvalidValueError);
    });

    it("handles all-zero state", () => {
        const item = InventoryItem.create(
            baseInventoryItemProps({
                onHand: 0,
                reserved: 0,
                onOrder: 0,
                backordered: 0,
            }),
        );

        expect(item.available).toBe(0);
        expect(item.position).toBe(0);
    });

    describe("applyMovement", () => {
        it("adds a positive movement to onHand", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({ onHand: 10 }),
            );

            const stockMovement = baseStockMovement({
                qty: 5,
                type: MovementType.ADJUSTMENT,
            });

            expect(item.applyMovement(stockMovement).onHand).toBe(15);
        });

        it("subtracts a negative movement from onHand", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({ onHand: 10 }),
            );

            const stockMovement = baseStockMovement({
                qty: -4,
                type: MovementType.ADJUSTMENT,
            });

            expect(item.applyMovement(stockMovement).onHand).toBe(6);
        });

        it("allows a movement that lands exactly at zero", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({ onHand: 10, reserved: 0 }),
            );

            const stockMovement = baseStockMovement({
                qty: -10,
                type: MovementType.ADJUSTMENT,
            });

            expect(item.applyMovement(stockMovement).onHand).toBe(0);
        });

        it("recomputes available and position after a movement", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({
                    onHand: 10,
                    reserved: 3,
                    onOrder: 5,
                    backordered: 2,
                }),
            );

            const stockMovement = baseStockMovement({
                qty: 4,
                type: MovementType.ADJUSTMENT,
            });

            const updatedItem = item.applyMovement(stockMovement);

            expect(updatedItem.available).toBe(11);
            expect(updatedItem.position).toBe(17);
            expect(updatedItem.onOrder).toBe(5);
            expect(updatedItem.backordered).toBe(2);
        });

        it("returns a new instance and leaves the original unchanged", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({ onHand: 10 }),
            );

            const stockMovement = baseStockMovement({
                qty: 5,
                type: MovementType.ADJUSTMENT,
            });

            const updatedItem = item.applyMovement(stockMovement);

            expect(updatedItem).not.toBe(item);
            expect(item.onHand).toBe(10);
        });

        it("rejects a movement that would leave onHand negative", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({ onHand: 10, reserved: 0 }),
            );

            const stockMovement = baseStockMovement({
                qty: -15,
                type: MovementType.ADJUSTMENT,
            });

            expect(() => item.applyMovement(stockMovement)).toThrow(
                InsufficientStockError,
            );
        });

        it("rejects a movement that would leave reserved greater than onHand", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({ onHand: 10, reserved: 5 }),
            );

            const stockMovement = baseStockMovement({
                qty: -6,
                type: MovementType.ADJUSTMENT,
            });

            expect(() => item.applyMovement(stockMovement)).toThrow(
                InsufficientStockError,
            );
        });

        it("rejects a movement with a mismatched productId", () => {
            const item = InventoryItem.create(
                baseInventoryItemProps({
                    productId: productId(
                        "0192f8a0-0000-7000-8000-000000000000",
                    ),
                }),
            );

            const stockMovement = baseStockMovement({
                productId: productId("0192f8a0-0000-7000-8000-000000000001"),
            });

            expect(() => item.applyMovement(stockMovement)).toThrow(
                InvalidMovementError,
            );
        });
    });
});
