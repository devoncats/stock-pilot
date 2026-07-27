import { Inject, Injectable } from "@nestjs/common";
import type { MovementType, ReferenceType } from "@stock-pilot/shared";
import { productId } from "@/modules/catalog/domain/product-id/product-id.js";
import {
    ID_GENERATOR,
    type IdGenerator,
} from "@/modules/inventory/application/commands/ports/id-generator.js";
import {
    INVENTORY_ITEM_REPOSITORY,
    type InventoryItemRepository,
} from "@/modules/inventory/application/commands/ports/inventory-item.repository.js";
import {
    STOCK_MOVEMENT_REPOSITORY,
    type StockMovementRepository,
} from "@/modules/inventory/application/commands/ports/stock-movement.repository.js";
import { InventoryItemNotFoundError } from "@/modules/inventory/domain/errors/inventory-item-not-found/inventory-item-not-found.error.js";
import { MovementReference } from "@/modules/inventory/domain/movement-reference/movement-reference.js";
import { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { stockMovementId } from "@/modules/inventory/domain/stock-movement-id/stock-movement-id.js";
import { CLOCK, type Clock } from "@/shared/application/ports/clock.js";
import {
    TRANSACTION_MANAGER,
    type TransactionManager,
} from "@/shared/application/ports/transaction-manager.js";

export type RecordStockMovementInput = {
    productId: string;
    type: MovementType;
    qty: number;
    reference: { type: ReferenceType; id?: string };
    reason?: string;
};

export interface RecordStockMovementResult {
    movementId: string;
    onHand: number;
    available: number;
    position: number;
}

@Injectable()
export class RecordStockMovement {
    constructor(
        @Inject(INVENTORY_ITEM_REPOSITORY)
        private readonly items: InventoryItemRepository,
        @Inject(STOCK_MOVEMENT_REPOSITORY)
        private readonly movements: StockMovementRepository,
        @Inject(TRANSACTION_MANAGER)
        private readonly transactions: TransactionManager,
        @Inject(CLOCK)
        private readonly clock: Clock,
        @Inject(ID_GENERATOR)
        private readonly ids: IdGenerator,
    ) {}

    async execute(
        input: RecordStockMovementInput,
    ): Promise<RecordStockMovementResult> {
        const id = productId(input.productId);

        const movement = StockMovement.create({
            id: stockMovementId(this.ids.next()),
            productId: id,
            type: input.type,
            qty: input.qty,
            reference: MovementReference.create(
                input.reference.type,
                input.reference.id ?? null,
            ),
            reason: input.reason ?? null,
            occurredAt: this.clock.now(),
        });

        return this.transactions.runInTransaction(async () => {
            const item = await this.items.findByProductIdForUpdate(id);

            if (!item) {
                throw new InventoryItemNotFoundError(
                    `[RecordStockMovement]: No inventory item found for product ${input.productId}`,
                );
            }

            const updated = item.applyMovement(movement);

            await this.movements.append(movement);
            await this.items.save(updated);

            return {
                movementId: movement.id,
                onHand: updated.onHand,
                available: updated.available,
                position: updated.position,
            };
        });
    }
}
