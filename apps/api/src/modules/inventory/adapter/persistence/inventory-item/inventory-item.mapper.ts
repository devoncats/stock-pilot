import { Prisma } from "@/generated/prisma/client.js";
import type { InventoryItemModel } from "@/generated/prisma/models.js";
import { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";
import { productId } from "@/shared/domain/product-id/product-id.js";

export const InventoryItemMapper = {
    toPersistence(
        inventoryItem: InventoryItem,
    ): Omit<Prisma.InventoryItemUncheckedCreateInput, "productId"> {
        return {
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
