export enum DomainErrorKind {
    INVALID_OPERATION = "invalid_operation",
    CONFLICT = "conflict",
    NOT_FOUND = "not_found",
}

export abstract class DomainError extends Error {
    abstract readonly code: string;
    abstract readonly kind: DomainErrorKind;

    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}
