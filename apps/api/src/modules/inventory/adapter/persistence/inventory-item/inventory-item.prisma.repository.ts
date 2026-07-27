import { Inject, Injectable } from "@nestjs/common";
import { InventoryItemMapper } from "@/modules/inventory/adapter/persistence/inventory-item/inventory-item.mapper.js";
import type { InventoryItemRepository } from "@/modules/inventory/application/commands/ports/inventory-item.repository.js";
import type { InventoryItem } from "@/modules/inventory/domain/inventory-item/inventory-item.js";
import { CLOCK, type Clock } from "@/shared/application/ports/clock.js";
import type { ProductId } from "@/shared/domain/product-id/product-id.js";
import { TransactionContext } from "@/shared/transaction-context.js";

@Injectable()
export class PrismaInventoryItemRepository implements InventoryItemRepository {
    constructor(
        private readonly context: TransactionContext,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    async findByProductIdForUpdate(
        productId: ProductId,
    ): Promise<InventoryItem | null> {
        const client = this.context.requireTransaction();

        const locked = await client.$queryRaw<{ product_id: string }[]>`
            SELECT product_id
            FROM inventory_items
            WHERE product_id = ${productId}::uuid
            FOR UPDATE
        `;

        if (locked.length === 0) {
            return null;
        }

        const row = await client.inventoryItem.findUnique({
            where: { productId },
        });

        return row ? InventoryItemMapper.toDomain(row) : null;
    }

    async save(inventoryItem: InventoryItem): Promise<void> {
        await this.context.getClient().inventoryItem.update({
            where: { productId: inventoryItem.productId },
            data: {
                ...InventoryItemMapper.toPersistence(inventoryItem),
                updatedAt: this.clock.now(),
            },
        });
    }
}
