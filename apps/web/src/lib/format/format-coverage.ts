/**
 * Weeks of cover as a display string.
 *
 * `null` means the API could not compute coverage — no demand history in
 * the window (F1-03) — and renders as an em dash. A real `0` means zero
 * weeks of stock and renders as `"0 wk"`. Collapsing the two would report
 * "no data" and "out of cover" identically, which is the bug this rule
 * exists to prevent.
 */
export function formatCoverage(weeks: number | null): string {
    if (weeks === null) {
        return "—";
    }

    const value = weeks.toLocaleString("en-US", { maximumFractionDigits: 1 });

    return `${value} wk`;
}
