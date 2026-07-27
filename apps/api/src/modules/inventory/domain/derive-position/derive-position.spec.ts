import { describe, expect, it } from "vitest";
import { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";
import { productId } from "@/shared/domain/product-id/product-id.js";
import { derivePosition } from "./derive-position.js";

describe("derivePosition", () => {
    it("derives available as onHand - reserved", () => {
        expect(
            derivePosition({
                onHand: 10,
                reserved: 3,
                onOrder: 0,
                backordered: 0,
            }).available,
        ).toBe(7);
    });

    it("derives position as onHand + onOrder - backordered", () => {
        expect(
            derivePosition({
                onHand: 10,
                reserved: 0,
                onOrder: 5,
                backordered: 2,
            }).position,
        ).toBe(13);
    });

    it("handles the all-zero state", () => {
        expect(
            derivePosition({
                onHand: 0,
                reserved: 0,
                onOrder: 0,
                backordered: 0,
            }),
        ).toEqual({ available: 0, position: 0 });
    });

    it("matches exactly what InventoryItem computes (anchors both paths to one function)", () => {
        const props = {
            productId: productId("0192f8a0-0000-7000-8000-000000000000"),
            onHand: 42,
            reserved: 9,
            onOrder: 12,
            backordered: 4,
        };

        const item = InventoryItem.create(props);
        const derived = derivePosition(props);

        expect(item.available).toBe(derived.available);
        expect(item.position).toBe(derived.position);
    });
});
