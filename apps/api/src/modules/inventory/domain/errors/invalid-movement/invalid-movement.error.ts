import { DomainError } from "@/shared/domain/errors/domain.error.js";

export class InvalidMovementError extends DomainError {
    readonly code = "INVALID_MOVEMENT";
}
