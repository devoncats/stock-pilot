import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Page,
    PageParams,
    StockMovementDto,
} from "@stock-pilot/shared";
import type { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";

export const SORT_VALUES = ["sku", "onHand", "value"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const DIR_VALUES = ["asc", "desc"] as const;
export type DirValue = (typeof DIR_VALUES)[number];

export interface ListPositionsQueryParams extends PageParams {
    search?: string;
    sort?: SortValue;
    dir?: DirValue;
}

export type ListMovementsQueryParams = PageParams;

export interface InventoryQuery {
    findPosition(productId: ProductId): Promise<InventoryPositionDto | null>;

    listPositions(
        params: ListPositionsQueryParams,
    ): Promise<Page<InventoryPositionDto>>;

    listMovements(
        productId: ProductId,
        params: ListMovementsQueryParams,
    ): Promise<Page<StockMovementDto>>;

    inventoryKpis(): Promise<InventoryKpisDto>;
}

export const INVENTORY_QUERY_REPOSITORY = Symbol("InventoryQueryRepository");
