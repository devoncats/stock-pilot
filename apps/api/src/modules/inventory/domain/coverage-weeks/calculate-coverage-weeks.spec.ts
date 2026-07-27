import { describe, expect, it } from "vitest";
import { calculateCoverageWeeks } from "./calculate-coverage-weeks.js";

describe("calculateCoverageWeeks", () => {
    it("divides position by average weekly demand", () => {
        expect(
            calculateCoverageWeeks({ position: 100, averageWeeklyDemand: 25 }),
        ).toBe(4);
    });

    it("rounds to two decimal places", () => {
        expect(
            calculateCoverageWeeks({ position: 10, averageWeeklyDemand: 3 }),
        ).toBe(3.33);
    });

    it("returns null when average weekly demand is 0 (never Infinity)", () => {
        expect(
            calculateCoverageWeeks({ position: 100, averageWeeklyDemand: 0 }),
        ).toBeNull();
    });

    it("returns null when there is no demand history at all", () => {
        expect(
            calculateCoverageWeeks({
                position: 100,
                averageWeeklyDemand: null,
            }),
        ).toBeNull();
    });

    it("returns 0 when position is 0 but there is demand (not null, not falsely healthy)", () => {
        expect(
            calculateCoverageWeeks({ position: 0, averageWeeklyDemand: 10 }),
        ).toBe(0);
    });

    it("supports a negative position (backordered beyond on-order)", () => {
        expect(
            calculateCoverageWeeks({ position: -10, averageWeeklyDemand: 5 }),
        ).toBe(-2);
    });
});
