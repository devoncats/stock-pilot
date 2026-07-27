import type { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";

export interface StockMovementRepository {
    append(movement: StockMovement): Promise<void>;
}

export const STOCK_MOVEMENT_REPOSITORY = Symbol("StockMovementRepository");
