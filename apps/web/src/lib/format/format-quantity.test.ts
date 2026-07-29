import { describe, expect, it } from "vitest";
import { formatQuantity } from "./format-quantity";

describe("formatQuantity", () => {
    it("formats zero", () => {
        expect(formatQuantity(0)).toBe("0");
    });

    it("adds thousands separators", () => {
        expect(formatQuantity(1234567)).toBe("1,234,567");
    });

    it("formats a negative quantity", () => {
        expect(formatQuantity(-42)).toBe("-42");
    });
});
