import {
    DomainError,
    DomainErrorKind,
} from "@/shared/domain/errors/domain.error.js";

export class InvalidMovementError extends DomainError {
    readonly code = "INVALID_MOVEMENT";
    readonly kind = DomainErrorKind.INVALID_OPERATION;
}
