import { describe, expect, it } from "vitest";
import { InventoryItemNotFoundError } from "@/modules/inventory/domain/errors/inventory-item-not-found/inventory-item-not-found.error.js";
import { DomainError } from "@/shared/domain/errors/domain.error.js";

describe("InventoryItemNotFoundError", () => {
    it("is a domain error", () => {
        const error = new InventoryItemNotFoundError(
            "Inventory item not found",
        );

        expect(error).toBeInstanceOf(DomainError);
    });

    it("carries a stable machine-readable code", () => {
        const error = new InventoryItemNotFoundError(
            "Inventory item not found",
        );

        expect(error.code).toBe("INVENTORY_ITEM_NOT_FOUND");
    });
});
