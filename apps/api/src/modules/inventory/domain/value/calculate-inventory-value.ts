export interface InventoryValueLine {
    onHand: number;
    unitCostCents: number;
}

/**
 * `inventoryValue = Σ (onHand × unitCost)`, in integer cents throughout.
 * Money never travels as a float in this domain — see `Money` (F0-03).
 */
export function calculateInventoryValue(items: InventoryValueLine[]): number {
    return items.reduce(
        (sum, item) => sum + item.onHand * item.unitCostCents,
        0,
    );
}
