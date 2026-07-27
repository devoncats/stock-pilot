import { describe, expect, it } from "vitest";
import {
    COVERAGE_WINDOW_WEEKS,
    coverageWindowStart,
} from "@/modules/inventory/domain/coverage-weeks/coverage-window.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

describe("coverageWindowStart", () => {
    it("returns the Monday 12 weeks before the anchor", () => {
        const start = coverageWindowStart(new Date("2026-01-05T00:00:00Z"));

        expect(start.toISOString()).toBe("2025-10-13T00:00:00.000Z");
    });

    it("spans exactly COVERAGE_WINDOW_WEEKS Mondays, anchor included", () => {
        const anchor = new Date("2026-01-05T00:00:00Z");

        const start = coverageWindowStart(anchor);
        const mondays = (anchor.getTime() - start.getTime()) / MS_PER_WEEK + 1;

        expect(mondays).toBe(COVERAGE_WINDOW_WEEKS);
    });

    it("lands on a Monday across a leap day and a year boundary", () => {
        const start = coverageWindowStart(new Date("2024-03-04T00:00:00Z"));

        expect(start.toISOString()).toBe("2023-12-11T00:00:00.000Z");
        expect(start.getUTCDay()).toBe(1);
    });

    it("does not mutate the anchor", () => {
        const anchor = new Date("2026-01-05T00:00:00Z");

        coverageWindowStart(anchor);

        expect(anchor.toISOString()).toBe("2026-01-05T00:00:00.000Z");
    });

    it("throws InvalidValueError for an invalid date", () => {
        expect(() => coverageWindowStart(new Date("not a date"))).toThrow(
            InvalidValueError,
        );
    });
});
