import { Injectable } from "@nestjs/common";
import type { Page } from "@stock-pilot/shared";
import type { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { StockMovementMapper } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement.mapper.js";
import type {
    ListByProductQueryParams,
    StockMovementRepository,
} from "@/modules/inventory/application/commands/ports/stock-movement.repository.js";
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

    async listByProduct(
        productId: ProductId,
        params: ListByProductQueryParams,
    ): Promise<Page<StockMovement>> {
        const client = this.context.getClient();
        const where = { productId };

        const rows = await client.stockMovement.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: params.offset,
            take: params.limit,
        });

        const total = await client.stockMovement.count({ where });

        return {
            data: rows.map(StockMovementMapper.toDomain),
            offset: params.offset,
            limit: params.limit,
            total,
        };
    }

    async sumQtyByProduct(productId: ProductId): Promise<number> {
        const result = await this.context.getClient().stockMovement.aggregate({
            where: { productId },
            _sum: { signedQty: true },
        });

        return result._sum.signedQty ?? 0;
    }
}
