import {
    DomainError,
    DomainErrorKind,
} from "@/shared/domain/errors/domain.error.js";

export class InsufficientStockError extends DomainError {
    readonly code = "INSUFFICIENT_STOCK";
    readonly kind = DomainErrorKind.CONFLICT;
}
