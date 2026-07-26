import { ReferenceType } from "@/generated/prisma/enums.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export class MovementReference {
    private constructor(
        private readonly _type: ReferenceType,
        private readonly _id: string | null,
    ) {}

    static create(type: ReferenceType, id: string | null): MovementReference {
        if (type === ReferenceType.MANUAL && id !== null) {
            throw new InvalidValueError(
                "[MovementReference]: Manual reference cannot carry an id",
            );
        }

        if (type !== ReferenceType.MANUAL && (!id || id.trim().length === 0)) {
            throw new InvalidValueError(
                "[MovementReference]: Non-manual reference must carry a non-empty id",
            );
        }

        return new MovementReference(type, id);
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
