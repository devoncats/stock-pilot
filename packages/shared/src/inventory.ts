import type { MovementType } from "./movement-type.js";
import type { ReferenceType } from "./reference-type.js";

export interface InventoryPositionDto {
    productId: string;
    sku: string;
    name: string;
    onHand: number;
    reserved: number;
    /** Derived via the shared `derivePosition` function: onHand - reserved. */
    available: number;
    onOrder: number;
    backordered: number;
    /** Derived via the shared `derivePosition` function: onHand + onOrder - backordered. */
    position: number;
    unitCostCents: number;
    /** onHand × unitCost, in integer cents. */
    valueCents: number;
    /** `null` when there is no demand history to compute coverage from. */
    coverageWeeks: number | null;
}

export interface StockMovementDto {
    id: string;
    type: MovementType;
    signedQty: number;
    /** ISO date of the Monday of the movement's week. */
    week: string;
    referenceType: ReferenceType;
    referenceId: string | null;
    reason: string | null;
    createdAt: string;
}

export interface InventoryKpisDto {
    totalSkus: number;
    inventoryValueCents: number;
    /** `null` when no SKU in the catalogue has demand history. */
    averageCoverageWeeks: number | null;
    skusOutOfStock: number;
}

export interface Paginated<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
}
