import type { InventoryItem } from "@/generated/prisma/client.js";
import type { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";

export interface InventoryItemRepository {
    findByProductId(productId: ProductId): Promise<InventoryItem | null>;
    fundByProductIdForUpdate(
        productId: ProductId,
    ): Promise<InventoryItem | null>;
    save(inventoryItem: InventoryItem): Promise<void>;
}

export const INVENTORY_ITEM_REPOSITORY = Symbol("InventoryItemRepository");
