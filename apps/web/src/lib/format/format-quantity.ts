/**
 * A raw count with thousands separators: on-hand, reserved, position, and
 * the signed quantities on stock movements.
 */
export function formatQuantity(qty: number): string {
    return qty.toLocaleString("en-US");
}
