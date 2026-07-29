import { describe, expect, it } from "vitest";
import { DEFAULT_DIR, DEFAULT_SORT, parseDir, parseSort } from "./sort";

describe("parseSort", () => {
    it("defaults when absent", () => {
        expect(parseSort(undefined)).toBe(DEFAULT_SORT);
    });

    it.each(["sku", "onHand", "value"])("accepts %o", (raw) => {
        expect(parseSort(raw)).toBe(raw);
    });

    it("falls back for a value outside the API's allow-list", () => {
        expect(parseSort("banana")).toBe(DEFAULT_SORT);
    });

    it("is case sensitive, matching the API", () => {
        expect(parseSort("SKU")).toBe(DEFAULT_SORT);
    });

    it("takes the first value when repeated", () => {
        expect(parseSort(["value", "sku"])).toBe("value");
    });
});

describe("parseDir", () => {
    it("defaults when absent", () => {
        expect(parseDir(undefined)).toBe(DEFAULT_DIR);
    });

    it.each(["asc", "desc"])("accepts %o", (raw) => {
        expect(parseDir(raw)).toBe(raw);
    });

    it("falls back for an unknown direction", () => {
        expect(parseDir("sideways")).toBe(DEFAULT_DIR);
    });
});
