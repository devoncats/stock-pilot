import { describe, expect, it } from "vitest";
import { Sku } from "./sku.js";

describe("Sku", () => {
    it("wraps a value", () => {
        expect(Sku.create("ABC-123").value).toBe("ABC-123");
    });

    it("trims and uppercases a value", () => {
        expect(Sku.create("     abc-123     ").value).toBe("ABC-123");
    });

    it("rejects an empty value or whitespace-only", () => {
        expect(() => Sku.create("")).toThrow();
        expect(() => Sku.create("     ")).toThrow();
    });

    it("compares by normalized value", () => {
        expect(Sku.create("abc-123").equals(Sku.create("ABC-123"))).toBe(true);
        expect(Sku.create("abc-123").equals(Sku.create("xyz-123"))).toBe(false);
    });
});
