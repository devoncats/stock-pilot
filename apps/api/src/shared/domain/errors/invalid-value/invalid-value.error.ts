import { DomainError } from "@/shared/domain/errors/domain.error.js";

export class InvalidValueError extends DomainError {
    readonly code = "INVALID_VALUE";
}
