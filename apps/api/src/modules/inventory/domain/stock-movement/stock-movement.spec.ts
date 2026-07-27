import { describe, expect, it } from "vitest";
import { MovementType } from "@/generated/prisma/enums.js";
import { productId } from "@/modules/catalog/domain/product-id/product-id.js";
import { InvalidMovementError } from "@/modules/inventory/domain/errors/invalid-movement/invalid-movement.error.js";
import { MovementReference } from "@/modules/inventory/domain/movement-reference/movement-reference.js";
import {
    StockMovement,
    type StockMovementProps,
} from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { stockMovementId } from "@/modules/inventory/domain/stock-movement-id/stock-movement-id.js";

const MOVEMENT_ID = stockMovementId("0192f8a0-0000-7000-8000-000000000010");
const PRODUCT_ID = productId("0192f8a0-0000-7000-8000-000000000000");
const PO_ID = "0192f8a0-0000-7000-8000-000000000001";

const base = (
    overrides: Partial<StockMovementProps> = {},
): StockMovementProps => ({
    id: MOVEMENT_ID,
    productId: PRODUCT_ID,
    type: MovementType.RECEIPT,
    qty: 10,
    reference: MovementReference.purchaseOrder(PO_ID),
    reason: null,
    occurredAt: new Date("2026-07-22T12:00:00Z"),
    ...overrides,
});

describe("StockMovement", () => {
    it("exposes what it was created with", () => {
        const movement = StockMovement.create(base());

        expect(movement.id).toBe(base().id);
        expect(movement.productId).toBe(base().productId);
        expect(movement.type).toBe(base().type);
        expect(movement.qty).toBe(base().qty);
        expect(movement.reference.type).toBe(base().reference.type);
        expect(movement.reference.id).toBe(base().reference.id);
        expect(movement.reason).toBeNull();
        expect(movement.occurredAt.toISOString()).toBe(
            base().occurredAt.toISOString(),
        );
    });

    it("derives the ISO week from the occurredAt date", () => {
        const movement = StockMovement.create(
            base({ occurredAt: new Date("2026-07-22T12:00:00Z") }),
        );

        expect(movement.week.toString()).toBe("2026-07-20");
    });

    it("rejects a zero quantity", () => {
        expect(() => StockMovement.create(base({ qty: 0 }))).toThrow(
            InvalidMovementError,
        );
    });

    it("rejects a non-integer quantity", () => {
        expect(() => StockMovement.create(base({ qty: 1.5 }))).toThrow(
            InvalidMovementError,
        );
    });

    it("rejects a RECEIPT with a negative quantity", () => {
        expect(() =>
            StockMovement.create(base({ type: MovementType.RECEIPT, qty: -1 })),
        ).toThrow(InvalidMovementError);
    });

    it("rejects a SHIPMENT with a positive quantity", () => {
        expect(() =>
            StockMovement.create(base({ type: MovementType.SHIPMENT, qty: 1 })),
        ).toThrow(InvalidMovementError);
    });

    it("accepts an ADJUSTMENT in either direction", () => {
        const adjustment = (qty: number) =>
            StockMovement.create(
                base({
                    type: MovementType.ADJUSTMENT,
                    qty,
                    reference: MovementReference.manual(),
                    reason: "Damaged in handling",
                }),
            );

        expect(adjustment(5).qty).toBe(5);
        expect(adjustment(-5).qty).toBe(-5);
    });

    it("rejects an ADJUSTMENT without a reason", () => {
        expect(() =>
            StockMovement.create(
                base({
                    type: MovementType.ADJUSTMENT,
                    qty: 5,
                    reference: MovementReference.manual(),
                    reason: null,
                }),
            ),
        ).toThrow(InvalidMovementError);
    });

    it("rejects an ADJUSTMENT whose reason is whitespace only", () => {
        expect(() =>
            StockMovement.create(
                base({
                    type: MovementType.ADJUSTMENT,
                    qty: 5,
                    reference: MovementReference.manual(),
                    reason: "   ",
                }),
            ),
        ).toThrow(InvalidMovementError);
    });

    it("trims the reason and normalises a blank reason to null", () => {
        const receipt = (reason: string) =>
            StockMovement.create(
                base({
                    type: MovementType.RECEIPT,
                    qty: 10,
                    reference: MovementReference.purchaseOrder(PO_ID),
                    reason: reason,
                }),
            );

        expect(receipt("  Damaged in handling  ").reason).toBe(
            "Damaged in handling",
        );
        expect(receipt("   ").reason).toBeNull();
    });

    it("rejects an invalid occurredAt date", () => {
        expect(() =>
            StockMovement.create(
                base({ occurredAt: new Date("invalid-date-string") }),
            ),
        ).toThrow(InvalidMovementError);
    });

    it("does not expose a mutable occurredAt date", () => {
        const movement = StockMovement.create(base());
        movement.occurredAt.setUTCFullYear(2000);

        expect(movement.occurredAt.toISOString()).toBe(
            base().occurredAt.toISOString(),
        );
    });
});
