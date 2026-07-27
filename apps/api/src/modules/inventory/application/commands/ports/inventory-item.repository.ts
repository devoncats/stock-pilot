import type { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";
import type { ProductId } from "@/shared/domain/product-id/product-id.js";

export interface InventoryItemRepository {
    findByProductIdForUpdate(
        productId: ProductId,
    ): Promise<InventoryItem | null>;
    save(inventoryItem: InventoryItem): Promise<void>;
}

export const INVENTORY_ITEM_REPOSITORY = Symbol("InventoryItemRepository");
