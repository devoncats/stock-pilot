import { describe, expect, it } from "vitest";
import { averageCoverageWeeks, skusOutOfStock } from "./aggregate-kpis.js";

describe("averageCoverageWeeks", () => {
    it("averages the non-null coverage values", () => {
        expect(averageCoverageWeeks([2, 4, 6])).toBe(4);
    });

    it("ignores nulls instead of treating them as 0", () => {
        // If null were treated as 0 this would average to 3, not 6.
        expect(averageCoverageWeeks([6, null, null])).toBe(6);
    });

    it("returns null when every SKU has null coverage", () => {
        expect(averageCoverageWeeks([null, null])).toBeNull();
    });

    it("returns null for an empty catalogue", () => {
        expect(averageCoverageWeeks([])).toBeNull();
    });

    it("rounds to two decimal places", () => {
        expect(averageCoverageWeeks([1, 2])).toBe(1.5);
        expect(averageCoverageWeeks([1, 1, 2])).toBe(1.33);
    });
});

describe("skusOutOfStock", () => {
    it("counts SKUs with onHand 0", () => {
        expect(
            skusOutOfStock([
                { onHand: 0 },
                { onHand: 5 },
                { onHand: 0 },
                { onHand: 12 },
            ]),
        ).toBe(2);
    });

    it("returns 0 for an empty catalogue", () => {
        expect(skusOutOfStock([])).toBe(0);
    });

    it("returns 0 when nothing is out of stock", () => {
        expect(skusOutOfStock([{ onHand: 1 }, { onHand: 2 }])).toBe(0);
    });
});
