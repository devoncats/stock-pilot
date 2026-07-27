export type StockMovementId = string & { readonly __brand: "StockMovementId" };

export function stockMovementId(value: string): StockMovementId {
    return value as StockMovementId;
}
