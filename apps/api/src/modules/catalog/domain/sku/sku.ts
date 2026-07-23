export class Sku {
    private constructor(private readonly _value: string) {}

    static create(value: string): Sku {
        if (!value) {
            throw new Error("[Sku]: Value cannot be empty or whitespace-only");
        }

        if (value.trim().length === 0) {
            throw new Error("[Sku]: Value cannot be empty or whitespace-only");
        }

        const normalizedValue = value.trim().toUpperCase();

        return new Sku(normalizedValue);
    }

    get value(): string {
        return this._value;
    }

    equals(other: Sku): boolean {
        return this._value === other._value;
    }
}
