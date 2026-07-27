import type { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import type { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";

export interface InventoryItemRepository {
    findByProductId(productId: ProductId): Promise<InventoryItem | null>;
    findByProductIdForUpdate(
        productId: ProductId,
    ): Promise<InventoryItem | null>;
    save(inventoryItem: InventoryItem): Promise<void>;
}

export const INVENTORY_ITEM_REPOSITORY = Symbol("InventoryItemRepository");
