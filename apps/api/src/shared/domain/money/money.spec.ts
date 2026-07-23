import { describe, expect, it } from "vitest";
import { Money } from "./money.js";

describe("Money", () => {
    it("creates from cents", () => {
        expect(Money.fromCents(1999).cents).toBe(1999);
    });

    it("creates from a decimal string with no float error", () => {
        expect(Money.fromDecimalString("19.99").cents).toBe(1999);
    });

    it("round-trips a decimal string", () => {
        expect(Money.fromDecimalString("19.99").toDecimalString()).toBe(
            "19.99",
        );
    });

    it("handles whole and zero ammounts", () => {
        expect(Money.fromDecimalString("10").cents).toBe(1000);
        expect(Money.fromCents(0).toDecimalString()).toBe("0.00");
    });

    it("rejects negative amounts", () => {
        expect(() => Money.fromCents(-1)).toThrow();
        expect(() => Money.fromDecimalString("-5.00")).toThrow();
    });

    it("rejects a non-integer number of cents", () => {
        expect(() => Money.fromCents(19.99)).toThrow();
    });

    it("compares by value", () => {
        expect(
            Money.fromCents(1999).equals(Money.fromDecimalString("19.99")),
        ).toBe(true);
        expect(Money.fromCents(1999).equals(Money.fromCents(2000))).toBe(false);
    });
});
