import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/errors/domain.error.js";

class SampleError extends DomainError {
    readonly code = "SAMPLE_ERROR";
}

describe("DomainError", () => {
    it("is an Error subclass, so it survives async boundaries and logging", () => {
        const error = new SampleError("Sample error message");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DomainError);

        expect(error.message).toBe("Sample error message");
    });

    it("names itself after the concrete subclass", () => {
        const error = new SampleError("Sample error message");

        expect(error.name).toBe("SampleError");
    });
});
