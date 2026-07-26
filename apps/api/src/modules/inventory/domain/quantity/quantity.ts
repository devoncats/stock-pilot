import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export class Quantity {
    private constructor(private readonly _value: number) {}

    static create(value: number): Quantity {
        if (!Number.isInteger(value)) {
            throw new InvalidValueError("[Quantity]: Value must be an integer");
        }

        if (value < 0) {
            throw new InvalidValueError("[Quantity]: Value cannot be negative");
        }

        return new Quantity(value);
    }

    get value(): number {
        return this._value;
    }

    equals(other: Quantity): boolean {
        return this._value === other._value;
    }
}
