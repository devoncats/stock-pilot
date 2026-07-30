import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "./api-base-url";

describe("resolveApiBaseUrl", () => {
    it("prefers the server-only API_URL", () => {
        expect(
            resolveApiBaseUrl({
                API_URL: "http://api:8080",
                NEXT_PUBLIC_API_URL: "http://localhost:8080",
            }),
        ).toBe("http://api:8080");
    });

    it("falls back to NEXT_PUBLIC_API_URL on the host, where both resolve alike", () => {
        expect(
            resolveApiBaseUrl({ NEXT_PUBLIC_API_URL: "http://localhost:8080" }),
        ).toBe("http://localhost:8080");
    });

    it("treats an empty value as unset", () => {
        expect(
            resolveApiBaseUrl({
                API_URL: "",
                NEXT_PUBLIC_API_URL: "http://localhost:8080",
            }),
        ).toBe("http://localhost:8080");
    });

    it("strips a trailing slash so paths join predictably", () => {
        expect(resolveApiBaseUrl({ API_URL: "http://api:8080/" })).toBe(
            "http://api:8080",
        );
    });

    it("throws when neither is configured", () => {
        expect(() => resolveApiBaseUrl({})).toThrow(/API_URL/);
    });
});
