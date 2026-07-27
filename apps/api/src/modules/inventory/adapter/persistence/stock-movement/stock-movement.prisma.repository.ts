import { Injectable } from "@nestjs/common";
import { StockMovementMapper } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement.mapper.js";
import type { StockMovementRepository } from "@/modules/inventory/application/commands/ports/stock-movement.repository.js";
import type { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { TransactionContext } from "@/shared/transaction-context.js";

@Injectable()
export class PrismaStockMovementRepository implements StockMovementRepository {
    constructor(private readonly context: TransactionContext) {}

    async append(movement: StockMovement): Promise<void> {
        await this.context.getClient().stockMovement.create({
            data: StockMovementMapper.toPersistence(movement),
        });
    }
}
