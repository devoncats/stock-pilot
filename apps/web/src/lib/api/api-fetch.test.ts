import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import { apiFetch } from "./api-fetch";

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

describe("apiFetch", () => {
    beforeEach(() => {
        vi.stubEnv("API_URL", "http://api:8080");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("builds the URL from base, api prefix, path and query", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("/inventory", { offset: 25, limit: 25 });

        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "http://api:8080/api/v1/inventory?offset=25&limit=25",
        );
    });

    it("never caches, so a refresh shows current stock", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
        vi.stubGlobal("fetch", fetchMock);

        await apiFetch("/kpis");

        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
            cache: "no-store",
        });
    });

    it("returns the parsed body", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ totalSkus: 52 })),
        );

        await expect(apiFetch("/kpis")).resolves.toEqual({ totalSkus: 52 });
    });

    it("raises an ApiError carrying the status on a 404", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ message: "no" }, 404)),
        );

        const error: unknown = await apiFetch("/inventory/x").catch(
            (thrown: unknown) => thrown,
        );

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).isNotFound).toBe(true);
    });

    it("raises an ApiError with a null status when the API is unreachable", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
        );

        const error: unknown = await apiFetch("/kpis").catch(
            (thrown: unknown) => thrown,
        );

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBeNull();
    });
});
