import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Paginated,
    StockMovementDto,
} from "@stock-pilot/shared";

export type ListPositionsSort = "sku" | "onHand" | "value";
export type SortDirection = "asc" | "desc";

export interface ListPositionsParams {
    search?: string;
    page: number;
    limit: number;
    sort?: ListPositionsSort;
    dir?: SortDirection;
}

export interface ListMovementsParams {
    page: number;
    limit: number;
}

export interface InventoryQuery {
    listPositions(
        params: ListPositionsParams,
    ): Promise<Paginated<InventoryPositionDto>>;

    findPosition(productId: string): Promise<InventoryPositionDto | null>;

    listMovements(
        productId: string,
        params: ListMovementsParams,
    ): Promise<Paginated<StockMovementDto>>;

    inventoryKpis(): Promise<InventoryKpisDto>;
}

export const INVENTORY_QUERY = Symbol("InventoryQuery");
