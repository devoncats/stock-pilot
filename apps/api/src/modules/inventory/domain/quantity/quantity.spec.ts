import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";
import { Quantity } from "./quantity.js";

describe("Quantity", () => {
    it("accepts zero", () => {
        const quantity = Quantity.create(0);

        expect(quantity.value).toBe(0);
    });

    it("accepts positive integers", () => {
        const quantity = Quantity.create(5);

        expect(quantity.value).toBe(5);
    });

    it("rejects negative integers", () => {
        expect(() => Quantity.create(-1)).toThrow(InvalidValueError);
    });

    it("rejects non-integer numbers", () => {
        expect(() => Quantity.create(1.5)).toThrow(InvalidValueError);
    });

    it("rejects NaN and Infinity", () => {
        expect(() => Quantity.create(Number.NaN)).toThrow(InvalidValueError);
        expect(() => Quantity.create(Number.POSITIVE_INFINITY)).toThrow(
            InvalidValueError,
        );
    });

    it("compares by value", () => {
        const quantity1 = Quantity.create(5);
        const quantity2 = Quantity.create(5);
        const quantity3 = Quantity.create(10);

        expect(quantity1.equals(quantity2)).toBe(true);
        expect(quantity1.equals(quantity3)).toBe(false);
    });
});
