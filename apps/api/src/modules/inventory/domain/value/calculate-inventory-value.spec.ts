import { describe, expect, it } from "vitest";
import { calculateInventoryValue } from "./calculate-inventory-value.js";

describe("calculateInventoryValue", () => {
    it("sums onHand * unitCostCents across items, in cents", () => {
        expect(
            calculateInventoryValue([
                { onHand: 10, unitCostCents: 250 },
                { onHand: 4, unitCostCents: 1999 },
            ]),
        ).toBe(10 * 250 + 4 * 1999);
    });

    it("returns 0 for an empty catalogue", () => {
        expect(calculateInventoryValue([])).toBe(0);
    });

    it("never produces a float (integer cents in, integer cents out)", () => {
        const result = calculateInventoryValue([
            { onHand: 3, unitCostCents: 333 },
        ]);

        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBe(999);
    });

    it("treats onHand 0 as contributing nothing", () => {
        expect(
            calculateInventoryValue([{ onHand: 0, unitCostCents: 5000 }]),
        ).toBe(0);
    });
});
