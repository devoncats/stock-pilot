import { describe, expect, it } from "vitest";
import { calculateAverageWeeklyDemand } from "@/modules/inventory/domain/average-weekly-demand/calculate-average-weekly-demand.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

describe("calculateAverageWeeklyDemand", () => {
    it("divides by the window, not by the number of weeks with demand", () => {
        const result = calculateAverageWeeklyDemand({
            totalQty: 200,
            windowWeeks: 13,
        });

        expect(result).toBeCloseTo(15.3846, 4);
    });

    it("returns 0 if totalQty is 0", () => {
        const result = calculateAverageWeeklyDemand({
            totalQty: 0,
            windowWeeks: 13,
        });

        expect(result).toBe(0);
    });

    it("returns the raw quotient; rounding belongs to calculateCoverageWeeks", () => {
        const result = calculateAverageWeeklyDemand({
            totalQty: 1,
            windowWeeks: 3,
        });

        expect(result).toBe(1 / 3);
    });

    it("throws InvalidValueError if windowWeeks is 0", () => {
        expect(() =>
            calculateAverageWeeklyDemand({
                totalQty: 200,
                windowWeeks: 0,
            }),
        ).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError if windowWeeks is negative", () => {
        expect(() =>
            calculateAverageWeeklyDemand({
                totalQty: 200,
                windowWeeks: -1,
            }),
        ).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError if windowWeeks is not an integer", () => {
        expect(() =>
            calculateAverageWeeklyDemand({
                totalQty: 200,
                windowWeeks: 1.5,
            }),
        ).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError if totalQty is negative", () => {
        expect(() =>
            calculateAverageWeeklyDemand({
                totalQty: -5,
                windowWeeks: 13,
            }),
        ).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError if totalQty is not an integer", () => {
        expect(() =>
            calculateAverageWeeklyDemand({ totalQty: 1.5, windowWeeks: 13 }),
        ).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError if totalQty is NaN", () => {
        expect(() =>
            calculateAverageWeeklyDemand({
                totalQty: Number.NaN,
                windowWeeks: 13,
            }),
        ).toThrow(InvalidValueError);
    });
});
