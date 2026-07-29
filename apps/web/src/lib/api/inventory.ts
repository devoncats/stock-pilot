import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Page,
    StockMovementDto,
} from "@stock-pilot/shared";
import type { DirValue, SortValue } from "@/lib/sort/sort";
import { apiFetch } from "./api-fetch";

export interface ListPositionsRequest {
    search?: string | undefined;
    offset: number;
    limit: number;
    sort: SortValue;
    dir: DirValue;
}

export interface ListMovementsRequest {
    offset: number;
    limit: number;
}

export function fetchKpis(): Promise<InventoryKpisDto> {
    return apiFetch<InventoryKpisDto>("/kpis");
}

export function listPositions(
    request: ListPositionsRequest,
): Promise<Page<InventoryPositionDto>> {
    return apiFetch<Page<InventoryPositionDto>>("/inventory", { ...request });
}

export function findPosition(productId: string): Promise<InventoryPositionDto> {
    return apiFetch<InventoryPositionDto>(
        `/inventory/${encodeURIComponent(productId)}`,
    );
}

export function listMovements(
    productId: string,
    request: ListMovementsRequest,
): Promise<Page<StockMovementDto>> {
    return apiFetch<Page<StockMovementDto>>(
        `/inventory/${encodeURIComponent(productId)}/movements`,
        { ...request },
    );
}
