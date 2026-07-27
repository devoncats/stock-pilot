import type { Page, PageParams } from "@stock-pilot/shared";
import type { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import type { ProductId } from "@/shared/domain/product-id/product-id.js";

export type ListByProductQueryParams = PageParams;

export interface StockMovementRepository {
    append(movement: StockMovement): Promise<void>;
    listByProduct(
        productId: ProductId,
        params: ListByProductQueryParams,
    ): Promise<Page<StockMovement>>;
    sumQtyByProduct(productId: ProductId): Promise<number>;
}

export const STOCK_MOVEMENT_REPOSITORY = Symbol("StockMovementRepository");
