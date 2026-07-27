import { ReferenceType } from "@stock-pilot/shared";
import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";
import { MovementReference } from "./movement-reference.js";

const PO_ID = "0192f8a0-0000-7000-8000-000000000001";

describe("MovementReference", () => {
    it("builds a manual reference without an id", () => {
        const reference = MovementReference.manual();

        expect(reference.type).toBe(ReferenceType.MANUAL);
        expect(reference.id).toBeNull();
    });

    it("builds a purchase order reference", () => {
        const reference = MovementReference.purchaseOrder(PO_ID);

        expect(reference.type).toBe(ReferenceType.PURCHASE_ORDER);
        expect(reference.id).toBe(PO_ID);
    });

    it("builds a customer order reference", () => {
        const reference = MovementReference.customerOrder(PO_ID);

        expect(reference.type).toBe(ReferenceType.CUSTOMER_ORDER);
        expect(reference.id).toBe(PO_ID);
    });

    it("rejects a manual reference carrying an id", () => {
        expect(() =>
            MovementReference.create(ReferenceType.MANUAL, PO_ID),
        ).toThrow(InvalidValueError);
    });

    it("rejects a purchase order reference without an id", () => {
        expect(() =>
            MovementReference.create(ReferenceType.PURCHASE_ORDER, null),
        ).toThrow(InvalidValueError);
    });

    it("rejects a whitespace-only id", () => {
        expect(() =>
            MovementReference.create(ReferenceType.PURCHASE_ORDER, "   "),
        ).toThrow(InvalidValueError);
    });

    it("rebuilds from persisted columns", () => {
        const createdReference = MovementReference.create(
            ReferenceType.PURCHASE_ORDER,
            PO_ID,
        );

        const purchaseOrderReference = MovementReference.purchaseOrder(PO_ID);

        expect(createdReference.equals(purchaseOrderReference)).toBe(true);
    });

    it("compares by type and id", () => {
        expect(
            MovementReference.manual().equals(MovementReference.manual()),
        ).toBe(true);

        expect(
            MovementReference.purchaseOrder(PO_ID).equals(
                MovementReference.customerOrder(PO_ID),
            ),
        ).toBe(false);
    });
});
