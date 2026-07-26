import { DomainError } from "@/shared/domain/errors/domain.error.js";

export class InsufficientStockError extends DomainError {
    readonly code = "INSUFFICIENT_STOCK";
}
