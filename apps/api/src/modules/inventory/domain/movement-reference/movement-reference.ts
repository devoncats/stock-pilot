import { ReferenceType } from "@stock-pilot/shared";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";
import { isUuid } from "@/shared/domain/uuid/is-uuid.js";

export class MovementReference {
    private constructor(
        private readonly _type: ReferenceType,
        private readonly _id: string | null,
    ) {}

    static create(type: ReferenceType, id: string | null): MovementReference {
        if (type === ReferenceType.MANUAL) {
            if (id !== null) {
                throw new InvalidValueError(
                    "[MovementReference]: Manual reference cannot carry an id",
                );
            }

            return new MovementReference(type, null);
        }

        if (!id) {
            throw new InvalidValueError(
                "[MovementReference]: Non-manual reference must carry a non-empty id",
            );
        }

        const normalizedId = id.trim().toLowerCase();

        if (!isUuid(normalizedId)) {
            throw new InvalidValueError(
                `[MovementReference]: UUID must be a valid UUID, got "${normalizedId}"`,
            );
        }

        return new MovementReference(type, normalizedId);
    }

    static manual(): MovementReference {
        return MovementReference.create(ReferenceType.MANUAL, null);
    }

    static purchaseOrder(id: string): MovementReference {
        return MovementReference.create(ReferenceType.PURCHASE_ORDER, id);
    }

    static customerOrder(id: string): MovementReference {
        return MovementReference.create(ReferenceType.CUSTOMER_ORDER, id);
    }

    get type(): ReferenceType {
        return this._type;
    }

    get id(): string | null {
        return this._id;
    }

    equals(other: MovementReference): boolean {
        return this._type === other._type && this._id === other._id;
    }
}
