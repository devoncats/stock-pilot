import { describe, expect, it } from "vitest";
import { productId } from "../../../catalog/domain/product-id/product-id.js";
import { InventoryItem } from "./inventory-item.js";

const validProps = () => ({
    productId: productId("0192f8a0-0000-7000-8000-000000000000"),
    onHand: 10,
    reserved: 3,
    onOrder: 5,
    backordered: 2,
});

describe("InventoryItem", () => {
    it("rejects an empty product id", () => {
        expect(() =>
            InventoryItem.create({
                ...validProps(),
                productId: productId(""),
            }),
        ).toThrow();
    });

    it("derives available as onHand - reserved", () => {
        expect(
            InventoryItem.create({ ...validProps(), onHand: 10, reserved: 3 })
                .available,
        ).toBe(7);
    });

    it("derives position as onHand + onOrder - backordered", () => {
        expect(
            InventoryItem.create({
                ...validProps(),
                onHand: 10,
                onOrder: 5,
                backordered: 2,
            }).position,
        ).toBe(13);
    });

    it("rejects reserved greater than onHand", () => {
        expect(() =>
            InventoryItem.create({ ...validProps(), onHand: 5, reserved: 10 }),
        ).toThrow();
    });

    it("rejects negative quantities", () => {
        expect(() =>
            InventoryItem.create({ ...validProps(), onHand: -1 }),
        ).toThrow();
    });

    it("handles all-zero state", () => {
        const item = InventoryItem.create({
            productId: productId("0192f8a0-0000-7000-8000-000000000000"),
            onHand: 0,
            reserved: 0,
            onOrder: 0,
            backordered: 0,
        });

        expect(item.available).toBe(0);
        expect(item.position).toBe(0);
    });
});
