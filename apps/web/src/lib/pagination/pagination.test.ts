import { describe, expect, it } from "vitest";
import {
    DEFAULT_LIMIT,
    hasNextPage,
    hasPreviousPage,
    parseLimit,
    parsePage,
    toOffset,
    totalPages,
} from "./pagination";

describe("parsePage", () => {
    it("defaults to the first page when absent", () => {
        expect(parsePage(undefined)).toBe(1);
    });

    it("reads a valid page", () => {
        expect(parsePage("3")).toBe(3);
    });

    it.each(["0", "-2", "abc", "2.7", ""])(
        "falls back to page 1 for %o",
        (raw) => {
            expect(parsePage(raw)).toBe(1);
        },
    );

    it("takes the first value when the param is repeated", () => {
        expect(parsePage(["2", "9"])).toBe(2);
    });
});

describe("parseLimit", () => {
    it("defaults when absent", () => {
        expect(parseLimit(undefined)).toBe(DEFAULT_LIMIT);
    });

    it("reads a valid limit", () => {
        expect(parseLimit("50")).toBe(50);
    });

    it("clamps above the API maximum instead of sending a 400", () => {
        expect(parseLimit("101")).toBe(100);
        expect(parseLimit("999999")).toBe(100);
    });

    it.each(["0", "-1", "abc", ""])("falls back for %o", (raw) => {
        expect(parseLimit(raw)).toBe(DEFAULT_LIMIT);
    });
});

describe("toOffset", () => {
    it("maps page 1 to offset 0", () => {
        expect(toOffset(1, 25)).toBe(0);
    });

    it("maps page 3 to the third block", () => {
        expect(toOffset(3, 25)).toBe(50);
    });
});

describe("totalPages", () => {
    it("rounds up a partial last page", () => {
        expect(totalPages(52, 25)).toBe(3);
    });

    it("is exact when the total divides evenly", () => {
        expect(totalPages(50, 25)).toBe(2);
    });

    it("reports one page when there are no results, so page 1 stays valid", () => {
        expect(totalPages(0, 25)).toBe(1);
    });
});

describe("page boundaries", () => {
    it("has no previous page on page 1", () => {
        expect(hasPreviousPage(1)).toBe(false);
        expect(hasPreviousPage(2)).toBe(true);
    });

    it("has no next page on the last page", () => {
        expect(hasNextPage(3, 52, 25)).toBe(false);
        expect(hasNextPage(2, 52, 25)).toBe(true);
    });

    it("has no next page when there are no results", () => {
        expect(hasNextPage(1, 0, 25)).toBe(false);
    });
});
