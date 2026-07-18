import { describe, expect, it } from "vitest";

import { isHealthStatus } from "./health.js";

describe("isHealthStatus", () => {
    it("accepts the canonical health payload", () => {
        expect(isHealthStatus({ status: "ok" })).toBe(true);
    });

    it("accepts payloads with additional properties", () => {
        expect(isHealthStatus({ status: "ok", version: "1.2.3" })).toBe(true);
    });

    it("rejects null", () => {
        expect(isHealthStatus(null)).toBe(false);
    });

    it("rejects undefined", () => {
        expect(isHealthStatus(undefined)).toBe(false);
    });

    it("rejects an empty object", () => {
        expect(isHealthStatus({})).toBe(false);
    });

    it("rejects an unknown status", () => {
        expect(isHealthStatus({ status: "down" })).toBe(false);
    });

    it("rejects a non-string status", () => {
        expect(isHealthStatus({ status: 1 })).toBe(false);
    });

    it("rejects a bare string", () => {
        expect(isHealthStatus("ok")).toBe(false);
    });

    it("rejects an array", () => {
        expect(isHealthStatus([])).toBe(false);
    });

    it("narrows the value to HealthStatus", () => {
        const value: unknown = { status: "ok" };

        if (!isHealthStatus(value)) {
            throw new Error("expected the guard to accept a valid payload");
        }

        expect(value.status).toBe("ok");
    });
});
