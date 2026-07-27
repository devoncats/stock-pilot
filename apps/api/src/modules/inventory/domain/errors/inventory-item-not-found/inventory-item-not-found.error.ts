import {
    DomainError,
    DomainErrorKind,
} from "@/shared/domain/errors/domain.error.js";

export class InventoryItemNotFoundError extends DomainError {
    readonly code = "INVENTORY_ITEM_NOT_FOUND";
    readonly kind = DomainErrorKind.NOT_FOUND;
}
