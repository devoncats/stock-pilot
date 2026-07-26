import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/errors/domain.error.js";
import { InvalidValueError } from "./invalid-value.error.js";

describe("InvalidValueError", () => {
    it("is a domain error", () => {
        const error = new InvalidValueError("Invalid value provided");

        expect(error).toBeInstanceOf(DomainError);
    });

    it("carries a stable machine-readable code", () => {
        const error = new InvalidValueError("Invalid value provided");

        expect(error.code).toBe("INVALID_VALUE");
    });
});
