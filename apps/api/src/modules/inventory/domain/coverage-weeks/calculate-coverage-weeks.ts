export interface CalculateCoverageWeeksInput {
    position: number;
    /**
     * Mean of `demand_history` over the trailing 13-week window, or `null`
     * when the SKU has no demand history at all. Both that case and an
     * explicit `0` mean "no coverage can be computed" and resolve to
     * `coverageWeeks: null` — never `Infinity` (unrepresentable in JSON)
     * and never `0` (which would falsely claim no coverage).
     */
    averageWeeklyDemand: number | null;
}

/**
 * `coverageWeeks = position / averageWeeklyDemand`, rounded to 2 decimal
 * places. Coverage is reported in weeks, matching the ISO-week grain the
 * rest of the domain runs on (`coverageDays = coverageWeeks * 7` is the
 * UI's job, not this function's).
 */
export function calculateCoverageWeeks({
    position,
    averageWeeklyDemand,
}: CalculateCoverageWeeksInput): number | null {
    if (averageWeeklyDemand === null || averageWeeklyDemand === 0) {
        return null;
    }

    const weeks = position / averageWeeklyDemand;

    return Math.round(weeks * 100) / 100;
}
