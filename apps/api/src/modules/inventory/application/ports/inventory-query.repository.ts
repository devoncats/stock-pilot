import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Page,
    StockMovementDto,
} from "@stock-pilot/shared";
import { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { ListMovementsQueryDto } from "@/modules/inventory/adapter/http/dto/list-movements-query.dto.js";
import { ListPositionsQueryDto } from "@/modules/inventory/adapter/http/dto/list-positions-query.dto.js";

export interface InventoryQuery {
    findPosition(productId: ProductId): Promise<InventoryPositionDto | null>;

    listPositions(
        params: ListPositionsQueryDto,
    ): Promise<Page<InventoryPositionDto>>;

    listMovements(
        productId: ProductId,
        params: ListMovementsQueryDto,
    ): Promise<Page<StockMovementDto>>;

    inventoryKpis(): Promise<InventoryKpisDto>;
}

export const INVENTORY_QUERY_REPOSITORY = Symbol("InventoryQueryRepository");
