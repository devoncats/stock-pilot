/**
 * Mean of the non-null coverage values across the catalogue. A `null`
 * coverage means "unknown", not "zero coverage" — including it as 0 would
 * drag the average down and misrepresent SKUs that simply have no demand
 * history yet. `null` in, `null` out only when nothing is left to average.
 */
export function averageCoverageWeeks(
    coverageWeeks: Array<number | null>,
): number | null {
    const known = coverageWeeks.filter(
        (weeks): weeks is number => weeks !== null,
    );

    if (known.length === 0) {
        return null;
    }

    const mean = known.reduce((sum, weeks) => sum + weeks, 0) / known.length;

    return Math.round(mean * 100) / 100;
}

/**
 * Count of SKUs currently at `onHand === 0`.
 */
export function skusOutOfStock(items: Array<{ onHand: number }>): number {
    return items.filter((item) => item.onHand === 0).length;
}
