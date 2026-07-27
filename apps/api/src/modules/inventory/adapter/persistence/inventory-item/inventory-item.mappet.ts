import { Prisma } from "@/generated/prisma/client.js";
import type { InventoryItemModel } from "@/generated/prisma/models.js";
import { productId } from "@/modules/catalog/domain/product-id/product-id.js";
import { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";

export const IventoryItemMapper = {
    toPersistence(
        inventoryItem: InventoryItem,
    ): Prisma.InventoryItemUncheckedCreateInput {
        return {
            productId: inventoryItem.productId,
            onHand: inventoryItem.onHand,
            reserved: inventoryItem.reserved,
            onOrder: inventoryItem.onOrder,
            backordered: inventoryItem.backordered,
        };
    },
    toDomain(row: InventoryItemModel): InventoryItem {
        return InventoryItem.create({
            productId: productId(row.productId),
            onHand: row.onHand,
            reserved: row.reserved,
            onOrder: row.onOrder,
            backordered: row.backordered,
        });
    },
};
