import { describe, expect, it } from "vitest";
import { isUuid } from "./is-uuid.js";

describe("isUuid", () => {
    it("returns true for a valid UUID v4", () => {
        expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });

    it("returns true for a valid UUID v7", () => {
        expect(isUuid("018f8a1e-1c4b-7f4a-9c2b-5e6f7a8b9c0d")).toBe(true);
    });

    it("returns true for uppercase UUIDs", () => {
        expect(isUuid("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
    });

    it("returns false for UUIDs without hyphens", () => {
        expect(isUuid("123e4567e89b12d3a456426614174000")).toBe(false);
    });

    it("returns false for UUIDs with braces", () => {
        expect(isUuid("{123e4567-e89b-12d3-a456-426614174000}")).toBe(false);
    });

    it("returns false for UUIDs with 35 or 37 characters", () => {
        expect(isUuid("123e4567-e89b-12d3-a456-42661417400")).toBe(false);
        expect(isUuid("123e4567-e89b-12d3-a456-4266141740000")).toBe(false);
    });

    it("returns false for UUIDs with non-hexadecimal characters", () => {
        expect(isUuid("123e4567-e89b-12d3-a456-42661417400g")).toBe(false);
    });

    it("returns false for an empty string", () => {
        expect(isUuid("")).toBe(false);
    });
});
