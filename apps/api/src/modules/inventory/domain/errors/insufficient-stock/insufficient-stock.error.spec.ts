import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/errors/domain.error.js";
import { InsufficientStockError } from "./insufficient-stock.error.js";

describe("InsufficientStockError", () => {
    it("is a domain error", () => {
        const error = new InsufficientStockError("Insufficient stock provided");

        expect(error).toBeInstanceOf(DomainError);
    });

    it("carries a stable machine-readable code", () => {
        const error = new InsufficientStockError("Insufficient stock provided");

        expect(error.code).toBe("INSUFFICIENT_STOCK");
    });
});
