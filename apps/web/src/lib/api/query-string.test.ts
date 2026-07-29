import { describe, expect, it } from "vitest";
import { toQueryString } from "./query-string";

describe("toQueryString", () => {
    it("returns an empty string when nothing is set", () => {
        expect(toQueryString({})).toBe("");
    });

    it("serialises numbers and strings", () => {
        expect(toQueryString({ offset: 50, limit: 25 })).toBe(
            "?offset=50&limit=25",
        );
    });

    it("omits undefined instead of sending the literal 'undefined'", () => {
        expect(toQueryString({ offset: 0, sort: undefined })).toBe("?offset=0");
    });

    it("omits empty strings", () => {
        expect(toQueryString({ search: "", limit: 25 })).toBe("?limit=25");
    });

    it("keeps a zero, which is a meaningful offset", () => {
        expect(toQueryString({ offset: 0 })).toBe("?offset=0");
    });

    it("encodes values that would otherwise break the URL", () => {
        expect(toQueryString({ search: "blue widget" })).toBe(
            "?search=blue+widget",
        );
        expect(toQueryString({ search: "a&b=c" })).toBe("?search=a%26b%3Dc");
    });
});
