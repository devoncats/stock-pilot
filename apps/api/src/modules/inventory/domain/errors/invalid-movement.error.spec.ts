import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/errors/domain.error.js";
import { InvalidMovementError } from "./invalid-movement.error.js";

describe("InvalidMovementError", () => {
    it("is a domain error", () => {
        const error = new InvalidMovementError("Invalid movement provided");

        expect(error).toBeInstanceOf(DomainError);
    });

    it("carries a stable machine-readable code", () => {
        const error = new InvalidMovementError("Invalid movement provided");

        expect(error.code).toBe("INVALID_MOVEMENT");
    });
});
