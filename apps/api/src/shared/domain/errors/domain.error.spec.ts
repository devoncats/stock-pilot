import { describe, expect, it } from "vitest";
import {
    DomainError,
    DomainErrorKind,
} from "@/shared/domain/errors/domain.error.js";

class SampleError extends DomainError {
    readonly code = "SAMPLE_ERROR";
    readonly kind = DomainErrorKind.INVALID_OPERATION;
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

    it("classifies the failure without naming a transport", () => {
        const error = new SampleError("Sample error message");

        expect(error.kind).toBe(DomainErrorKind.INVALID_OPERATION);
    });
});
