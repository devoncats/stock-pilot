import { describe, expect, it } from "vitest";
import { firstValue } from "./search-params";

describe("firstValue", () => {
    it("passes a single value through", () => {
        expect(firstValue("2")).toBe("2");
    });

    it("takes the first of a repeated param", () => {
        expect(firstValue(["2", "9"])).toBe("2");
    });

    it("returns undefined when absent", () => {
        expect(firstValue(undefined)).toBeUndefined();
    });

    it("returns undefined for an empty repeated param", () => {
        expect(firstValue([])).toBeUndefined();
    });
});
