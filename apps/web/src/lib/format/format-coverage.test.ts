import { describe, expect, it } from "vitest";
import { formatCoverage } from "./format-coverage";

describe("formatCoverage", () => {
    it("renders null as an em dash", () => {
        expect(formatCoverage(null)).toBe("—");
    });

    it("renders a real zero explicitly, not as the null dash", () => {
        expect(formatCoverage(0)).toBe("0 wk");
    });

    it("renders one decimal place when there is a fraction", () => {
        expect(formatCoverage(2.5)).toBe("2.5 wk");
    });

    it("drops a trailing zero on whole weeks", () => {
        expect(formatCoverage(4)).toBe("4 wk");
    });

    it("rounds to one decimal place", () => {
        expect(formatCoverage(3.33)).toBe("3.3 wk");
        expect(formatCoverage(3.35)).toBe("3.4 wk");
    });

    it("renders negative coverage", () => {
        expect(formatCoverage(-2)).toBe("-2 wk");
    });
});
