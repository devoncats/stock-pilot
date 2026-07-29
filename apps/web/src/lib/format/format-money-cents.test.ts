import { describe, expect, it } from "vitest";
import { formatMoneyCents } from "./format-money-cents";

describe("formatMoneyCents", () => {
    it("formats zero", () => {
        expect(formatMoneyCents(0)).toBe("$0.00");
    });

    it("formats dollars and cents with thousands separators", () => {
        expect(formatMoneyCents(123456)).toBe("$1,234.56");
    });

    it("puts the sign outside the currency symbol for negatives", () => {
        expect(formatMoneyCents(-500)).toBe("-$5.00");
    });

    it("keeps sub-dollar amounts exact", () => {
        expect(formatMoneyCents(1)).toBe("$0.01");
        expect(formatMoneyCents(10)).toBe("$0.10");
    });

    it("formats a catalogue-sized total without drift", () => {
        expect(formatMoneyCents(43_877_527)).toBe("$438,775.27");
    });
});
