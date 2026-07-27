import type { Page } from "@stock-pilot/shared";
import type { StockMovement } from "@/generated/prisma/client.js";
import type { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { ListByProductQueryDto } from "@/modules/inventory/adapter/http/dto/list-by-product-query.dto.js";

export interface StockMovementRepository {
    append(movement: StockMovement): Promise<void>;
    listByProduct(
        productId: ProductId,
        params: ListByProductQueryDto,
    ): Promise<Page<StockMovement>>;
    sumQtyByProduct(productId: ProductId): Promise<number>;
}

export const STOCK_MOVEMENT_REPOSITORY = Symbol("StockMovementRepository");
