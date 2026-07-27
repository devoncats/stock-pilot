import {
    DomainError,
    DomainErrorKind,
} from "@/shared/domain/errors/domain.error.js";

export class InvalidValueError extends DomainError {
    readonly code = "INVALID_VALUE";
    readonly kind = DomainErrorKind.INVALID_OPERATION;
}
